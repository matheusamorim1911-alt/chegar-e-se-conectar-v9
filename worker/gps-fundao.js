// Cloudflare Worker: posição ao vivo dos ônibus que atendem o Fundão.
// Busca a API aberta da prefeitura (dados.mobilidade.rio), filtra só as linhas do app
// e a região da Ilha do Fundão, e devolve um JSON pequeno com CORS liberado.
// O resultado fica guardado por 5 segundos: todos os usuários usam a mesma cópia, então a prefeitura recebe
// no máximo 1 pedido a cada 5 s por fonte (por data center da Cloudflare), não importa quantas pessoas usem o app.
// Se a prefeitura falhar ou demorar, devolve a última resposta boa (até 2 min), marcada com x-cache: antiga.
// Em /tiroteios, entrega os tiroteios recentes perto das saídas do Fundão (Fogo Cruzado), para quem ligou o aviso no app.

const LINHAS = new Set(['321','323','324','325','326','327','328','329','42','43','485','486','616','634','635','663','696','90','901','910','913','915','922','975','979','SN324','SN328','SN696','SP324','SP328','SP329','SP485','SP635','SPB326','SR328','SV922','SVB901']);
// Ilha do Fundão e acessos (Linha Vermelha, Av. Brasil e pontes); fica de fora a garagem na Ilha do Governador
const AREA = { latMin: -22.885, latMax: -22.825, lonMin: -43.27, lonMax: -43.195 };
const FONTES = ['https://dados.mobilidade.rio/gps/sppo', 'https://dados.mobilidade.rio/gps/brt'];
const CACHE_S = 5, RESERVA_S = 120, JANELA_MIN = 4, VELHO_MIN = 6;

// A API usa horário de Brasília (UTC-3) e pede datas assim: 2026-11-07+10:10:00
function dataRio(ms) {
  const d = new Date(ms - 3 * 3600e3), p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}+${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
// "2026-11-07T10:09:50Z" vem marcado como UTC, mas é horário de Brasília
function horaRio(v) {
  if (v == null) return NaN;
  if (typeof v === 'number' || /^\d+$/.test(String(v))) return +v;
  return Date.parse(String(v).replace(/Z$/, '').replace(' ', 'T') + '-03:00');
}
const num = v => typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
const pega = (o, ks) => { for (const k of ks) if (o[k] != null && o[k] !== '') return o[k]; };

export function filtrar(lista, agora) {
  const porOnibus = new Map();
  for (const o of lista) {
    const linha = String(pega(o, ['servico', 'linha', 'route_short_name']) ?? '').trim().toUpperCase();
    if (!LINHAS.has(linha)) continue;
    const la = num(pega(o, ['latitude', 'lat'])), lo = num(pega(o, ['longitude', 'lon', 'lng']));
    if (!(la >= AREA.latMin && la <= AREA.latMax && lo >= AREA.lonMin && lo <= AREA.lonMax)) continue;
    const t = horaRio(pega(o, ['datetime', 'datahora', 'dataHora', 'timestamp']));
    if (!(t > agora - VELHO_MIN * 60e3)) continue;
    const id = String(pega(o, ['id_veiculo', 'ordem', 'codigo', 'veiculo']) ?? '');
    const atual = porOnibus.get(id);
    if (atual && atual.t >= t) continue;
    porOnibus.set(id, { v: id, l: linha, s: pega(o, ['sentido']) ?? '', la: +la.toFixed(6), lo: +lo.toFixed(6), vel: Math.round(num(pega(o, ['velocidade'])) || 0), dir: ((Math.round(num(pega(o, ['direcao'])) || 0) % 360) + 360) % 360, t });
  }
  return [...porOnibus.values()];
}

async function buscar(agora) {
  const q = `?dataInicial=${dataRio(agora - JANELA_MIN * 60e3)}&dataFinal=${dataRio(agora)}`;
  let falhas = 0;
  const partes = await Promise.all(FONTES.map(async u => {
    try {
      const r = await fetch(u + q, { headers: { 'user-agent': 'chega-ai-ufrj (UFRJ)' }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { falhas++; return []; }
      const d = await r.json();
      return Array.isArray(d) ? d : (d.veiculos || d.data || []);
    } catch (e) { falhas++; return []; }
  }));
  return { onibus: filtrar(partes.flat(), agora), falhou: falhas === FONTES.length };
}

// ---------- Tiroteios perto das saídas do Fundão (API Fogo Cruzado v2, conteúdo de uso livre) ----------
// A conta é do projeto: e-mail e senha ficam só nos segredos do Worker (FC_EMAIL e FC_SENHA), nunca no app.
// O Worker consulta a cada 5 min (uma vez para todos os usuários) e entrega só o necessário: hora, local e bairro,
// se houve ação policial e quantas vítimas. Nada sobre as vítimas além da contagem.
const FC = 'https://api-service.fogocruzado.org.br/api/v2';
const FC_CACHE_S = 300, FC_RESERVA_S = 1800, FC_JANELA_H = 6;
// Ilha do Fundão e acessos: Linha Vermelha, Av. Brasil, Maré, Bonsucesso, Penha, Manguinhos e a ponte para a Ilha do Governador
export const FC_AREA = { latMin: -22.90, latMax: -22.80, lonMin: -43.30, lonMax: -43.18 };
let fcToken = '', fcExp = 0, fcLocal = null;
const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
async function fcLogin(env) {
  const r = await fetch(FC + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.FC_EMAIL, password: env.FC_SENHA }), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('login ' + r.status);
  const d = (await r.json()).data || {};
  fcToken = d.accessToken || ''; fcExp = Date.now() + Math.max(300, +d.expiresIn || 3600) * 1000;
  if (!fcToken) throw new Error('sem token');
}
async function fcGet(env, caminho) {
  if (!fcToken || Date.now() > fcExp - 120e3) await fcLogin(env);
  let r = await fetch(FC + caminho, { headers: { authorization: 'Bearer ' + fcToken }, signal: AbortSignal.timeout(10000) });
  if (r.status === 401) { await fcLogin(env); r = await fetch(FC + caminho, { headers: { authorization: 'Bearer ' + fcToken }, signal: AbortSignal.timeout(10000) }); }
  if (!r.ok) throw new Error(caminho + ' ' + r.status);
  return { d: await r.json(), atualizado: r.headers.get('x-last-update') || '' };
}
// estado e cidade do Rio de Janeiro: busca os ids pelo nome (não depende de ids fixos que podem mudar)
async function fcIds(env) {
  if (fcLocal) return fcLocal;
  const est = ((await fcGet(env, '/states')).d.data || []).find(e => semAcento(e.name) === 'RIO DE JANEIRO');
  if (!est) throw new Error('estado RJ não encontrado');
  const cid = ((await fcGet(env, '/cities?stateId=' + est.id)).d.data || []).find(c => semAcento(c.name) === 'RIO DE JANEIRO');
  if (!cid) throw new Error('cidade do Rio não encontrada');
  return (fcLocal = { estado: est.id, cidade: cid.id });
}
// datas da API: horário de Brasília (com ou sem o -03:00 escrito)
const fcHora = v => { const s = String(v || ''); return Date.parse(/[+-]\d\d:?\d\d$|Z$/.test(s) ? s : s.replace(' ', 'T') + '-03:00'); };
export function fcFiltrar(lista, agora) {
  return lista.map(o => ({ o, t: fcHora(o.date), la: parseFloat(o.latitude), lo: parseFloat(o.longitude) }))
    .filter(x => x.t > agora - FC_JANELA_H * 3600e3 && x.t <= agora + 600e3 && x.la >= FC_AREA.latMin && x.la <= FC_AREA.latMax && x.lo >= FC_AREA.lonMin && x.lo <= FC_AREA.lonMax)
    .sort((a, b) => b.t - a.t)
    .map(({ o, t, la, lo }) => ({ id: String(o.id || ''), t, la: +la.toFixed(5), lo: +lo.toFixed(5),
      bairro: String((o.neighborhood && o.neighborhood.name) || '').slice(0, 60), local: String(o.address || '').slice(0, 90),
      policia: !!o.policeAction, vitimas: Array.isArray(o.victims) ? o.victims.length : 0 }));
}
async function fcBuscar(env, agora) {
  const ids = await fcIds(env), dia = ms => dataRio(ms).slice(0, 10);
  let todas = [], pagina = 1, atualizado = '';
  while (pagina <= 5) {
    const q = `/occurrences?idState=${ids.estado}&idCities=${ids.cidade}&initialdate=${dia(agora - 24 * 3600e3)}&finaldate=${dia(agora)}&take=100&page=${pagina}`;
    const r = await fcGet(env, q);atualizado = atualizado || r.atualizado;
    todas = todas.concat(r.d.data || []);
    if (!(r.d.pageMeta && r.d.pageMeta.hasNextPage)) break;
    pagina++;
  }
  return { ocorrencias: fcFiltrar(todas, agora), atualizado };
}
async function tiroteios(env, ctx, cors) {
  const cache = caches.default, chave = new Request('https://cache.local/tiroteios'), reserva = new Request('https://cache.local/tiroteios-reserva');
  const g = await cache.match(chave);
  if (g) return new Response(g.body, { headers: { ...cors, 'x-cache': 'hit' } });
  const agora = Date.now(), fonte = 'Fogo Cruzado (api.fogocruzado.org.br)';
  if (!env.FC_EMAIL || !env.FC_SENHA) return new Response(JSON.stringify({ t: agora, fonte, disponivel: false, motivo: 'sem-conta' }), { headers: cors });
  try {
    const r = await fcBuscar(env, agora);
    const corpo = JSON.stringify({ t: agora, fonte, disponivel: true, janelaH: FC_JANELA_H, atualizado: r.atualizado, ocorrencias: r.ocorrencias });
    const resp = new Response(corpo, { headers: { ...cors, 'cache-control': `public, max-age=${FC_CACHE_S}` } });
    ctx.waitUntil(cache.put(chave, resp.clone()));
    ctx.waitUntil(cache.put(reserva, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${FC_RESERVA_S}` } })));
    return resp;
  } catch (e) {
    const velho = await cache.match(reserva);
    if (velho) return new Response(velho.body, { headers: { ...cors, 'x-cache': 'antiga' } });
    return new Response(JSON.stringify({ t: agora, fonte, disponivel: false, motivo: 'erro' }), { headers: cors });
  }
}

// ---------- /saude: uso da cota da Cloudflare (para a aba Saúde e estatísticas da gestão) ----------
// Opcional: com os segredos CF_CONTA (ID da conta) e CF_TOKEN (token com "Account Analytics: Read"),
// o Worker consulta a API de análise da Cloudflare e informa quantos pedidos a conta recebeu hoje
// (o plano grátis permite 100 mil por dia, contados de meia-noite a meia-noite em UTC, 21h em Brasília).
const CF_LIMITE_DIA = 100000;
export async function usoCloudflare(env, agora) {
  if (!env.CF_CONTA || !env.CF_TOKEN) return null;
  const d = new Date(agora), desde = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
  const query = 'query($c:String!,$a:Time!,$b:Time!){viewer{accounts(filter:{accountTag:$c}){workersInvocationsAdaptive(limit:100,filter:{datetime_geq:$a,datetime_leq:$b}){sum{requests errors}dimensions{scriptName}}}}}';
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.CF_TOKEN },
    body: JSON.stringify({ query, variables: { c: env.CF_CONTA, a: desde, b: new Date(agora).toISOString() } }), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('analytics ' + r.status);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error('analytics: ' + j.errors[0].message);
  const linhas = (((j.data || {}).viewer || {}).accounts || [])[0]?.workersInvocationsAdaptive || [];
  const porWorker = {};let pedidos = 0, erros = 0;
  for (const l of linhas) { const n = l.sum.requests || 0; pedidos += n; erros += l.sum.errors || 0; const k = (l.dimensions || {}).scriptName || '?'; porWorker[k] = (porWorker[k] || 0) + n; }
  return { pedidos, erros, limite: CF_LIMITE_DIA, desde, porWorker };
}
async function saude(env, cors) {
  const agora = Date.now();let cf = null, erroCf = '';
  try { cf = await usoCloudflare(env, agora); } catch (e) { erroCf = String(e.message || e).slice(0, 120); }
  return new Response(JSON.stringify({ t: agora, worker: 'gps-fundao', tiroteiosConfigurado: !!(env.FC_EMAIL && env.FC_SENHA),
    cloudflare: cf, cloudflareErro: erroCf || undefined, cloudflareConfigurado: !!(env.CF_CONTA && env.CF_TOKEN) }), { headers: { ...cors, 'cache-control': 'no-store' } });
}

export default {
  async fetch(req, env, ctx) {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'content-type': 'application/json; charset=utf-8' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (new URL(req.url).pathname.replace(/\/$/, '') === '/tiroteios') return tiroteios(env, ctx, cors);
    if (new URL(req.url).pathname.replace(/\/$/, '') === '/saude') return saude(env, cors);
    const chave = new Request('https://cache.local/gps-fundao');
    const cache = caches.default;
    const guardado = await cache.match(chave);
    if (guardado) return new Response(guardado.body, { headers: { ...cors, 'x-cache': 'hit' } });
    const reserva = new Request('https://cache.local/gps-fundao-reserva');
    const agora = Date.now();
    const { onibus, falhou } = await buscar(agora);
    if (falhou) {
      const velho = await cache.match(reserva);
      if (velho) return new Response(velho.body, { headers: { ...cors, 'x-cache': 'antiga' } });
    }
    const corpo = JSON.stringify({ t: agora, fonte: 'SMTR / Prefeitura do Rio (dados.mobilidade.rio)', onibus });
    const resp = new Response(corpo, { headers: { ...cors, 'cache-control': `public, max-age=${CACHE_S}` } });
    ctx.waitUntil(cache.put(chave, resp.clone()));
    if (!falhou) ctx.waitUntil(cache.put(reserva, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${RESERVA_S}` } })));
    return resp;
  }
};
