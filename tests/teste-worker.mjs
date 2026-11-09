// Testa o Worker sem internet: simula a API da prefeitura com uma amostra e confere o filtro.
import worker, { filtrar, fcFiltrar, extrairLinhas } from '../worker/gps-fundao.js';
let falhou = false; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA') + '  ' + m); if (!c) falhou = true; };
const agora = Date.parse('2026-11-07T10:15:00-03:00');
const amostra = [
  { id_veiculo: 'A1', servico: '321', latitude: -22.8394, longitude: -43.2396, datetime: '2026-11-07T10:14:30Z' }, // no terminal
  { id_veiculo: 'A1', servico: '321', latitude: -22.8400, longitude: -43.2390, datetime: '2026-11-07T10:13:30Z' }, // mais antiga
  { id_veiculo: 'B2', servico: '919', latitude: -22.8500, longitude: -43.2400, datetime: '2026-11-07T10:14:00Z' }, // linha que não entra
  { id_veiculo: 'C3', servico: '485', latitude: -22.9700, longitude: -43.1800, datetime: '2026-11-07T10:14:00Z' }, // longe (Zona Sul)
  { id_veiculo: 'D4', servico: '913', latitude: -22.8600, longitude: -43.2270, datetime: '2026-11-07T09:50:00Z' }, // velha
];
const r = filtrar(amostra, agora);
ok(r.length === 1 && r[0].v === 'A1', 'mantém só linhas do Fundão, na região, recentes, 1 por ônibus');
ok(r[0].t === Date.parse('2026-11-07T10:14:30-03:00'), 'hora tratada como horário de Brasília');
globalThis.caches = { default: { match: async () => null, put: async () => {} } };
let urls = [];
globalThis.fetch = async u => { urls.push(u); return new Response(JSON.stringify(u.includes('sppo') ? amostra.map(o => ({ ...o, datetime: new Date(Date.now() - 3 * 3600e3 - 30e3).toISOString().slice(0, 19) + 'Z' })) : []), { status: 200 }); };
const resp = await worker.fetch(new Request('https://x.workers.dev/'), {}, { waitUntil() {} });
const j = await resp.json();
ok(resp.headers.get('access-control-allow-origin') === '*', 'CORS liberado');
ok(urls[0].includes('dataInicial=') && urls[0].includes('+'), 'pede período no formato da API');
ok(j.onibus.map(o => o.l).sort().join() === '321,913', 'resposta pequena só com os ônibus certos');
// prefeitura fora do ar: devolve a última resposta boa
const guardado = new Map();
globalThis.caches = { default: { match: async r => guardado.get(r.url)?.clone() ?? null, put: async (r, v) => { guardado.set(r.url, v); } } };
const ctx = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
await worker.fetch(new Request('https://x.workers.dev/'), {}, ctx); await Promise.all(ctx.esperas);
guardado.delete('https://cache.local/gps-fundao');
globalThis.fetch = async () => { throw new Error('fora do ar'); };
const r2 = await worker.fetch(new Request('https://x.workers.dev/'), {}, { waitUntil() {} });
ok(r2.headers.get('x-cache') === 'antiga' && (await r2.json()).onibus.length === 2, 'prefeitura fora do ar: usa a última resposta boa');
// ---------- tiroteios (Fogo Cruzado) ----------
const semCache = { default: { match: async () => null, put: async () => {} } };
globalThis.caches = semCache;
const r3 = await worker.fetch(new Request('https://x.workers.dev/tiroteios'), {}, { waitUntil() {} });
const j3 = await r3.json();
ok(j3.disponivel === false && j3.motivo === 'sem-conta', 'tiroteios: sem a conta configurada, avisa em vez de inventar dados');
const agoraFc = Date.now(), iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
const occ = [
  { id: 'a', date: iso(agoraFc - 40 * 60e3), latitude: '-22.8601', longitude: '-43.2433', address: 'Av. Brasil, Maré', neighborhood: { name: 'Maré' }, policeAction: true, victims: [{ situation: 'Ferido' }] },
  { id: 'b', date: iso(agoraFc - 9 * 3600e3), latitude: '-22.8601', longitude: '-43.2433', address: 'antigo', neighborhood: { name: 'Maré' }, victims: [] },
  { id: 'c', date: iso(agoraFc - 30 * 60e3), latitude: '-22.9711', longitude: '-43.1822', address: 'longe', neighborhood: { name: 'Copacabana' }, victims: [] }];
const f = fcFiltrar(occ, agoraFc);
ok(f.length === 1 && f[0].id === 'a' && f[0].vitimas === 1 && f[0].policia === true && f[0].bairro === 'Maré' && !('victims' in f[0]), 'tiroteios: só recentes, perto do Fundão, só a contagem de vítimas');
const pedidos = [];
globalThis.fetch = async (u, o) => { pedidos.push(String(u));
  if (u.endsWith('/auth/login')) { const b = JSON.parse(o.body); return new Response(JSON.stringify({ data: b.email === 'proj@ufrj.br' && b.password === 's3gredo' ? { accessToken: 'tok', expiresIn: 3600 } : {} }), { status: 201 }); }
  if (!o || !o.headers || o.headers.authorization !== 'Bearer tok') return new Response('{}', { status: 401 });
  if (u.endsWith('/states')) return new Response(JSON.stringify({ data: [{ id: 'PE', name: 'Pernambuco' }, { id: 'RJ', name: 'Rio de Janeiro' }] }));
  if (u.includes('/cities?stateId=RJ')) return new Response(JSON.stringify({ data: [{ id: 'NIT', name: 'Niterói' }, { id: 'RIO', name: 'Rio de Janeiro' }] }));
  if (u.includes('/occurrences?idState=RJ&idCities=RIO')) return new Response(JSON.stringify({ data: occ, pageMeta: { hasNextPage: false } }), { headers: { 'x-last-update': '2026-11-07T17:00:00-03:00' } });
  return new Response('{}', { status: 404 }); };
const env = { FC_EMAIL: 'proj@ufrj.br', FC_SENHA: 's3gredo' };
const r4 = await worker.fetch(new Request('https://x.workers.dev/tiroteios'), env, { waitUntil() {} });
const j4 = await r4.json();
ok(j4.disponivel === true && j4.ocorrencias.length === 1 && j4.ocorrencias[0].id === 'a' && r4.headers.get('access-control-allow-origin') === '*', 'tiroteios: entra com a conta do projeto, acha o Rio pelo nome e devolve o resumo');
ok(!JSON.stringify(j4).includes('s3gredo') && !JSON.stringify(j4).includes('tok'), 'tiroteios: senha e chave da API nunca vão para o app');
globalThis.fetch = async () => { throw new Error('fora do ar'); };
const r5 = await worker.fetch(new Request('https://x.workers.dev/tiroteios'), env, { waitUntil() {} });
const j5 = await r5.json();
ok(j5.disponivel === false && j5.motivo === 'erro', 'tiroteios: API fora do ar sem cópia guardada avisa que não há dados');
// ---------- saúde: uso da cota da Cloudflare ----------
const r6 = await worker.fetch(new Request('https://x.workers.dev/saude'), {}, { waitUntil() {} });
const j6 = await r6.json();
ok(j6.cloudflareConfigurado === false && j6.cloudflare === null && j6.tiroteiosConfigurado === false, 'saúde: sem segredos, informa o que falta configurar');
globalThis.fetch = async (u, o) => { const b = JSON.parse(o.body); if (o.headers.authorization !== 'Bearer cft' || b.variables.c !== 'conta1') return new Response('{}', { status: 403 });
  return new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [{ sum: { requests: 1200, errors: 3 }, dimensions: { scriptName: 'shrill-pond-6c06' } }, { sum: { requests: 300, errors: 0 }, dimensions: { scriptName: 'outro' } }] }] } } })); };
const r7 = await worker.fetch(new Request('https://x.workers.dev/saude'), { CF_CONTA: 'conta1', CF_TOKEN: 'cft' }, { waitUntil() {} });
const j7 = await r7.json();
ok(j7.cloudflare && j7.cloudflare.pedidos === 1500 && j7.cloudflare.erros === 3 && j7.cloudflare.porWorker['shrill-pond-6c06'] === 1200 && !JSON.stringify(j7).includes('cft'), 'saúde: soma os pedidos do dia na conta, sem expor o token');
const r8 = await worker.fetch(new Request('https://x.workers.dev/saude'), { CF_CONTA: ' conta1\n', CF_TOKEN: '"Bearer cft"\n' }, { waitUntil() {} });
const j8 = await r8.json();
ok(j8.cloudflare && j8.cloudflare.pedidos === 1500, 'saúde: aceita segredos colados com espaço, aspas, quebra de linha ou "Bearer"');
// ---------- leitura leve da resposta da prefeitura ----------
const cidade = [];for (let i = 0; i < 3000; i++) cidade.push({ id_veiculo: 'X' + i, servico: i % 9 ? String(100 + i % 500) : '485', sentido: 'I', latitude: -22.85, longitude: -43.23, velocidade: 10, direcao: 90, route_id: 'r', trip_id: 't', shape_id: 's', datetime: '2026-11-07T10:14:30Z' });
const txt = JSON.stringify(cidade);
ok(JSON.stringify(filtrar(extrairLinhas(txt), agora)) === JSON.stringify(filtrar(JSON.parse(txt), agora)), 'leitura leve: mesmos ônibus que ler a resposta inteira');
ok(extrairLinhas('{"veiculos":[{"linha":"42"}]}') === null, 'formato sem "servico" (BRT) cai na leitura normal');
// ---------- registro das tentativas com a prefeitura (aba Saúde) ----------
const g2 = new Map();
globalThis.caches = { default: { match: async r => g2.get(r.url)?.clone() ?? null, put: async (r, v) => { g2.set(r.url, v); } } };
const roda = async () => { const cx = { esperas: [], waitUntil(p) { this.esperas.push(p); } }; const r = await worker.fetch(new Request('https://x.workers.dev/'), {}, cx); await Promise.all(cx.esperas); g2.delete('https://cache.local/gps-fundao'); return r; };
globalThis.fetch = async u => u.includes('sppo') ? new Response('erro', { status: 503 }) : new Response('{"veiculos":[]}');
await roda();
globalThis.fetch = async u => { const e = new Error('The operation was aborted due to timeout'); e.name = 'TimeoutError'; throw e; };
await roda();
globalThis.fetch = async u => new Response(JSON.stringify(u.includes('sppo') ? amostra.map(o => ({ ...o, datetime: new Date(Date.now() - 3 * 3600e3 - 30e3).toISOString().slice(0, 19) + 'Z' })) : { veiculos: [] }));
await roda();
const rs = await (await worker.fetch(new Request('https://x.workers.dev/saude'), {}, { waitUntil() {} })).json();
const R = rs.registro || [];
ok(R.length === 3 && R[0].r === 'parcial' && /HTTP 503 \(erro no servidor dela\)/.test(R[0].fontes.find(f => f.f === 'sppo').motivo), 'registro: HTTP 503 da prefeitura com o motivo em palavras');
ok(R[1].r === 'reserva' && /não respondeu em 8 s/.test(R[1].fontes[0].motivo), 'registro: tempo esgotado, e o app recebeu a cópia guardada');
ok(R[2].r === 'ok' && R[2].fontes.every(f => f.ok && f.ms >= 0 && f.kb >= 0), 'registro: tentativa boa com tempo e tamanho');
// detalhe da Cloudflare: por que os pedidos falharam
globalThis.fetch = async (u, o) => { const b = JSON.parse(o.body);
  if (/status/.test(b.query)) return new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [
    { sum: { requests: 500, errors: 0 }, quantiles: { cpuTimeP50: 2100, cpuTimeP99: 14500 }, dimensions: { scriptName: 'w', status: 'success', datetimeHour: '2026-11-09T15:00:00Z' } },
    { sum: { requests: 120, errors: 120 }, quantiles: { cpuTimeP50: 11000, cpuTimeP99: 16000 }, dimensions: { scriptName: 'w', status: 'exceededResources', datetimeHour: '2026-11-09T15:00:00Z' } }] }] } } }));
  return new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [{ sum: { requests: 620, errors: 120 }, dimensions: { scriptName: 'w' } }] }] } } })); };
const rd = await (await worker.fetch(new Request('https://x.workers.dev/saude'), { CF_CONTA: 'c', CF_TOKEN: 't' }, { waitUntil() {} })).json();
const D = rd.cloudflareDetalhe;
ok(D && D.porStatus.exceededResources === 120 && D.porHora[0].falhas === 120 && D.porHora[0].pedidos === 620 && D.cpuP99Ms === 16, 'saúde: falhas por motivo e por hora, e o tempo de processamento');
process.exit(falhou ? 1 : 0);
