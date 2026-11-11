// Testa o Worker sem internet: simula a API da prefeitura com uma amostra e confere o filtro.
import worker, { filtrar, fcFiltrar, fcHora, extrairLinhas, naIlha, contarFora, endpointValido, jwtVapid, vapid, avisaTiroteios } from '../worker/gps-fundao.js';
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
const t3 = await worker.fetch(new Request('https://x.workers.dev/push/teste', { method: 'POST', body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/naoassinou' }) }), envP, { waitUntil() {} });
ok(t3.status === 404, 'push: teste só para quem assinou');
process.exit(falhou ? 1 : 0);
