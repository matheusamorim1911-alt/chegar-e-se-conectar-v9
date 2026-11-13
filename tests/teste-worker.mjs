// Testa o Worker sem internet: simula a API da prefeitura com uma amostra e confere o filtro.
import worker, { alertaValido, faltaNoCorredor, etaOnibus, conferirAlerta, avisaOnibus, alertaNaHora, validade, lerGtfsRt, ajustarRt, linhaDaRota, filtrar, fcFiltrar, fcHora, extrairLinhas, naIlha, contarFora, linhaDeVerdade, completar, endpointValido, jwtVapid, vapid, avisaTiroteios } from '../worker/gps-fundao.js';
// A maior parte dos testes simula a API antiga (JSON): o GTFS Realtime responde 404 e o Worker volta a ela.
// Os testes do GTFS Realtime (no fim) ligam RT_MODO.
let RT_MODO = false, _f;
Object.defineProperty(globalThis, 'fetch', { configurable: true, get: () => RT_MODO ? _f : (u, o) => String(u).includes('/gtfs/realtime/') ? Promise.resolve(new Response('', { status: 404 })) : _f(u, o), set: v => { _f = v; } });
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
// como a API escreve: relógio de Brasília com "Z" no fim
const agoraFc = Date.now(), iso = ms => new Date(ms - 3 * 3600e3).toISOString();
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
  if (u.includes('/occurrences?idState=RJ&idCities=RIO')) return new Response(JSON.stringify({ data: occ, pageMeta: { hasNextPage: false } }), { headers: { 'x-last-update': '2026-11-07T17:00:00.000Z' } });
  return new Response('{}', { status: 404 }); };
const env = { FC_EMAIL: 'proj@ufrj.br', FC_SENHA: 's3gredo' };
const r4 = await worker.fetch(new Request('https://x.workers.dev/tiroteios'), env, { waitUntil() {} });
const j4 = await r4.json();
ok(j4.disponivel === true && j4.ocorrencias.length === 1 && j4.ocorrencias[0].id === 'a' && r4.headers.get('access-control-allow-origin') === '*', 'tiroteios: entra com a conta do projeto, acha o Rio pelo nome e devolve o resumo');
ok(j4.atualizado === '2026-11-07T17:00:00-03:00' && Math.abs(Date.now() - j4.ocorrencias[0].t - 40 * 60e3) < 5000, 'tiroteios: horário do registro e da base no fuso certo (40 min, base às 17h)');
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
// ---------- fuso das datas do Fogo Cruzado ----------
const t0 = Date.parse('2026-11-11T08:30:00-03:00');
ok(fcHora('2026-11-11T08:30:00.000Z') === t0 && fcHora('2026-11-11 08:30:00') === t0 && fcHora('2026-11-11T08:30:00-03:00') === t0 && fcHora('2026-11-11T11:30:00+00:00') !== t0 && fcHora('2026-11-11T08:30:00+00:00') === t0,
  'Fogo Cruzado: o relógio escrito vale como horário de Brasília, mesmo com "Z"');
const recente = fcFiltrar([{ id: 'z', date: new Date(Date.now() - 3 * 3600e3 - 10 * 60e3).toISOString(), latitude: '-22.8601', longitude: '-43.2433' }], Date.now());
ok(recente.length === 1 && Math.abs(Date.now() - recente[0].t - 10 * 60e3) < 2000, 'Fogo Cruzado: tiroteio de 10 min atrás aparece como 10 min, não 3 h 10 min');
// ---------- outras linhas dentro da ilha ----------
ok(naIlha(-22.8586, -43.2318) && naIlha(-22.8394, -43.2396), 'ilha: CT e terminal ficam dentro');
ok(!naIlha(-22.84346, -43.23961) && !naIlha(-22.866, -43.255) && !naIlha(-22.82, -43.22), 'ilha: Linha Vermelha, Av. Brasil e Ilha do Governador ficam de fora');
const t30 = '2026-11-07T10:14:30Z';
const outras = [
  { id_veiculo: 'N1', servico: '474', latitude: -22.8586, longitude: -43.2318, datetime: t30 },            // linha fora da lista, no CT
  { id_veiculo: 'N2', servico: '474', latitude: -22.84346, longitude: -43.23961, datetime: t30 },          // só passando pela Linha Vermelha
  { id_veiculo: 'N3', servico: '383', latitude: -22.8650, longitude: -43.2550, datetime: t30 },            // fora da lista, na Av. Brasil
  { id_veiculo: 'N4', servico: 'SVA485', latitude: '-22,8460', longitude: '-43,2240', datetime: t30 },     // variante nova, perto do HU
  { id_veiculo: 'N5', servico: '321', latitude: -22.8650, longitude: -43.2550, datetime: t30 }];           // da lista, nos acessos
const fo = filtrar(outras, agora);
ok(fo.map(o => o.v).sort().join() === 'N1,N4,N5' && fo.find(o => o.v === 'N1').f === 1 && !('f' in fo.find(o => o.v === 'N5')), 'outras linhas: entram só dentro da ilha, marcadas como fora da lista');
const cf = contarFora(fo);
ok(cf['474'].n === 1 && cf['SVA485'].v[0] === 'N4' && !cf['321'], 'outras linhas: contagem por linha para a aba Saúde');
const ordena = L => JSON.stringify(L.slice().sort((a, b) => a.v < b.v ? -1 : 1));
for (const [nome, fmt] of [['números', o => ({ ...o, latitude: +String(o.latitude).replace(',', '.'), longitude: +String(o.longitude).replace(',', '.') })], ['texto com vírgula', o => ({ ...o, latitude: String(o.latitude).replace('.', ','), longitude: String(o.longitude).replace('.', ',') })]]) {
  const T = JSON.stringify([...outras, ...cidade.slice(0, 50).map((o, i) => ({ ...o, latitude: -22.80 - i / 1000, longitude: -43.30 + i / 500 }))].map(fmt));
  ok(ordena(filtrar(extrairLinhas(T), agora)) === ordena(filtrar(JSON.parse(T), agora)), 'leitura leve acha as outras linhas da ilha (' + nome + ')');
}
// ---------- códigos que não são linha e resposta parcial ----------
ok(['GARAGEM', 'APOIO', 'MANUTENCAO', 'TR', '0', '00', ''].every(l => !linhaDeVerdade(l)) && ['474', 'SVA485', 'ESP01', '2343', '95'].every(linhaDeVerdade), 'códigos de fora de serviço (GARAGEM, APOIO, TR, 0…) não contam como linha');
const fs2 = filtrar([{ id_veiculo: 'G1', servico: 'GARAGEM', latitude: -22.8586, longitude: -43.2318, datetime: t30 }, { id_veiculo: 'G2', servico: '0', latitude: -22.8586, longitude: -43.2318, datetime: t30 },
  { id_veiculo: 'G3', servico: '95', latitude: -22.8650, longitude: -43.2550, datetime: t30 }], agora);
ok(fs2.length === 1 && fs2[0].v === 'G3' && !fs2[0].f, 'ônibus fora de serviço na ilha não aparecem; 95 (vista todo dia) entra também nos acessos');
const cp = completar([{ v: 'A', t: 1000e3 }], [{ v: 'A', t: 900e3 }, { v: 'B', t: 900e3 }, { v: 'C', t: 500e3 }], 1000e3);
ok(cp.map(o => o.v).join() === 'A,B' && cp[0].t === 1000e3, 'resposta parcial: completa com os ônibus guardados ainda válidos');
{ const g3 = new Map(); globalThis.caches = { default: { match: async r => g3.get(r.url)?.clone() ?? null, put: async (r, v) => { g3.set(r.url, v); } } };
  const agoraIso = () => new Date(Date.now() - 3 * 3600e3 - 30e3).toISOString().slice(0, 19) + 'Z';
  const vai = async () => { const cx = { esperas: [], waitUntil(p) { this.esperas.push(p); } }; const r = await worker.fetch(new Request('https://x.workers.dev/'), {}, cx); await Promise.all(cx.esperas); g3.delete('https://cache.local/gps-fundao'); return r.json(); };
  globalThis.fetch = async u => new Response(JSON.stringify(u.includes('sppo') ? [{ id_veiculo: 'S1', servico: '321', latitude: -22.8394, longitude: -43.2396, datetime: agoraIso() }] : [{ id_veiculo: 'E1', servico: '95', latitude: -22.8394, longitude: -43.2396, datetime: agoraIso() }]));
  const c1 = await vai();
  let pedidos = 0;
  globalThis.fetch = async u => { if (u.includes('sppo')) { pedidos++; return new Response('erro', { status: 500 }); } return new Response(JSON.stringify([{ id_veiculo: 'E1', servico: '95', latitude: -22.8400, longitude: -43.2396, datetime: agoraIso() }])); };
  const c2 = await vai();
  ok(c1.onibus.length === 2 && !c1.parcial && c2.parcial === true && c2.onibus.map(o => o.v).sort().join() === 'E1,S1', 'prefeitura do Rio com erro 500 nos ônibus comuns: eles continuam no mapa com a última posição');
  ok(pedidos === 2, 'erro 500: tenta mais uma vez antes de desistir');
  let vez = 0;
  globalThis.fetch = async u => { if (u.includes('sppo') && vez++ === 0) return new Response('erro', { status: 500 }); return new Response(JSON.stringify(u.includes('sppo') ? [{ id_veiculo: 'S1', servico: '321', latitude: -22.8394, longitude: -43.2396, datetime: agoraIso() }] : [])); };
  const c3 = await vai();
  ok(!c3.parcial && c3.onibus.some(o => o.v === 'S1'), 'erro 500 que passa na segunda tentativa: resposta completa');
}
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
globalThis.fetch = async u => new Response(JSON.stringify(u.includes('sppo') ? outras.map(o => ({ ...o, latitude: +String(o.latitude).replace(',', '.'), longitude: +String(o.longitude).replace(',', '.'), datetime: new Date(Date.now() - 3 * 3600e3 - 30e3).toISOString().slice(0, 19) + 'Z' })) : { veiculos: [] }));
await roda(); await roda();
const rf = await (await worker.fetch(new Request('https://x.workers.dev/saude'), {}, { waitUntil() {} })).json();
ok(rf.linhasFora && rf.linhasFora.linhas['474'].vezes === 2 && rf.linhasFora.linhas['474'].carros.join() === 'N1' && rf.linhasFora.linhas['SVA485'] && !rf.linhasFora.linhas['321'], 'saúde: linhas fora da lista vistas na ilha hoje');
// detalhe da Cloudflare: por que os pedidos falharam
globalThis.fetch = async (u, o) => { const b = JSON.parse(o.body);
  if (/status/.test(b.query)) return new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [
    { sum: { requests: 500, errors: 0 }, quantiles: { cpuTimeP50: 2100, cpuTimeP99: 14500 }, dimensions: { scriptName: 'w', status: 'success', datetimeHour: '2026-11-09T15:00:00Z' } },
    { sum: { requests: 120, errors: 120 }, quantiles: { cpuTimeP50: 11000, cpuTimeP99: 16000 }, dimensions: { scriptName: 'w', status: 'exceededResources', datetimeHour: '2026-11-09T15:00:00Z' } }] }] } } }));
  return new Response(JSON.stringify({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [{ sum: { requests: 620, errors: 120 }, dimensions: { scriptName: 'w' } }] }] } } })); };
const rd = await (await worker.fetch(new Request('https://x.workers.dev/saude'), { CF_CONTA: 'c', CF_TOKEN: 't' }, { waitUntil() {} })).json();
const D = rd.cloudflareDetalhe;
ok(D && D.porStatus.exceededResources === 120 && D.porHora[0].falhas === 120 && D.porHora[0].pedidos === 620 && D.cpuP99Ms === 16, 'saúde: falhas por motivo e por hora, e o tempo de processamento');
// ---------- notificações de tiroteio (Web Push) ----------
function kvFalso() { const m = new Map(); return { m,
  async get(k, t) { const x = m.get(k); return x ? (t === 'json' ? JSON.parse(x.v) : x.v) : null; },
  async getWithMetadata(k) { const x = m.get(k); return x ? { value: x.v, metadata: x.md || null } : null; },
  async put(k, v, o) { m.set(k, { v, md: o && o.metadata }); }, async delete(k) { m.delete(k); },
  async list({ prefix, limit, cursor }) { const ks = [...m.keys()].filter(k => k.startsWith(prefix) && (!cursor || k > cursor)).sort(), sl = ks.slice(0, limit);
    return { keys: sl.map(k => ({ name: k, metadata: m.get(k).md })), list_complete: limit >= ks.length, cursor: sl[sl.length - 1] }; } }; }
globalThis.caches = semCache;
const r9 = await worker.fetch(new Request('https://x.workers.dev/push/chave'), {}, { waitUntil() {} });
ok(r9.status === 503 && (await r9.json()).motivo === 'sem-kv', 'push: sem o KV ligado, avisa em vez de quebrar');
const KV = kvFalso(), envP = { PUSH: KV, FC_EMAIL: 'proj@ufrj.br', FC_SENHA: 's3gredo' };
const ch = await (await worker.fetch(new Request('https://x.workers.dev/push/chave'), envP, { waitUntil() {} })).json();
const ch2 = await (await worker.fetch(new Request('https://x.workers.dev/push/chave'), envP, { waitUntil() {} })).json();
ok(ch.disponivel && /^[A-Za-z0-9_-]{87}$/.test(ch.chave) && ch2.chave === ch.chave, 'push: chave pública criada uma vez e guardada no KV');
ok(!JSON.stringify(ch).includes('"d"'), 'push: a chave privada não sai do Worker');
ok(endpointValido('https://fcm.googleapis.com/fcm/send/abc') && endpointValido('https://web.push.apple.com/QK') && !endpointValido('https://exemplo.com/x') && !endpointValido('http://fcm.googleapis.com/x'), 'push: só aceita serviços de notificação conhecidos');
// o JWT VAPID é assinado com a chave guardada e confere com a pública
const jv = await vapid(envP), jwt = await jwtVapid(jv, 'https://fcm.googleapis.com', Date.now());
const [h64, c64, s64] = jwt.split('.'), dec = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const pubK = await crypto.subtle.importKey('raw', dec(jv.pub), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
const claims = JSON.parse(new TextDecoder().decode(dec(c64)));
ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubK, dec(s64), new TextEncoder().encode(h64 + '.' + c64)) && claims.aud === 'https://fcm.googleapis.com' && /^https:/.test(claims.sub) && claims.exp > Date.now() / 1000, 'push: JWT VAPID assinado e válido');
const assina = e => worker.fetch(new Request('https://x.workers.dev/push/assinar', { method: 'POST', body: JSON.stringify({ endpoint: e }) }), envP, { waitUntil() {} });
ok((await assina('https://exemplo.com/roubo')).status === 400, 'push: recusa endereço que não é de serviço de notificação');
for (let i = 0; i < 45; i++) await assina('https://fcm.googleapis.com/fcm/send/c' + i);
await assina('https://web.push.apple.com/morto');
ok([...KV.m.keys()].filter(k => k.startsWith('sub:')).length === 46, 'push: guarda as assinaturas');
// cron: tiroteio novo há 40 min → avisa todos, em lotes; registro velho (9 h) não avisa
const enviados = [];
globalThis.fetch = async (u, o) => { u = String(u);
  if (u.endsWith('/auth/login')) return new Response(JSON.stringify({ data: { accessToken: 'tok', expiresIn: 3600 } }), { status: 201 });
  if (u.endsWith('/states')) return new Response(JSON.stringify({ data: [{ id: 'RJ', name: 'Rio de Janeiro' }] }));
  if (u.includes('/cities?stateId=RJ')) return new Response(JSON.stringify({ data: [{ id: 'RIO', name: 'Rio de Janeiro' }] }));
  if (u.includes('/occurrences')) return new Response(JSON.stringify({ data: occ, pageMeta: { hasNextPage: false } }));
  if (/fcm\.googleapis|web\.push\.apple/.test(u)) { enviados.push({ u, a: o.headers.authorization, ttl: o.headers.ttl, corpo: o.body });
    return new Response('', { status: u.endsWith('morto') ? 410 : 201 }); }
  return new Response('{}', { status: 404 }); };
const cx = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
const a1 = await avisaTiroteios(envP, cx, Date.now());
ok(a1.r === 'avisou' && a1.novos === 1 && enviados.length === 40, 'push: tiroteio novo avisa o primeiro lote (40)');
ok(enviados.every(x => /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]{87}$/.test(x.a) && x.ttl === '7200' && x.corpo == null), 'push: aviso sem conteúdo, com VAPID e validade de 2 h');
const a2 = await avisaTiroteios(envP, cx, Date.now());
ok(enviados.length === 46 && !KV.m.has([...KV.m.keys()].find(k => k.startsWith('sub:') && KV.m.get(k).md.e.endsWith('morto'))), 'push: o resto vai no lote seguinte e assinatura vencida (410) sai');
const a3 = await avisaTiroteios(envP, cx, Date.now());
ok(a3.r === 'nada' && enviados.length === 46, 'push: o mesmo tiroteio não é avisado de novo');
const est = JSON.parse(KV.m.get('estado').v);
ok(est.envio.enviados === 45 && est.envio.removidos === 1, 'push: guarda o resultado do envio para a aba Saúde');
const rsP = await (await worker.fetch(new Request('https://x.workers.dev/saude'), envP, { waitUntil() {} })).json();
ok(rsP.push && rsP.push.assinantes === 45 && rsP.push.ultimoEnvio.enviados === 45, 'saúde: assinantes e último envio de notificações');
const sai = await worker.fetch(new Request('https://x.workers.dev/push/sair', { method: 'POST', body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/c0' }) }), envP, { waitUntil() {} });
ok(sai.status === 200 && [...KV.m.keys()].filter(k => k.startsWith('sub:')).length === 44, 'push: desligar no app apaga a assinatura');
const teste = () => worker.fetch(new Request('https://x.workers.dev/push/teste', { method: 'POST', body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/c1' }) }), envP, { waitUntil() {} });
const t1 = await (await teste()).json(), t2 = await teste();
ok(t1.ok === true && t2.status === 429, 'push: aviso de teste para quem assinou, no máximo um por minuto');
const tx = await (await worker.fetch(new Request('https://x.workers.dev/push/aviso', { method: 'POST', body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/c1' }) }), envP, { waitUntil() {} })).json();
ok(/tiroteio estão ligadas/.test(tx.corpo) && tx.tag === 'teste', 'push: o texto do teste de tiroteio vem de /push/aviso (o aparelho não precisa adivinhar)');
const t3 = await worker.fetch(new Request('https://x.workers.dev/push/teste', { method: 'POST', body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/naoassinou' }) }), envP, { waitUntil() {} });
ok(t3.status === 404, 'push: teste só para quem assinou');
// ---------- GTFS Realtime (API atual da prefeitura do Rio) ----------
// codificador mínimo de protobuf, só para montar um FeedMessage de teste
const pb = { vi(n) { const o = []; do { let b = n % 128; n = Math.floor(n / 128); if (n) b |= 128; o.push(b); } while (n); return o; },
  k(f, w) { return pb.vi(f * 8 + w); }, s(f, t) { const b = [...new TextEncoder().encode(t)]; return [...pb.k(f, 2), ...pb.vi(b.length), ...b]; },
  m(f, b) { return [...pb.k(f, 2), ...pb.vi(b.length), ...b]; }, u(f, n) { return [...pb.k(f, 0), ...pb.vi(n)]; },
  fl(f, x) { const a = new Uint8Array(4); new DataView(a.buffer).setFloat32(0, x, true); return [...pb.k(f, 5), ...a]; } };
const veiculo = (id, rid, la, lo, sp, br, tSeg) => pb.m(2, [...pb.s(1, 'e' + id), ...pb.m(4, [
  ...pb.m(1, [...pb.s(1, 'trip-uuid'), ...pb.s(5, rid), ...pb.u(6, 1)]), ...pb.m(2, [...pb.fl(1, la), ...pb.fl(2, lo), ...pb.fl(3, br), ...pb.fl(5, sp)]),
  ...pb.u(5, tSeg), ...pb.m(8, [...pb.s(1, id), ...pb.s(2, id)]), ...pb.s(7, 'parada-x')])]);
const feed = (L, tSeg) => new Uint8Array([...pb.m(1, [...pb.s(1, '2.0'), ...pb.u(3, tSeg)]), ...L.flat()]);
ok(linhaDaRota('O0321AAA0A') === '321' && linhaDaRota('O0803AAP0A') === 'SP803' && linhaDaRota('O0485AAA0A') === '485' && linhaDaRota('O0328ZZZ0A') === '328' && linhaDaRota('8f1e-uuid') === '', 'GTFS-RT: linha tirada do route_id da prefeitura do Rio');
ok(linhaDaRota('O0665AAVAA') === 'SVA665' && linhaDaRota('O0665AAVBA') === 'SVB665' && linhaDaRota('O0854AAAAA') === '854' && linhaDaRota('O0326AAPBA') === 'SPB326' && linhaDaRota('20000611130') === '61' && linhaDaRota('20000421110') === '42', 'GTFS-RT: variantes (SVA, SVB, SPB) e BRT (route_id numérico) vêm de ROTAS, tirado do routes.txt');
{ const ag = Date.now(), ts = Math.floor((ag - 25e3) / 1000);
  const longe = Array.from({ length: 60 }, (_, k) => veiculo('C' + k, 'O0' + (100 + k) + 'AAA0A', -22.95, -43.35, 30, 0, ts));
  const F = feed([veiculo('A1', 'O0321AAA0A', -22.8394, -43.2396, 36, 90, ts), veiculo('A2', 'O0803AAP0A', -22.8586, -43.2318, 0, 0, ts), veiculo('N1', 'O0474AAA0A', -22.8586, -43.2318, 20, 180, ts), ...longe], ts);
  const L = lerGtfsRt(F);
  ok(L.total === 63 && L.lista.length === 3 && L.resolvidos === 63 && L.ts === ts * 1000, 'GTFS-RT: lê o feed e só monta os veículos da região do Fundão');
  const a1 = L.lista.find(o => o.id_veiculo === 'A1');
  ok(a1.servico === '321' && Math.abs(a1.latitude + 22.8394) < 1e-5 && a1.direcao === 90 && a1.t === ts * 1000, 'GTFS-RT: posição, sentido e hora de cada veículo');
  const A = ajustarRt([...L.lista, ...longe.map((_, k) => ({ sp: 30 + k % 10, t: ts * 1000 }))], ag);
  ok(A.kmh && A.lista[0].velocidade === 36 && !A.desloc, 'GTFS-RT: velocidade em km/h (como a prefeitura do Rio manda) fica como está');
  const B = ajustarRt(L.lista.map(o => ({ ...o, sp: 10 })), ag);
  ok(!B.kmh && B.lista[0].velocidade === 36, 'GTFS-RT: se vier em m/s (o padrão), converte para km/h');
  const C = ajustarRt(L.lista.map(o => ({ ...o, t: o.t - 3 * 3600e3 })), ag);
  ok(C.desloc === 3 * 3600e3 && C.lista[0].datahora === ts * 1000, 'GTFS-RT: hora 3 h deslocada (Brasília marcada como UTC) é corrigida');
  const fo = filtrar(A.lista.slice(0, 3), ag);
  ok(fo.map(o => o.v + ':' + o.l + (o.f ? '*' : '')).sort().join() === 'A1:321,A2:SP803*,N1:474*' && fo.find(o => o.v === 'A1').t === ts * 1000, 'GTFS-RT: passa pelo mesmo filtro (linhas da lista e outras dentro da ilha)');
  // pelo Worker: GTFS-RT funcionando
  RT_MODO = true; const usadas = [];
  globalThis.fetch = async u => { usadas.push(String(u)); return /realtime\/onibus/.test(u) ? new Response(F) : /realtime\/brt/.test(u) ? new Response(feed([veiculo('B1', 'O0042AAA0A', -22.8394, -43.2396, 40, 0, ts)], ts)) : new Response('[]'); };
  globalThis.caches = { default: { match: async () => null, put: async () => {} } };
  const w1 = await (await worker.fetch(new Request('https://x.workers.dev/'), {}, { waitUntil() {} })).json();
  ok(w1.onibus.some(o => o.v === 'A1') && w1.onibus.some(o => o.v === 'B1' && o.l === '42') && !usadas.some(u => /gps\/(sppo|brt)/.test(u)), 'Worker usa o GTFS Realtime (ônibus e BRT) e não pede a API antiga');
  // GTFS-RT fora do ar: volta à API antiga
  usadas.length = 0;
  globalThis.fetch = async u => { usadas.push(String(u)); return /realtime/.test(u) ? new Response('', { status: 503 }) : new Response(JSON.stringify(/sppo/.test(u) ? [{ id_veiculo: 'V1', servico: '321', latitude: -22.8394, longitude: -43.2396, datetime: new Date(Date.now() - 3 * 3600e3 - 30e3).toISOString().slice(0, 19) + 'Z' }] : [])); };
  let reg = [];
  globalThis.caches = { default: { match: async r => r.url.includes('registro') ? new Response(JSON.stringify(reg)) : null, put: async (r, v) => { if (r.url.includes('registro')) reg = await v.json(); } } };
  const cx = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
  const w2 = await (await worker.fetch(new Request('https://x.workers.dev/'), {}, cx)).json(); await Promise.all(cx.esperas);
  const fsp = reg[reg.length - 1].fontes.find(f => f.f === 'sppo');
  ok(w2.onibus.some(o => o.v === 'V1') && fsp.via === 'json-antigo' && /HTTP 503/.test(fsp.motivo_rt), 'GTFS-RT fora do ar: usa a API antiga e registra o motivo');
  // formato desconhecido (route_id sem a linha): também volta e mostra exemplos na Saúde
  const opaco = feed(Array.from({ length: 40 }, (_, k) => veiculo('X' + k, 'f3a9-' + k, -22.95, -43.35, 30, 0, ts)), ts);
  globalThis.fetch = async u => /realtime\/onibus/.test(u) ? new Response(opaco) : /realtime/.test(u) ? new Response(feed([], ts)) : new Response('[]');
  const cx2 = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
  await worker.fetch(new Request('https://x.workers.dev/'), {}, cx2); await Promise.all(cx2.esperas);
  const f2 = reg[reg.length - 1].fontes.find(f => f.f === 'sppo');
  ok(f2.via === 'json-antigo' && /formato/.test(f2.motivo_rt) && f2.rotas && f2.rotas[0].startsWith('f3a9-'), 'GTFS-RT em formato desconhecido: volta à API antiga e guarda exemplos de route_id');
  // as duas fora do ar (depois de 30/11): falha com o motivo
  globalThis.fetch = async u => new Response('', { status: 404 });
  const cx3 = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
  await worker.fetch(new Request('https://x.workers.dev/'), {}, cx3); await Promise.all(cx3.esperas);
  const f3 = reg[reg.length - 1].fontes.find(f => f.f === 'sppo');
  ok(!f3.ok && /HTTP 404/.test(f3.motivo), 'GTFS-RT e API antiga fora do ar: falha com o motivo');
  // desempenho: feed do tamanho da cidade (~11 mil veículos)
  const grande = feed(Array.from({ length: 11000 }, (_, k) => veiculo('Z' + k, 'O0' + (100 + k % 900) + 'AAA0A', -22.9 - (k % 100) / 1000, -43.3 - (k % 70) / 1000, 30, 0, ts)), ts);
  const T = []; for (let r = 0; r < 30; r++) { const t0 = performance.now(); lerGtfsRt(grande); T.push(performance.now() - t0); } T.sort((a, b) => a - b);
  ok(T[15] < 15, 'GTFS-RT: lê o feed da cidade (' + Math.round(grande.length / 1024) + ' KB) em ' + T[15].toFixed(1) + ' ms (mediana)');
  // sincronia: a resposta vale até logo depois da próxima atualização da prefeitura do Rio
  const ag2 = 1794510000000;
  ok(validade([{ ok: true, ts: ag2 - 3000 }], ag2) === 7500 && validade([{ ok: true }], ag2) === 10000 && validade([{ ok: true, ts: ag2 - 300e3 }], ag2) === 10000,
    'sincronia: guarda até 0,5 s depois da próxima versão da prefeitura do Rio (no mínimo 2 s; sem hora, 10 s)');
  ok(validade([{ ok: true, ts: ag2 - 9000 }], ag2) === 10000 && validade([{ ok: true, ts: ag2 - 1000 }], ag2) === 9500, 'sincronia: perto de virar, espera a versão seguinte');
  RT_MODO = true;
  let pedidosRt = 0; const tsF = Math.floor((Date.now() - 4000) / 1000);
  globalThis.fetch = async u => { pedidosRt++; return /realtime\/onibus/.test(u) ? new Response(feed([veiculo('A1', 'O0321AAA0A', -22.8394, -43.2396, 36, 90, tsF)], tsF)) : new Response(feed([], tsF)); };
  const guard = new Map(); globalThis.caches = { default: { match: async r => guard.get(r.url)?.clone() ?? null, put: async (r, v) => { guard.set(r.url, v); } } };
  const cxs = { esperas: [], waitUntil(p) { this.esperas.push(p); } };
  const s1 = await worker.fetch(new Request('https://x.workers.dev/'), {}, cxs); await Promise.all(cxs.esperas);
  const p1 = +s1.headers.get('x-prox');
  const s2 = await worker.fetch(new Request('https://x.workers.dev/'), {}, { waitUntil() {} });
  const p2 = +s2.headers.get('x-prox');
  ok(p1 > 5000 && p1 <= 7000 && s2.headers.get('x-cache') === 'hit' && p2 <= p1 && p2 > p1 - 1000 && /x-prox/.test(s1.headers.get('access-control-expose-headers')), 'Worker diz ao app quando sai a próxima posição (x-prox), também na cópia guardada');
  RT_MODO = false;
}
// ---------- alertas de ônibus ----------
{ // corredor: rua reta de 2 km indo para o norte até o ponto (lat/lon × 1e5)
  const pontoLa = -22.8500, pontoLo = -43.2300, cor = []; for (let k = 20; k >= 0; k--) cor.push(Math.round((pontoLa - k * 0.0009) * 1e5), Math.round(pontoLo * 1e5));
  const ag = Date.now(), bus = (v, l, la, lo, vel, dir) => ({ v, l, la, lo, vel, dir, t: ag - 20e3 });
  const f1 = faltaNoCorredor(bus('B1', '485', pontoLa - 0.009, pontoLo, 30, 0), cor);
  ok(Math.abs(f1 - 995) < 15, 'alerta: distância que falta pelo traçado até o ponto (' + Math.round(f1) + ' m)');
  ok(faltaNoCorredor(bus('B2', '485', pontoLa - 0.009, pontoLo, 30, 180), cor) === null && faltaNoCorredor(bus('B3', '485', pontoLa - 0.009, pontoLo + 0.002, 30, 0), cor) === null, 'alerta: ônibus no sentido contrário ou fora da rua não conta');
  const e1 = etaOnibus(bus('B1', '485', 0, 0, 30, 0), 995, ag);
  ok(e1 > 120 && e1 < 200, 'alerta: tempo estimado até o ponto (' + Math.round(e1) + ' s para 1 km a 30 km/h)');
  const A = alertaValido({ id: 'a1', tipo: 'c', min: 5, nome: 'CCMN - Geografia', l: ['485'], cor: [cor], uma: 1, fim: ag + 3600e3 });
  ok(A && A.cor[0].length === 42 && alertaValido({ id: 'x', tipo: 'c', min: 5, cor: [] }) === null && alertaValido({ id: 'x', tipo: 'i', min: 99, horas: [600] }) === null, 'alerta: confere o que o app manda');
  const c1 = conferirAlerta(A, [bus('B9', '321', pontoLa - 0.004, pontoLo, 30, 0), bus('B1', '485', pontoLa - 0.009, pontoLo, 30, 0), bus('B7', '485', pontoLa - 0.017, pontoLo, 30, 0)], ag);
  ok(c1.length === 1 && /^485 chega em ~2 min$/.test(c1[0].t) && /Em CCMN - Geografia, a 1,0 km\. Carro B1\./.test(c1[0].c), 'alerta: avisa o ônibus da linha escolhida que está a menos de 5 min: ' + c1[0]?.t);
  ok(conferirAlerta({ ...A, l: ['913'] }, [bus('B1', '485', pontoLa - 0.009, pontoLo, 30, 0)], ag).length === 0 && conferirAlerta({ ...A, l: [] }, [bus('B1', '485', pontoLa - 0.009, pontoLo, 30, 0)], ag).length === 1 && conferirAlerta({ ...A, v: 'B7' }, [bus('B1', '485', pontoLa - 0.009, pontoLo, 30, 0)], ag).length === 0, 'alerta: outra linha não avisa; "qualquer linha" avisa; carro escolhido só ele');
  // dias e horário (horário do Rio)
  const seg10 = Date.parse('2026-11-09T10:00:00-03:00'), sab10 = Date.parse('2026-11-14T10:00:00-03:00');
  const sempre = { id: 's', tipo: 'i', min: 5, nome: 'CT', txt: 'Linha 1', horas: [604, 640], dias: [1, 2, 3, 4, 5], de: 420, ate: 1140 };
  ok(alertaNaHora(sempre, seg10) && !alertaNaHora(sempre, sab10) && !alertaNaHora(sempre, Date.parse('2026-11-09T20:00:00-03:00')) && !alertaNaHora({ ...A, fim: ag - 1 }, ag), 'alerta: vale só nos dias e horários escolhidos e até expirar');
  const ci = conferirAlerta(sempre, [], seg10);
  ok(ci.length === 1 && ci[0].t === 'Linha 1 passa em ~4 min' && conferirAlerta(sempre, [], seg10 + 10 * 60e3).length === 0, 'alerta das linhas internas: pelo horário estimado');
  // pelo Worker: guardar, conferir no gatilho, avisar uma vez, entregar o texto
  const KV2 = kvFalso(), env2 = { PUSH: KV2 }, EP = 'https://fcm.googleapis.com/fcm/send/onibus1';
  const post = (rota, corpo) => worker.fetch(new Request('https://x.workers.dev/push/' + rota, { method: 'POST', body: JSON.stringify(corpo) }), env2, { waitUntil() {} });
  const g1 = await (await post('alertas', { endpoint: EP, alertas: [{ id: 'a1', tipo: 'c', min: 5, nome: 'CCMN - Geografia', l: ['485'], cor: [cor], uma: 1, fim: Date.now() + 3600e3 }, { id: 'ruim', tipo: 'c', min: 5 }] })).json();
  ok(g1.ok && g1.n === 1 && Object.keys(JSON.parse(KV2.m.get('alertas').v)).length === 1, 'alerta: o Worker guarda os alertas válidos do aparelho');
  RT_MODO = true; const tsA = Math.floor((Date.now() - 20e3) / 1000), pushes = [];
  // 485 a ~1 km do ponto (dentro da região do Fundão), a 30 km/h rumo norte
  globalThis.fetch = async (u, o) => { u = String(u); if (/fcm\.googleapis/.test(u)) { pushes.push({ u, topic: o.headers.topic, corpo: o.body }); return new Response('', { status: 201 }); }
    return /realtime\/onibus/.test(u) ? new Response(feed([veiculo('B1', 'O0485AAA0A', pontoLa - 0.009, pontoLo, 30, 0, tsA)], tsA)) : new Response(feed([], tsA)); };
  globalThis.caches = { default: { match: async () => null, put: async () => {} } };
  const r1 = await avisaOnibus(env2, { waitUntil() {} }, Date.now());
  ok(r1.r === 'avisou' && pushes.length === 1 && pushes[0].u === EP && pushes[0].topic === 'onibus' && pushes[0].corpo == null, 'alerta: o gatilho acha o ônibus chegando e manda o aviso ao aparelho');
  const av = await (await post('aviso', { endpoint: EP })).json();
  ok(/^485 chega em ~\d min$/.test(av.titulo) && /CCMN - Geografia/.test(av.corpo) && av.tag === 'onibus-a1', 'alerta: o service worker recebe o texto do aviso (' + av.titulo + ')');
  const r2 = await avisaOnibus(env2, { waitUntil() {} }, Date.now() + 60e3);
  ok(r2.r === 'nada' && pushes.length === 1, 'alerta "só o próximo": não avisa de novo');
  const outro = await (await post('aviso', { endpoint: 'https://fcm.googleapis.com/fcm/send/outro' })).json();
  ok(outro.nada === true, 'alerta: o texto de um aparelho não vai para outro');
  // "só o próximo" que já avisou: o app é avisado (feitos) e o Worker não guarda de novo
  const gf = await (await post('alertas', { endpoint: EP, alertas: [{ id: 'a1', tipo: 'c', min: 5, nome: 'CCMN - Geografia', l: ['485'], cor: [cor], uma: 1, fim: Date.now() + 3600e3 }, { id: 'f2', tipo: 'c', min: 5, nome: 'Y', l: [], cor: [cor], dias: [0, 1, 2, 3, 4, 5, 6], de: 0, ate: 1439 }] })).json();
  ok(gf.feitos.length === 1 && gf.feitos[0] === 'a1' && gf.n === 1, 'alerta de uma vez já avisado: o Worker devolve em "feitos" e não guarda de novo');
  // teste do aviso de ônibus: um por minuto, mesmo sem alerta
  pushes.length = 0; globalThis.fetch = async (u, o) => { u = String(u); if (/fcm\.googleapis/.test(u)) { pushes.push({ u, topic: o.headers.topic }); return new Response('', { status: 201 }); } return new Response(''); };
  const te1 = await (await post('teste', { endpoint: 'https://fcm.googleapis.com/fcm/send/semalerta', tipo: 'onibus' })).json(), te2 = await post('teste', { endpoint: 'https://fcm.googleapis.com/fcm/send/semalerta', tipo: 'onibus' });
  const tav = await (await post('aviso', { endpoint: 'https://fcm.googleapis.com/fcm/send/semalerta' })).json();
  ok(te1.ok === true && te2.status === 429 && pushes.length === 1 && pushes[0].topic === 'onibus' && /^Teste/.test(tav.titulo), 'teste do aviso de ônibus: manda o aviso com o texto de teste, no máximo um por minuto');
  let buscou = 0; globalThis.fetch = async u => { buscou++; return new Response(feed([], tsA)); };
  await post('alertas', { endpoint: EP, alertas: [{ id: 'a2', tipo: 'c', min: 5, nome: 'X', l: [], cor: [cor], dias: [1], de: 0, ate: 1 }] });
  await avisaOnibus(env2, { waitUntil() {} }, Date.parse('2026-11-11T15:00:00-03:00'));
  ok(buscou === 0, 'alerta fora do horário: o Worker nem busca as posições');
  await post('alertas', { endpoint: EP, alertas: [] });
  ok(Object.keys(JSON.parse(KV2.m.get('alertas').v)).length === 0 && (await avisaOnibus(env2, { waitUntil() {} }, Date.now())).r === 'nada', 'alerta: apagar no app tira o aparelho do Worker');
  RT_MODO = false;
}
process.exit(falhou ? 1 : 0);
