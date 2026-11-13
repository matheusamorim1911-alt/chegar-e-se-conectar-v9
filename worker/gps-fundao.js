// Cloudflare Worker: posição ao vivo dos ônibus que atendem o Fundão.
// Busca a API aberta da prefeitura do Rio (dados.mobilidade.rio), filtra as linhas do app na região da Ilha do Fundão
// (e qualquer outra linha com ônibus dentro da ilha), e devolve um JSON pequeno com CORS liberado.
// O resultado fica guardado por 10 segundos (a prefeitura do Rio atualiza cada ônibus a cada ~30 s): todos os usuários usam
// a mesma cópia, então a prefeitura do Rio recebe no máximo 1 pedido a cada 10 s por fonte (por data center da Cloudflare), não importa quantas pessoas usem o app.
// Se a prefeitura do Rio falhar ou demorar, devolve a última resposta boa (até 3 min), marcada com x-cache: antiga.
// Cada tentativa fica registrada (resultado, tempo, tamanho e motivo da falha) e aparece na aba Saúde do app (/saude).
// Em /tiroteios, entrega os tiroteios recentes perto das saídas do Fundão (Fogo Cruzado), para quem ligou o aviso no app.
// Em /push/…, guarda quem quer ser notificado de tiroteios novos; o gatilho Cron (a cada 5 min) manda os avisos.

const LINHAS = new Set(['321','323','324','325','326','327','328','329','42','43','485','486','616','634','635','663','696','90','901','910','913','915','922','975','979','SN324','SN328','SN696','SP324','SP328','SP329','SP485','SP635','SPB326','SR328','SV922','SVB901',
  // vistas todo dia dentro da ilha (Gestão › Saúde, 11/11/2026): entram também nos acessos
  '35','91','95']);
// Códigos que não são linha (GARAGEM, APOIO, MANUTENCAO, TR, 0…): ônibus fora de serviço não vão para o mapa.
// Uma linha de verdade tem número; só zeros não vale.
export const linhaDeVerdade = l => /\d/.test(l) && !/^0+$/.test(l);
// Ilha do Fundão e acessos (Linha Vermelha, Av. Brasil e pontes); fica de fora a garagem na Ilha do Governador
const AREA = { latMin: -22.885, latMax: -22.825, lonMin: -43.27, lonMax: -43.195 };
// Ônibus de outras linhas também entram quando estão dentro da Ilha do Fundão (contorno do OpenStreetMap,
// © colaboradores do OpenStreetMap, ODbL, simplificado a 12 m): assim uma linha nova, um desvio ou uma variante
// (SV, SP…) que ainda não está na lista aparece no mapa. Quem só passa pela Linha Vermelha (a até 40 m dela) fica de fora.
const ILHA = [[-22.84270,-43.22203],[-22.84143,-43.22233],[-22.84154,-43.22265],[-22.84101,-43.22330],[-22.84022,-43.22335],[-22.83950,-43.22367],[-22.83943,-43.22397],[-22.83972,-43.22511],[-22.83961,-43.22554],[-22.83891,-43.22631],[-22.83770,-43.22684],[-22.83704,-43.22804],[-22.83702,-43.22874],[-22.83730,-43.22926],[-22.83727,-43.23022],[-22.83629,-43.23134],[-22.83622,-43.23183],[-22.83668,-43.23207],[-22.83715,-43.23128],[-22.83746,-43.23118],[-22.83806,-43.23154],[-22.83861,-43.23226],[-22.83870,-43.23273],[-22.83849,-43.23323],[-22.83915,-43.23623],[-22.83927,-43.23764],[-22.83904,-43.23888],[-22.83820,-43.23970],[-22.83795,-43.24057],[-22.83704,-43.24171],[-22.83714,-43.24251],[-22.83843,-43.24335],[-22.83964,-43.24321],[-22.83987,-43.24300],[-22.83975,-43.24229],[-22.83991,-43.24199],[-22.84113,-43.24079],[-22.84219,-43.24020],[-22.84286,-43.24004],[-22.84409,-43.24012],[-22.84571,-43.24092],[-22.84656,-43.24096],[-22.84853,-43.23939],[-22.84908,-43.23918],[-22.84971,-43.23927],[-22.85035,-43.23877],[-22.85453,-43.23671],[-22.85849,-43.23584],[-22.86017,-43.23591],[-22.86112,-43.23624],[-22.86139,-43.23604],[-22.86287,-43.23331],[-22.86304,-43.23229],[-22.86517,-43.23200],[-22.86564,-43.23216],[-22.86620,-43.23190],[-22.86638,-43.23142],[-22.86640,-43.22908],[-22.86669,-43.22816],[-22.86977,-43.22227],[-22.87041,-43.22157],[-22.87022,-43.22081],[-22.86957,-43.21995],[-22.87001,-43.21897],[-22.87051,-43.21575],[-22.87012,-43.21545],[-22.86963,-43.21458],[-22.86778,-43.21412],[-22.86569,-43.21437],[-22.86393,-43.21509],[-22.86368,-43.21504],[-22.86264,-43.21616],[-22.86174,-43.21666],[-22.86190,-43.21703],[-22.86250,-43.21717],[-22.86294,-43.21768],[-22.86344,-43.21784],[-22.86338,-43.21834],[-22.86292,-43.21879],[-22.86211,-43.21940],[-22.86176,-43.21936],[-22.86133,-43.21884],[-22.86106,-43.21762],[-22.85982,-43.21427],[-22.85987,-43.21382],[-22.86069,-43.21276],[-22.86051,-43.21200],[-22.86005,-43.21136],[-22.86020,-43.21123],[-22.85995,-43.21075],[-22.85996,-43.21034],[-22.86041,-43.20950],[-22.86062,-43.20942],[-22.86049,-43.20913],[-22.86006,-43.20849],[-22.85998,-43.20860],[-22.85860,-43.20826],[-22.85826,-43.20841],[-22.85765,-43.20954],[-22.85789,-43.21093],[-22.85838,-43.21169],[-22.85857,-43.21242],[-22.85832,-43.21303],[-22.85747,-43.21418],[-22.85716,-43.21512],[-22.85823,-43.21658],[-22.85881,-43.21775],[-22.85879,-43.21950],[-22.85900,-43.22118],[-22.85885,-43.22261],[-22.85823,-43.22384],[-22.85655,-43.22580],[-22.85614,-43.22666],[-22.85426,-43.22851],[-22.85265,-43.22952],[-22.85170,-43.23048],[-22.84714,-43.23243],[-22.84557,-43.23208],[-22.84453,-43.23157],[-22.84454,-43.23137],[-22.84412,-43.23145],[-22.84392,-43.23130],[-22.84328,-43.23049],[-22.84266,-43.22864],[-22.84139,-43.22638],[-22.84136,-43.22563],[-22.84172,-43.22406],[-22.84266,-43.22277],[-22.84363,-43.22223],[-22.84414,-43.22233],[-22.84438,-43.22294],[-22.84490,-43.22334],[-22.84495,-43.22356],[-22.84473,-43.22360],[-22.84489,-43.22394],[-22.84653,-43.22406],[-22.84761,-43.22332],[-22.84775,-43.22342],[-22.84785,-43.22203],[-22.84809,-43.22167],[-22.84769,-43.22139],[-22.84635,-43.22120],[-22.84571,-43.22092],[-22.84547,-43.22004],[-22.84507,-43.21985],[-22.84376,-43.22039],[-22.84351,-43.22091],[-22.84329,-43.22094],[-22.84329,-43.22163]];
const LV = [[[-22.84294,-43.23953],[-22.84397,-43.23969]],[[-22.83800,-43.24328],[-22.83816,-43.24311]],[[-22.84042,-43.24077],[-22.84094,-43.24017],[-22.84146,-43.23979],[-22.84208,-43.23957],[-22.84294,-43.23953]],[[-22.84498,-43.23976],[-22.84579,-43.24012],[-22.84694,-43.24080]],[[-22.84503,-43.23964],[-22.84478,-43.23957]],[[-22.84699,-43.24069],[-22.84569,-43.23991],[-22.84503,-43.23964]],[[-22.84416,-43.23948],[-22.84313,-43.23931],[-22.84257,-43.23928],[-22.84206,-43.23933],[-22.84154,-43.23949]],[[-22.83797,-43.24302],[-22.83788,-43.24311]],[[-22.84154,-43.23949],[-22.84083,-43.23995],[-22.83918,-43.24161]],[[-22.83941,-43.24199],[-22.83975,-43.24171],[-22.84007,-43.24125]],[[-22.84294,-43.23953],[-22.84359,-43.23955],[-22.84498,-43.23976]],[[-22.84478,-43.23957],[-22.84416,-43.23948]],[[-22.84007,-43.24125],[-22.84042,-43.24077]],[[-22.83918,-43.24161],[-22.83820,-43.24277]],[[-22.84397,-43.23969],[-22.84513,-43.24006]],[[-22.83816,-43.24311],[-22.83881,-43.24245],[-22.83941,-43.24199]],[[-22.83820,-43.24277],[-22.83797,-43.24302]]];
const ILHA_CX = { latMin: -22.8706, latMax: -22.8361, lonMin: -43.2435, lonMax: -43.2081 };
const LV_M = 40, KX_M = 111320 * Math.cos(-22.853 * Math.PI / 180), KY_M = 110574;
export function naIlha(la, lo) {
  if (!(la >= ILHA_CX.latMin && la <= ILHA_CX.latMax && lo >= ILHA_CX.lonMin && lo <= ILHA_CX.lonMax)) return false;
  let c = false;
  for (let i = 0, j = ILHA.length - 1; i < ILHA.length; j = i++) {
    const a = ILHA[i], b = ILHA[j];
    if ((a[0] > la) !== (b[0] > la) && lo < (b[1] - a[1]) * (la - a[0]) / (b[0] - a[0]) + a[1]) c = !c;
  }
  if (!c) return false;
  for (const L of LV) for (let k = 1; k < L.length; k++) {
    const ax = (L[k - 1][1] - lo) * KX_M, ay = (L[k - 1][0] - la) * KY_M, bx = (L[k][1] - lo) * KX_M, by = (L[k][0] - la) * KY_M;
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    if (Math.hypot(ax + t * dx, ay + t * dy) < LV_M) return false;
  }
  return true;
}
// Fontes: GTFS Realtime da prefeitura do Rio (CC BY 4.0, sem chave; limite de 60 pedidos/min). As APIs antigas em JSON
// (/gps/sppo e /gps/brt) foram marcadas como descontinuadas em 07/10/2026 e saem do ar até 30/11/2026: enquanto
// existirem, o Worker volta a elas se o GTFS Realtime falhar ou vier num formato que ele não reconhece.
const FONTES = [
  { f: 'sppo', rt: 'https://dados.mobilidade.rio/gtfs/realtime/onibus/vehicle-positions', antiga: 'https://dados.mobilidade.rio/gps/sppo' },
  { f: 'brt', rt: 'https://dados.mobilidade.rio/gtfs/realtime/brt/vehicle-positions', antiga: 'https://dados.mobilidade.rio/gps/brt' }];
// JANELA_MIN: período pedido à prefeitura do Rio. Os ônibus mandam posição a cada ~30 s e chegam com ~11 s de atraso,
// então 1,5 min basta para ter todos; um período maior aumenta a resposta (cidade inteira) e o Worker pode
// estourar o limite de processamento do plano grátis da Cloudflare nos horários de pico.
const CACHE_S = 10, RESERVA_S = 180, JANELA_MIN = 1.5, VELHO_MIN = 6;

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

// ---------- GTFS Realtime (protobuf) ----------
// O código da linha vem no route_id do GTFS da prefeitura do Rio: "O0321AAA0A" é a 321, "O0803AAP0A" é a SP803.
// ROTAS traz os route_id das variantes (gerado por tools/gtfs_fundao.py a partir do GTFS; o resto sai pela regra).
// ROTAS-INICIO
const ROTAS = {};
// ROTAS-FIM
const VARIANTE = { AAA: '', AAP: 'SP' };
export function linhaDaRota(rid) {
  if (!rid) return '';
  if (ROTAS[rid]) return ROTAS[rid];
  const m = /^[A-Z](\d{3,4})([A-Z]{3})\d[A-Z]$/.exec(rid);
  if (m) { const n = String(+m[1]); return m[2] in VARIANTE ? VARIANTE[m[2]] + n : n; }
  return /^[A-Z]{0,3}\d{1,4}[A-Z]?$/.test(rid) ? rid : '';
}
// Lê um FeedMessage com VehiclePosition. Só os textos de quem está na região do Fundão viram string (CPU).
// Devolve registros no mesmo formato da API antiga, para o filtro de sempre.
export function lerGtfsRt(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), dec = new TextDecoder();
  let i = 0;
  const vi = () => { let v = 0, m = 1, c; do { c = b[i++]; v += (c & 127) * m; m *= 128; } while (c & 128); return v; };
  const pula = w => { if (w === 0) vi(); else if (w === 1) i += 8; else if (w === 2) { const n = vi(); i += n; } else if (w === 5) i += 4; else throw new Error('protobuf inválido'); };
  const out = [], CX = AREA, pend = [];
  let resolvidos = 0, total = 0, ts = 0;
  const desconhecidas = new Map();
  while (i < b.length) {
    const k = vi(), f = k >>> 3, w = k & 7;
    if (f === 1 && w === 2) { const n = vi(), fim = i + n; while (i < fim) { const k2 = vi(); if ((k2 >>> 3) === 3 && (k2 & 7) === 0) ts = vi(); else pula(k2 & 7); } i = fim; continue; }
    if (f !== 2 || w !== 2) { pula(w); continue; }
    const fimE = (n => i + n)(vi());
    let veh = null;
    while (i < fimE) {
      const k2 = vi();
      if ((k2 >>> 3) === 4 && (k2 & 7) === 2) {
        const fimV = (n => i + n)(vi()); veh = { la: NaN, lo: NaN, br: 0, sp: 0, t: 0, rid: null, vid: null, lab: null };
        while (i < fimV) {
          const k3 = vi(), f3 = k3 >>> 3, w3 = k3 & 7;
          if (f3 === 1 && w3 === 2) { const fimT = (n => i + n)(vi()); while (i < fimT) { const k4 = vi(); if ((k4 >>> 3) === 5 && (k4 & 7) === 2) { const n = vi(); veh.rid = [i, n]; i += n; } else pula(k4 & 7); } i = fimT; }
          else if (f3 === 8 && w3 === 2) { const fimD = (n => i + n)(vi()); while (i < fimD) { const k4 = vi(), f4 = k4 >>> 3; if ((f4 === 1 || f4 === 2) && (k4 & 7) === 2) { const n = vi(); veh[f4 === 1 ? 'vid' : 'lab'] = [i, n]; i += n; } else pula(k4 & 7); } i = fimD; }
          else if (f3 === 2 && w3 === 2) { const fimP = (n => i + n)(vi()); while (i < fimP) { const k4 = vi(), f4 = k4 >>> 3, w4 = k4 & 7;
              if (w4 === 5) { const x = dv.getFloat32(i, true); i += 4; if (f4 === 1) veh.la = x; else if (f4 === 2) veh.lo = x; else if (f4 === 3) veh.br = x; else if (f4 === 5) veh.sp = x; }
              else if (w4 === 1 && f4 === 1) { veh.la = dv.getFloat64(i, true); i += 8; } else if (w4 === 1 && f4 === 2) { veh.lo = dv.getFloat64(i, true); i += 8; } else pula(w4); } i = fimP; }
          else if (f3 === 5 && w3 === 0) veh.t = vi();
          else pula(w3);
        }
        i = fimV;
      } else pula(k2 & 7);
    }
    i = fimE;
    if (!veh) continue;
    total++;
    const str = r => r ? dec.decode(b.subarray(r[0], r[0] + r[1])) : '';
    // a linha só é lida de quem está na caixa do Fundão e acessos, mas a amostra que mede o formato vale para todos
    const dentro = veh.la >= CX.latMin && veh.la <= CX.latMax && veh.lo >= CX.lonMin && veh.lo <= CX.lonMax;
    if (!dentro && total % 20) continue;
    const rid = str(veh.rid), linha = linhaDaRota(rid);
    if (!dentro) { if (linha) resolvidos += 20; else if (rid && desconhecidas.size < 8) desconhecidas.set(rid, 1); continue; }
    if (linha) resolvidos++; else if (rid && desconhecidas.size < 8) desconhecidas.set(rid, 1);
    pend.push({ id_veiculo: str(veh.vid) || str(veh.lab), servico: linha || rid, latitude: veh.la, longitude: veh.lo, sp: veh.sp, direcao: veh.br, t: veh.t * 1000 });
  }
  return { lista: pend, total, resolvidos: Math.min(resolvidos, total), desconhecidas: [...desconhecidas.keys()], ts: ts * 1000 };
}
// Ajustes que dependem do lote inteiro: a velocidade deveria vir em m/s, mas a da prefeitura do Rio parece vir em km/h
// (se a maioria dos que andam passa de 25, é km/h); e, se as horas vierem 3 h deslocadas (relógio de Brasília marcado
// como UTC, como no Fogo Cruzado e na API antiga), corrige.
export function ajustarRt(lista, agora) {
  const v = lista.map(o => o.sp).filter(x => x > 0.5).sort((a, b) => a - b), p90 = v.length ? v[Math.floor(v.length * 0.9)] : 0;
  const kmh = p90 > 25;
  const d = lista.map(o => agora - o.t).sort((a, b) => a - b), med = d.length ? d[Math.floor(d.length / 2)] : 0;
  const desloc = med > 2.5 * 3600e3 && med < 3.5 * 3600e3 ? 3 * 3600e3 : med < -2.5 * 3600e3 && med > -3.5 * 3600e3 ? -3 * 3600e3 : 0;
  return { lista: lista.map(o => ({ id_veiculo: o.id_veiculo, servico: o.servico, latitude: o.latitude, longitude: o.longitude, velocidade: kmh ? o.sp : o.sp * 3.6, direcao: o.direcao, datahora: o.t + desloc })), kmh, desloc };
}

export function filtrar(lista, agora) {
  const porOnibus = new Map();
  for (const o of lista) {
    const linha = String(pega(o, ['servico', 'linha', 'route_short_name']) ?? '').trim().toUpperCase();
    const la = num(pega(o, ['latitude', 'lat'])), lo = num(pega(o, ['longitude', 'lon', 'lng']));
    const daLista = LINHAS.has(linha);
    if (daLista ? !(la >= AREA.latMin && la <= AREA.latMax && lo >= AREA.lonMin && lo <= AREA.lonMax) : !(linhaDeVerdade(linha) && naIlha(la, lo))) continue;
    const t = horaRio(pega(o, ['datetime', 'datahora', 'dataHora', 'timestamp']));
    if (!(t > agora - VELHO_MIN * 60e3)) continue;
    const id = String(pega(o, ['id_veiculo', 'ordem', 'codigo', 'veiculo']) ?? '');
    const atual = porOnibus.get(id);
    if (atual && atual.t >= t) continue;
    porOnibus.set(id, { v: id, l: linha, s: pega(o, ['sentido']) ?? '', la: +la.toFixed(6), lo: +lo.toFixed(6), vel: Math.round(num(pega(o, ['velocidade'])) || 0), dir: ((Math.round(num(pega(o, ['direcao'])) || 0) % 360) + 360) % 360, t, ...(daLista ? {} : { f: 1 }) });
  }
  return [...porOnibus.values()];
}

// A resposta dos ônibus (sppo) tem ~3,7 MB e ~11 mil registros da cidade inteira. Ler tudo com JSON.parse e
// filtrar depois passava do limite de processamento do plano grátis da Cloudflare (10 ms) e o Worker caía antes
// de responder. Aqui o texto é varrido atrás de "servico":"…" e só os registros das linhas do app viram objeto.
// Se o formato mudar (a marca não aparece), volta ao JSON.parse.
// junta à resposta nova os ônibus da cópia guardada que não vieram agora (posição ainda dentro da validade)
export function completar(novos, guardados, agora) {
  const tem = new Set(novos.map(o => o.v));
  return novos.concat((guardados || []).filter(o => !tem.has(o.v) && agora - o.t < VELHO_MIN * 60e3));
}
export function extrairLinhas(texto) {
  const marca = '"servico":"';
  let i = texto.indexOf(marca);
  if (i < 0) return null;
  const out = [], feitos = new Set();
  while (i >= 0) {
    const a = i + marca.length, b = texto.indexOf('"', a);
    if (b < 0) break;
    if (LINHAS.has(texto.slice(a, b).trim().toUpperCase())) {
      const ini = texto.lastIndexOf('{', i), fim = texto.indexOf('}', b);
      if (ini >= 0 && fim > b) { feitos.add(ini); try { out.push(JSON.parse(texto.slice(ini, fim + 1))); } catch (e) { /* registro quebrado: pula */ } }
    }
    i = texto.indexOf(marca, b);
  }
  // outras linhas: procura só as latitudes que começam com -22.8 (a faixa da ilha), no formato que a resposta usa
  // ("latitude":-22.85 ou "latitude":"-22,85"), e só vira objeto quem está na caixa da ilha
  // (procurar o texto curto "-22.8" é bem mais rápido que procurar a chave inteira)
  const k0 = texto.indexOf('"latitude":');
  if (k0 >= 0) {
    let k = k0 + 11; const q = texto.charCodeAt(k) === 34 ? 1 : 0; k += q;
    const lat = '-22' + (texto.charAt(k + 3) === ',' ? ',' : '.') + '8', chave = '"latitude":' + (q ? '"' : '');
    for (let j = texto.indexOf(lat); j >= 0; j = texto.indexOf(lat, j + 5)) {
      const d = texto.charCodeAt(j + 5); if (d < 51 || d > 55) continue; // -22.83… a -22.87…
      if (!texto.startsWith(chave, j - chave.length)) continue;
      const v = parseFloat(texto.slice(j, j + 12).replace(',', '.'));
      if (!(v >= ILHA_CX.latMin && v <= ILHA_CX.latMax)) continue;
      // a longitude costuma vir logo depois da latitude; se não vier, procura no registro inteiro
      let lo = valorEm(texto, '"longitude":', j, j + 40);
      if (lo === lo && !(lo >= ILHA_CX.lonMin && lo <= ILHA_CX.lonMax)) continue;
      const ini = texto.lastIndexOf('{', j), fim = texto.indexOf('}', j);
      if (ini < 0 || fim < 0 || feitos.has(ini)) continue;
      if (lo !== lo) { lo = valorEm(texto, '"longitude":', ini, fim); if (!(lo >= ILHA_CX.lonMin && lo <= ILHA_CX.lonMax)) continue; }
      feitos.add(ini); try { out.push(JSON.parse(texto.slice(ini, fim + 1))); } catch (e) { /* registro quebrado: pula */ }
    }
  }
  return out;
}
function valorEm(texto, chave, ini, fim) {
  let k = texto.indexOf(chave, ini);
  if (k < 0 || k > fim) return NaN;
  k += chave.length; if (texto.charCodeAt(k) === 34) k++;
  return parseFloat(texto.slice(k, k + 14).replace(',', '.'));
}
// linhas fora da lista vistas na ilha (para a aba Saúde): por linha, quantos ônibus, quantas vezes e quando por último
export function contarFora(onibus) {
  const r = {};
  for (const o of onibus) if (o.f) { const x = r[o.l] || (r[o.l] = { n: 0, v: [] }); x.n++; if (x.v.length < 5) x.v.push(o.v); }
  return r;
}
const FORA = 'https://cache.local/gps-fora';
async function registrarFora(fora, agora) {
  if (!Object.keys(fora).length) return;
  const cache = caches.default, chave = new Request(FORA), dia = dataRio(agora).slice(0, 10);
  let d = null;
  try { const g = await cache.match(chave); if (g) d = await g.json(); } catch (e) { d = null; }
  if (!d || d.dia !== dia) d = { dia, linhas: {} };
  for (const [l, x] of Object.entries(fora)) {
    const y = d.linhas[l] || (d.linhas[l] = { vezes: 0, max: 0, carros: [] });
    y.vezes++; y.max = Math.max(y.max, x.n); y.ult = agora;
    for (const v of x.v) if (y.carros.length < 8 && !y.carros.includes(v)) y.carros.push(v);
  }
  await cache.put(chave, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=172800' } }));
}
async function lerFora(agora) {
  try { const g = await caches.default.match(new Request(FORA)); const d = g ? await g.json() : null; return d && d.dia === dataRio(agora).slice(0, 10) ? d : null; } catch (e) { return null; }
}
// motivo de uma falha, em palavras (vai para a aba Saúde)
function motivoErro(e) {
  const m = String(e && (e.name === 'TimeoutError' ? 'tempo' : e.message) || e);
  if (m === 'tempo' || /timed? ?out|aborted/i.test(m)) return 'a prefeitura do Rio não respondeu em 8 s';
  if (/^formato/.test(m)) return 'a prefeitura do Rio mudou o formato das posições: ' + m.replace(/^formato: /, '');
  if (/protobuf/i.test(m)) return 'a prefeitura do Rio mandou posições ilegíveis (protobuf)';
  if (/json|unexpected|parse/i.test(m)) return 'a prefeitura do Rio mandou uma resposta que não é JSON';
  return 'erro de rede: ' + m.slice(0, 80);
}
function motivoHttp(st) {
  return 'a prefeitura do Rio respondeu HTTP ' + st + (st === 429 ? ' (pedidos demais)' : st >= 500 ? ' (erro no servidor dela)' : st === 404 ? ' (endereço não encontrado)' : st === 403 ? ' (acesso recusado)' : '');
}
async function buscar(agora) {
  const q = `?dataInicial=${dataRio(agora - JANELA_MIN * 60e3)}&dataFinal=${dataRio(agora)}`;
  const fontes = [];
  const pede = async (u, f) => {
    const go = () => fetch(u, { headers: { 'user-agent': 'chega-ai-ufrj (UFRJ)' }, signal: AbortSignal.timeout(8000) });
    let r = await go();
    // erro no servidor da prefeitura do Rio (HTTP 5xx): costuma passar na segunda tentativa
    if (r.status >= 500) { f.de_novo = r.status; await new Promise(ok => setTimeout(ok, 400)); r = await go(); }
    f.http = r.status; return r;
  };
  const partes = await Promise.all(FONTES.map(async F => {
    const f = { f: F.f, ok: false }, t0 = Date.now(); fontes.push(f);
    try {
      // 1) GTFS Realtime
      try {
        const r = await pede(F.rt, f);
        if (!r.ok) throw new Error(motivoHttp(r.status));
        const buf = await r.arrayBuffer(); f.kb = Math.round(buf.byteLength / 1024);
        const L = lerGtfsRt(buf);
        f.n = L.total;
        if (L.desconhecidas.length) f.rotas = L.desconhecidas;
        if (L.total > 30 && L.resolvidos < L.total * 0.5) throw new Error('formato: a linha não veio no route_id (ex.: ' + (L.desconhecidas[0] || 'vazio') + ')');
        const A = ajustarRt(L.lista, agora);
        if (A.desloc) f.desloc_h = A.desloc / 3600e3;
        if (L.ts) f.ts = L.ts + A.desloc;
        f.via = 'gtfs-rt'; f.ok = true; return A.lista;
      } catch (e) { f.motivo_rt = String(e.message || e).slice(0, 120); if (/^a prefeitura/.test(f.motivo_rt)) f.motivo = f.motivo_rt; else f.motivo = motivoErro(e); }
      // 2) API antiga em JSON (até 30/11/2026)
      if (!F.antiga) return [];
      const r = await pede(F.antiga + q, f);
      if (!r.ok) { f.motivo = motivoHttp(r.status); return []; }
      const texto = await r.text();
      f.kb = Math.round(texto.length / 1024);
      let lista = extrairLinhas(texto);
      if (!lista) { const d = JSON.parse(texto); lista = Array.isArray(d) ? d : (d.veiculos || d.data || []); }
      f.via = 'json-antigo'; delete f.motivo; f.ok = true; f.n = lista.length; return lista;
    } catch (e) { f.motivo = motivoErro(e); return []; }
    finally { f.ms = Date.now() - t0; }
  }));
  return { onibus: filtrar(partes.flat(), agora), falhou: fontes.every(f => !f.ok), parcial: fontes.some(f => !f.ok), fontes };
}
// Quanto tempo guardar esta resposta: a prefeitura do Rio também guarda a dela por ~10 s; pela hora em que ela gerou
// o feed (cabeçalho do GTFS Realtime), a próxima versão sai perto de ts + 10 s. Guardar só até lá faz o Worker pedir
// logo depois que a prefeitura atualiza, em vez de num momento qualquer (até 10 s de atraso a menos). Sem essa hora
// (API antiga) ou com uma hora estranha, guarda CACHE_S.
export function validade(fontes, agora) {
  const ts = Math.max(0, ...fontes.filter(f => f.ok && f.ts).map(f => f.ts));
  if (!ts || Math.abs(agora - ts) > 60e3) return CACHE_S * 1000;
  let fim = ts + CACHE_S * 1000 + 500;
  while (fim < agora + 2000) fim += CACHE_S * 1000;
  return Math.min(CACHE_S * 1000, fim - agora);
}
// registro das últimas tentativas de falar com a prefeitura do Rio (para a aba Saúde): fica no cache deste data center
const REGISTRO = 'https://cache.local/gps-registro', REGISTRO_N = 60;
async function registrar(entrada) {
  const cache = caches.default, chave = new Request(REGISTRO);
  let L = [];
  try { const g = await cache.match(chave); if (g) L = await g.json(); } catch (e) { L = []; }
  L.push(entrada); if (L.length > REGISTRO_N) L = L.slice(-REGISTRO_N);
  await cache.put(chave, new Response(JSON.stringify(L), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } }));
}
async function lerRegistro() {
  try { const g = await caches.default.match(new Request(REGISTRO)); return g ? await g.json() : []; } catch (e) { return []; }
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
// Datas da API: a documentação do Fogo Cruzado diz que são horário de Brasília, mas elas vêm escritas como UTC
// ("2026-11-11T08:30:00.000Z" quer dizer 8h30 no Rio). Ler o "Z" ao pé da letra punha cada tiroteio 3 h no passado
// (aparecia como "há 3 h" logo que entrava, saía da janela 3 h antes e não gerava notificação).
// Por isso vale sempre o relógio escrito, como horário de Brasília; só um fuso diferente de zero escrito é respeitado.
export const fcHora = v => {
  const s = String(v || '').trim().replace(' ', 'T');
  if (!s) return NaN;
  if (/[+-](?!00:?00$)\d\d:?\d\d$/.test(s)) return Date.parse(s);
  return Date.parse(s.replace(/(Z|[+-]00:?00)$/, '') + '-03:00');
};
// "atualizado" vai para o app já com o fuso certo
const fcIso = v => { const t = fcHora(v); return t > 0 ? dataRio(t).replace('+', 'T') + '-03:00' : ''; };
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
  return { ocorrencias: fcFiltrar(todas, agora), atualizado: fcIso(atualizado) };
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
// segredos colados com espaço, quebra de linha, aspas ou "Bearer " na frente quebravam o cabeçalho: limpa antes de usar
export const limpaSegredo = v => String(v || '').replace(/^\s*["']?\s*(Bearer\s+)?/i, '').replace(/\s*["']?\s*$/, '').replace(/\s+/g, '');
export async function usoCloudflare(env, agora) {
  const token = limpaSegredo(env.CF_TOKEN), conta = limpaSegredo(env.CF_CONTA);
  if (!conta || !token) return null;
  if (!/^[A-Za-z0-9._~+\/=-]+$/.test(token)) throw new Error('o CF_TOKEN tem caracteres que não são de um token; cole de novo só o token');
  const d = new Date(agora), desde = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
  const query = 'query($c:String!,$a:Time!,$b:Time!){viewer{accounts(filter:{accountTag:$c}){workersInvocationsAdaptive(limit:100,filter:{datetime_geq:$a,datetime_leq:$b}){sum{requests errors}dimensions{scriptName}}}}}';
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ query, variables: { c: conta, a: desde, b: new Date(agora).toISOString() } }), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('analytics ' + r.status);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error('analytics: ' + j.errors[0].message);
  const linhas = (((j.data || {}).viewer || {}).accounts || [])[0]?.workersInvocationsAdaptive || [];
  const porWorker = {};let pedidos = 0, erros = 0;
  for (const l of linhas) { const n = l.sum.requests || 0; pedidos += n; erros += l.sum.errors || 0; const k = (l.dimensions || {}).scriptName || '?'; porWorker[k] = (porWorker[k] || 0) + n; }
  return { pedidos, erros, limite: CF_LIMITE_DIA, desde, porWorker };
}
async function saude(env, cors, req) {
  const agora = Date.now();let cf = null, erroCf = '', det = null;
  try { cf = await usoCloudflare(env, agora); } catch (e) { erroCf = String(e.message || e).slice(0, 120); }
  if (cf) { try { det = await detalheCloudflare(env, agora); } catch (e) { det = { erro: String(e.message || e).slice(0, 120) }; } }
  const registro = await lerRegistro(), linhasFora = await lerFora(agora), push = await saudePush(env);
  return new Response(JSON.stringify({ t: agora, worker: 'gps-fundao', tiroteiosConfigurado: !!(env.FC_EMAIL && env.FC_SENHA),
    cloudflare: cf, cloudflareErro: erroCf || undefined, cloudflareConfigurado: !!(env.CF_CONTA && env.CF_TOKEN),
    cloudflareDetalhe: det, dataCenter: (req && req.cf && req.cf.colo) || undefined, registro, linhasFora, push }), { headers: { ...cors, 'cache-control': 'no-store' } });
}


// ---------- Notificações de tiroteio (Web Push) ----------
// Quem liga "Notificar tiroteios" no app assina aqui (/push/assinar). A cada 5 min (gatilho Cron do Worker), o Worker
// confere os tiroteios (a mesma consulta de /tiroteios) e, quando aparece um registro novo das últimas 2 h, manda um
// aviso a quem assinou. O aviso vai sem conteúdo: o app instalado busca /tiroteios e mostra onde e quando foi.
// Precisa de um namespace KV ligado ao Worker com o nome PUSH. As chaves VAPID (que identificam o Worker para os
// serviços de notificação) são criadas aqui na primeira vez e ficam só no KV: não vão para o código nem para o app.
const PUSH_JANELA_H = 2, PUSH_LOTE = 40, PUSH_SITE = 'https://matheusamorim1911-alt.github.io/chegar-e-se-conectar-v9/';
// só serviços de notificação conhecidos (Chrome/Android, Firefox, Safari/iPhone, Edge)
const PUSH_HOSTS = /^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
const b64u = buf => { let t = ''; for (const c of new Uint8Array(buf)) t += String.fromCharCode(c); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export function endpointValido(e) {
  try { const u = new URL(String(e || '')); return u.protocol === 'https:' && PUSH_HOSTS.test(u.hostname) && String(e).length <= 800; } catch (x) { return false; }
}
async function chavePush(e) { return 'sub:' + b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e))).slice(0, 32); }
export async function vapid(env) {
  let j = await env.PUSH.get('vapid', 'json');
  if (!j) {
    const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    j = { priv: await crypto.subtle.exportKey('jwk', k.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', k.publicKey)) };
    await env.PUSH.put('vapid', JSON.stringify(j));
  }
  return j;
}
export async function jwtVapid(j, aud, agora) {
  const key = await crypto.subtle.importKey('jwk', j.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const corpo = enc({ typ: 'JWT', alg: 'ES256' }) + '.' + enc({ aud, exp: Math.floor(agora / 1000) + 12 * 3600, sub: PUSH_SITE });
  return corpo + '.' + b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(corpo)));
}
async function enviaPush(endpoint, j, jwts, agora, topico) {
  const aud = new URL(endpoint).origin;
  const t = jwts[aud] || (jwts[aud] = await jwtVapid(j, aud, agora));
  const r = await fetch(endpoint, { method: 'POST', headers: { authorization: `vapid t=${t}, k=${j.pub}`, ttl: String(PUSH_JANELA_H * 3600), urgency: 'high', topic: topico || 'tiroteio', 'content-length': '0' }, signal: AbortSignal.timeout(8000) });
  return r.status;
}
async function lerCorpo(req) { try { return JSON.parse(await req.text()); } catch (e) { return {}; } }
async function rotaPush(caminho, req, env, cors) {
  const resp = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: { ...cors, 'cache-control': 'no-store' } });
  if (!env.PUSH) return resp({ disponivel: false, motivo: 'sem-kv' }, 503);
  if (caminho === '/push/chave') return resp({ disponivel: true, chave: (await vapid(env)).pub });
  if (req.method !== 'POST') return resp({ erro: 'use POST' }, 405);
  const b = await lerCorpo(req), e = b.endpoint;
  if (!endpointValido(e)) return resp({ erro: 'endereço de notificação inválido' }, 400);
  const k = await chavePush(e);
  if (caminho === '/push/alertas') return resp(await guardaAlertas(env, k, e, b.alertas));
  if (caminho === '/push/aviso') {
    // o service worker pergunta o que mostrar no aviso que acabou de chegar (o aviso vai sem conteúdo)
    const st = (await env.PUSH.get('alst', 'json')) || {}, m = st.msgs && st.msgs[k];
    return resp(m && m.exp > Date.now() ? { titulo: m.t, corpo: m.c, tag: m.tag } : { nada: true });
  }
  if (caminho === '/push/assinar') { await env.PUSH.put(k, '1', { metadata: { e, t: Date.now() } }); return resp({ ok: true }); }
  if (caminho === '/push/sair') { await env.PUSH.delete(k); return resp({ ok: true }); }
  if (caminho === '/push/teste' && b.tipo === 'onibus') {
    // teste do aviso de ônibus: um por minuto por aparelho, mesmo sem alerta criado
    const st = (await env.PUSH.get('alst', 'json')) || {}; st.av = st.av || {}; st.msgs = st.msgs || {};
    const agora = Date.now();
    if (st.av[k + '|teste'] > agora) return resp({ erro: 'espere um minuto' }, 429);
    st.av[k + '|teste'] = agora + 60e3;
    st.msgs[k] = { t: 'Teste: o ônibus está chegando', c: 'Os avisos de ônibus estão funcionando neste aparelho.', tag: 'onibus-teste', exp: agora + 10 * 60e3 };
    await env.PUSH.put('alst', JSON.stringify(st));
    const s2 = await enviaPush(e, await vapid(env), {}, agora, 'onibus');
    return resp({ ok: s2 >= 200 && s2 < 300, status: s2 });
  }
  if (caminho === '/push/teste') {
    // um aviso de teste só para quem já assinou, no máximo um por minuto
    const m = await env.PUSH.getWithMetadata(k);
    if (!m || !m.metadata) return resp({ erro: 'não assinado' }, 404);
    if (m.metadata.teste && Date.now() - m.metadata.teste < 60e3) return resp({ erro: 'espere um minuto' }, 429);
    await env.PUSH.put(k, '1', { metadata: { ...m.metadata, teste: Date.now() } });
    // o texto do teste vai pelo mesmo caminho dos avisos de ônibus: o aparelho o busca em /push/aviso
    const ta = (await env.PUSH.get('alst', 'json')) || {}; ta.msgs = ta.msgs || {};
    ta.msgs[k] = { t: 'Chega aí UFRJ', c: 'Aviso de teste: as notificações de tiroteio estão ligadas.', tag: 'teste', exp: Date.now() + 10 * 60e3 };
    await env.PUSH.put('alst', JSON.stringify(ta));
    const st = await enviaPush(e, await vapid(env), {}, Date.now());
    if (st === 404 || st === 410) await env.PUSH.delete(k);
    return resp({ ok: st >= 200 && st < 300, status: st });
  }
  return resp({ erro: 'rota desconhecida' }, 404);
}
// roda pelo gatilho Cron (a cada 5 min): avisa tiroteios novos e envia em lotes de PUSH_LOTE (limite de pedidos por vez do plano grátis)
export async function avisaTiroteios(env, ctx, agora) {
  if (!env.PUSH || !env.FC_EMAIL || !env.FC_SENHA) return { r: 'sem-config' };
  const est = (await env.PUSH.get('estado', 'json')) || { avisados: [] };
  let mudou = false;
  let occ = [];
  try { const d = await (await tiroteios(env, ctx, {})).json(); occ = d.disponivel ? d.ocorrencias || [] : []; } catch (e) { occ = []; }
  const novos = occ.filter(o => o.id && o.t && agora - o.t < PUSH_JANELA_H * 3600e3 && !est.avisados.includes(o.id));
  if (novos.length) { est.avisados = novos.map(o => o.id).concat(est.avisados).slice(0, 300); est.fila = { t: agora, cursor: '' }; est.envio = { t: agora, enviados: 0, falhas: 0, removidos: 0 }; mudou = true; }
  if (est.fila) {
    const lista = await env.PUSH.list({ prefix: 'sub:', limit: PUSH_LOTE, ...(est.fila.cursor ? { cursor: est.fila.cursor } : {}) });
    const j = await vapid(env), jwts = {}, ev = est.envio || (est.envio = { t: agora, enviados: 0, falhas: 0, removidos: 0 });
    await Promise.all(lista.keys.map(async k => {
      const e = k.metadata && k.metadata.e;
      if (!endpointValido(e)) return;
      let st = 0; try { st = await enviaPush(e, j, jwts, agora); } catch (x) { st = 0; }
      if (st >= 200 && st < 300) ev.enviados++;
      else if (st === 404 || st === 410) { ev.removidos++; await env.PUSH.delete(k.name); }
      else ev.falhas++;
    }));
    est.fila = lista.list_complete ? null : { t: est.fila.t, cursor: lista.cursor };
    mudou = true;
  }
  if (mudou) await env.PUSH.put('estado', JSON.stringify(est));
  return { r: novos.length ? 'avisou' : est.fila ? 'enviando' : 'nada', novos: novos.length };
}
// ---------- Alertas de ônibus (Web Push) ----------
// Cada aparelho guarda aqui até AL_MAX alertas ("avise quando o 485 estiver a 5 min do ponto X"). O gatilho Cron
// (de preferência a cada minuto) confere:
// - ônibus da cidade ("c"): o app manda o trecho do traçado que chega ao ponto (corredor); o Worker acha os ônibus
//   ao vivo da linha sobre o corredor, indo no sentido do ponto, e estima o tempo pela distância e velocidade;
// - linhas internas da UFRJ ("i"), que não têm GPS: o app manda os horários estimados no ponto.
// Tudo fica num documento só do KV ("alertas"), lido uma vez por minuto; "alst" guarda o que já foi avisado e o
// texto de cada aviso, que o service worker busca em /push/aviso.
const AL_MAX = 15, AL_COR = 6, AL_PTS = 80, AL_PERTO_M = 70;
const inteiro = (v, a, b) => { v = Math.round(+v); return v >= a && v <= b ? v : null; };
export function alertaValido(a) {
  if (!a || typeof a !== 'object') return null;
  const tipo = a.tipo === 'i' ? 'i' : a.tipo === 'c' ? 'c' : null, min = inteiro(a.min, 1, 30), id = String(a.id || '').slice(0, 24);
  if (!tipo || !min || !id) return null;
  const o = { id, tipo, min, nome: String(a.nome || '').slice(0, 60) };
  if (Array.isArray(a.dias)) o.dias = a.dias.map(d => inteiro(d, 0, 6)).filter(d => d != null).slice(0, 7);
  const de = inteiro(a.de, 0, 1439), ate = inteiro(a.ate, 0, 1439); if (de != null && ate != null) { o.de = de; o.ate = ate; }
  const fim = +a.fim; if (fim > 0) o.fim = Math.min(fim, Date.now() + 12 * 3600e3);
  if (a.uma) o.uma = 1;
  if (tipo === 'c') {
    o.l = (Array.isArray(a.l) ? a.l : []).map(x => String(x).toUpperCase().slice(0, 8)).filter(linhaDeVerdade).slice(0, 12);
    if (a.v) o.v = String(a.v).slice(0, 12);
    o.cor = (Array.isArray(a.cor) ? a.cor : []).slice(0, AL_COR).map(c => (Array.isArray(c) ? c : []).slice(0, AL_PTS * 2).map(x => Math.round(+x))).filter(c => c.length >= 4 && c.length % 2 === 0 && c.every(Number.isFinite));
    if (!o.cor.length) return null;
  } else {
    o.txt = String(a.txt || '').slice(0, 60);
    o.horas = (Array.isArray(a.horas) ? a.horas : []).map(h => inteiro(h, 0, 1439)).filter(h => h != null).slice(0, 600);
    if (!o.horas.length) return null;
  }
  return o;
}
async function guardaAlertas(env, k, e, lista) {
  const L = (Array.isArray(lista) ? lista : []).map(alertaValido).filter(Boolean).slice(0, AL_MAX);
  const d = (await env.PUSH.get('alertas', 'json')) || {};
  // "só o próximo" que já avisou: o app apaga do aparelho (o sininho volta a ficar desligado) e o Worker não guarda de novo
  const st = (await env.PUSH.get('alst', 'json')) || {}, agora = Date.now(), feitos = [];
  const novos = L.filter(a => { if (a.uma && st.av && st.av[k + '|' + a.id + '|uma'] > agora) { feitos.push(a.id); return false; } return true; });
  if (novos.length) d[k] = { e, a: novos, t: agora }; else delete d[k];
  await env.PUSH.put('alertas', JSON.stringify(d));
  return { ok: true, n: novos.length, feitos };
}
// distância (m) que falta até o fim do corredor para um ônibus sobre ele indo no sentido certo; null se não está nele
export function faltaNoCorredor(o, cor) {
  const kx = KX_M / 1e5, ky = KY_M / 1e5, px = o.lo * 1e5 * kx, py = o.la * 1e5 * ky;
  let melhor = null, acum = 0; const comp = [];
  for (let i = 2; i < cor.length; i += 2) comp.push(Math.hypot((cor[i + 1] - cor[i - 1]) * kx, (cor[i] - cor[i - 2]) * ky));
  const total = comp.reduce((a, b) => a + b, 0);
  for (let i = 2, j = 0; i < cor.length; i += 2, j++) {
    const ax = cor[i - 1] * kx, ay = cor[i - 2] * ky, bx = cor[i + 1] * kx, by = cor[i] * ky, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)), d = Math.hypot(px - ax - t * dx, py - ay - t * dy);
    if (d < AL_PERTO_M && (!melhor || d < melhor.d)) melhor = { d, m: total - acum - t * comp[j], rumo: (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360 };
    acum += comp[j];
  }
  if (!melhor) return null;
  // andando no sentido contrário ao do corredor (outra pista da mesma rua): não vale
  if (o.vel > 5) { const dif = Math.abs(((o.dir - melhor.rumo) % 360 + 540) % 360 - 180); if (dif > 100) return null; }
  return melhor.m;
}
// tempo (s) até o ponto: velocidade do ônibus puxada para uma média de cidade, mais ~12 s de parada a cada 400 m
export function etaOnibus(o, m, agora) {
  const v = Math.max(12, 0.5 * (o.vel || 0) + 10) / 3.6;
  return Math.max(0, m / v + 12 * Math.floor(m / 400) - Math.max(0, Math.min(90, (agora - o.t) / 1000)));
}
export function alertaNaHora(a, agora) {
  if (a.fim && agora > a.fim) return false;
  const d = new Date(agora - 3 * 3600e3), dia = d.getUTCDay(), m = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (a.dias && a.dias.length && !a.dias.includes(dia)) return false;
  if (a.de != null && a.ate != null && !(a.de <= a.ate ? m >= a.de && m <= a.ate : m >= a.de || m <= a.ate)) return false;
  return true;
}
const distTxt = m => m < 950 ? Math.max(50, Math.round(m / 50) * 50) + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
// decide o que avisar agora: devolve [{chave, t, c}] para um alerta
export function conferirAlerta(a, onibus, agora) {
  const out = [], d = new Date(agora - 3 * 3600e3), dia = d.toISOString().slice(0, 10), m = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (!alertaNaHora(a, agora)) return out;
  if (a.tipo === 'i') {
    for (const h of a.horas) { const f = h - m; if (f >= 0 && f <= a.min) { out.push({ chave: a.id + '|' + dia + '|' + h, t: (a.txt || 'Ônibus da UFRJ') + ' passa em ' + (f ? '~' + f + ' min' : 'instantes'), c: 'Em ' + a.nome + '. Horário estimado.' }); break; } }
    return out;
  }
  let melhor = null;
  for (const o of onibus) {
    if (a.v ? o.v !== a.v : (a.l.length && !a.l.includes(o.l))) continue;
    for (const cor of a.cor) { const falta = faltaNoCorredor(o, cor); if (falta == null || falta < 25) continue;
      const s = etaOnibus(o, falta, agora); if (s <= a.min * 60 && (!melhor || s < melhor.s)) melhor = { o, s, falta }; }
  }
  if (melhor) { const min = Math.round(melhor.s / 60);
    out.push({ chave: a.id + '|' + melhor.o.v, t: melhor.o.l + ' chega em ' + (min ? '~' + min + ' min' : 'instantes'), c: 'Em ' + a.nome + ', a ' + distTxt(melhor.falta) + '. Carro ' + melhor.o.v + '. Estimativa pela posição ao vivo.' }); }
  return out;
}
export async function avisaOnibus(env, ctx, agora) {
  if (!env.PUSH) return { r: 'sem-config' };
  const D = (await env.PUSH.get('alertas', 'json')) || {}, subs = Object.keys(D);
  if (!subs.length) return { r: 'nada', n: 0 };
  // só busca as posições se algum alerta de ônibus da cidade vale agora
  const precisa = subs.some(k => D[k].a.some(a => a.tipo === 'c' && alertaNaHora(a, agora)));
  let onibus = [];
  if (precisa) { try { onibus = (await buscar(agora)).onibus; } catch (e) { onibus = []; } }
  const st = (await env.PUSH.get('alst', 'json')) || {}; st.av = st.av || {}; st.msgs = st.msgs || {};
  for (const k of Object.keys(st.av)) if (st.av[k] < agora) delete st.av[k];
  for (const k of Object.keys(st.msgs)) if (st.msgs[k].exp < agora) delete st.msgs[k];
  const enviar = []; let mudouD = false;
  for (const k of subs) {
    const vivos = D[k].a.filter(a => !(a.fim && agora > a.fim));
    if (vivos.length !== D[k].a.length) { mudouD = true; if (vivos.length) D[k].a = vivos; else { delete D[k]; continue; } }
    for (const a of D[k].a) for (const x of conferirAlerta(a, onibus, agora)) {
      const ch = k + '|' + x.chave; if (st.av[ch] || (a.uma && st.av[k + '|' + a.id + '|uma'])) continue;
      st.av[ch] = agora + (a.tipo === 'i' ? 40 : 25) * 60e3; if (a.uma) st.av[k + '|' + a.id + '|uma'] = agora + 12 * 3600e3;
      if (!enviar.some(y => y.k === k)) { st.msgs[k] = { t: x.t, c: x.c, tag: 'onibus-' + a.id, exp: agora + 10 * 60e3 }; enviar.push({ k, e: D[k].e }); }
    }
  }
  if (enviar.length) {
    await env.PUSH.put('alst', JSON.stringify(st));
    const j = await vapid(env), jwts = {};
    await Promise.all(enviar.slice(0, PUSH_LOTE).map(async x => { let s = 0; try { s = await enviaPush(x.e, j, jwts, agora, 'onibus'); } catch (e) { s = 0; }
      if (s === 404 || s === 410) { delete D[x.k]; mudouD = true; } }));
  }
  if (mudouD) await env.PUSH.put('alertas', JSON.stringify(D));
  return { r: enviar.length ? 'avisou' : 'nada', n: enviar.length, aparelhos: subs.length };
}
async function saudePush(env) {
  if (!env.PUSH) return { configurado: false };
  try {
    const est = (await env.PUSH.get('estado', 'json')) || {}, l = await env.PUSH.list({ prefix: 'sub:', limit: 1000 });
    const al = (await env.PUSH.get('alertas', 'json')) || {};
    return { configurado: true, alertasOnibus: { aparelhos: Object.keys(al).length, alertas: Object.values(al).reduce((n, x) => n + x.a.length, 0) }, assinantes: l.keys.length, maisDe: !l.list_complete || undefined, ultimoEnvio: est.envio || null };
  } catch (e) { return { configurado: true, erro: String(e.message || e).slice(0, 80) }; }
}

export default {
  async fetch(req, env, ctx) {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-expose-headers': 'x-prox, x-cache', 'content-type': 'application/json; charset=utf-8' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const caminho = new URL(req.url).pathname.replace(/\/$/, '');
    if (caminho.startsWith('/push/')) return rotaPush(caminho, req, env, cors);
    if (new URL(req.url).pathname.replace(/\/$/, '') === '/tiroteios') return tiroteios(env, ctx, cors);
    if (new URL(req.url).pathname.replace(/\/$/, '') === '/saude') return saude(env, cors, req);
    const chave = new Request('https://cache.local/gps-fundao');
    const cache = caches.default;
    const guardado = await cache.match(chave);
    // x-prox: em quantos ms sai a próxima posição nova (o app marca o próximo pedido para logo depois)
    if (guardado) {
      const fim = +guardado.headers.get('x-fim') || 0, prox = fim ? Math.max(0, fim - Date.now()) : CACHE_S * 1000;
      return new Response(guardado.body, { headers: { ...cors, 'x-cache': 'hit', 'x-prox': String(prox) } });
    }
    const reserva = new Request('https://cache.local/gps-fundao-reserva');
    const agora = Date.now();
    let onibus = [], falhou = true, parcial = false, fontes = [];
    try { ({ onibus, falhou, parcial, fontes } = await buscar(agora)); } catch (e) { falhou = true; fontes = [{ f: 'worker', ok: false, motivo: 'erro no Worker: ' + String(e.message || e).slice(0, 80) }]; }
    if (falhou) {
      const velho = await cache.match(reserva);
      ctx.waitUntil(registrar({ t: agora, r: velho ? 'reserva' : 'falhou', fontes }).catch(() => {}));
      if (velho) return new Response(velho.body, { headers: { ...cors, 'x-cache': 'antiga', 'x-prox': '5000' } });
      /* sem cópia guardada: responde que falhou (com CORS), em vez de deixar o app sem resposta */
      return new Response(JSON.stringify({ t: agora, fonte: 'SMTR / Prefeitura do Rio (dados.mobilidade.rio)', onibus: [], falhou: true }), { headers: { ...cors, 'cache-control': 'no-store' } });
    }
    // Só uma das fontes respondeu (ônibus comuns ou BRT): os da fonte que falhou continuam no mapa com a última
    // posição guardada (até VELHO_MIN), em vez de sumirem até a prefeitura do Rio voltar.
    if (parcial) {
      try { const v = await cache.match(reserva); if (v) onibus = completar(onibus, (await v.json()).onibus, agora); } catch (e) { /* sem cópia: segue só com o que veio */ }
    }
    const fora = contarFora(onibus);
    ctx.waitUntil(registrar({ t: agora, r: fontes.every(f => f.ok) ? 'ok' : 'parcial', n: onibus.length, fontes, ...(Object.keys(fora).length ? { fora } : {}) }).catch(() => {}));
    ctx.waitUntil(registrarFora(fora, agora).catch(() => {}));
    const corpo = JSON.stringify({ t: agora, fonte: 'SMTR / Prefeitura do Rio (dados.mobilidade.rio)', onibus, ...(parcial ? { parcial: true } : {}) });
    const ms = validade(fontes, agora), fim = agora + ms;
    const resp = new Response(corpo, { headers: { ...cors, 'x-prox': String(ms) } });
    ctx.waitUntil(cache.put(chave, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${Math.max(1, Math.round(ms / 1000))}`, 'x-fim': String(fim) } })));
    if (!falhou) ctx.waitUntil(cache.put(reserva, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${RESERVA_S}` } })));
    return resp;
  },
  // gatilho Cron (Settings › Triggers › Cron Triggers: */5 * * * *): avisos de tiroteio
  // Com o gatilho a cada minuto (* * * * *), os alertas de ônibus são conferidos a cada minuto e os tiroteios a cada 5.
  async scheduled(evento, env, ctx) {
    const agora = Date.now();
    ctx.waitUntil(avisaOnibus(env, ctx, agora).catch(() => {}));
    if (new Date(evento && evento.scheduledTime || agora).getUTCMinutes() % 5 === 0) ctx.waitUntil(avisaTiroteios(env, ctx, agora).catch(() => {}));
  }
};
// Por que os pedidos falharam hoje (status da Cloudflare: success, exceededResources = passou do limite de
// processamento, scriptThrewException = erro no código…), pedidos e erros por hora e o tempo de processamento.
// É uma consulta à parte: se a API de análise recusar algum campo, o resto da aba Saúde continua funcionando.
export async function detalheCloudflare(env, agora) {
  const token = limpaSegredo(env.CF_TOKEN), conta = limpaSegredo(env.CF_CONTA);
  if (!conta || !token) return null;
  const d = new Date(agora), desde = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
  const query = 'query($c:String!,$a:Time!,$b:Time!){viewer{accounts(filter:{accountTag:$c}){workersInvocationsAdaptive(limit:1000,filter:{datetime_geq:$a,datetime_leq:$b}){sum{requests errors}quantiles{cpuTimeP50 cpuTimeP99}dimensions{scriptName status datetimeHour}}}}}';
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ query, variables: { c: conta, a: desde, b: new Date(agora).toISOString() } }), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('analytics ' + r.status);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error('analytics: ' + j.errors[0].message);
  const linhas = (((j.data || {}).viewer || {}).accounts || [])[0]?.workersInvocationsAdaptive || [];
  const porStatus = {}, porHora = {};let cpu50 = 0, cpu99 = 0, peso = 0;
  for (const l of linhas) {
    const dm = l.dimensions || {}, n = l.sum.requests || 0, st = dm.status || '?', h = dm.datetimeHour || '';
    porStatus[st] = (porStatus[st] || 0) + n;
    const H = porHora[h] || (porHora[h] = { h, pedidos: 0, falhas: 0 });
    H.pedidos += n; if (st !== 'success') H.falhas += n;
    const q = l.quantiles || {};
    if (q.cpuTimeP50 != null) { cpu50 += q.cpuTimeP50 * n; peso += n; cpu99 = Math.max(cpu99, q.cpuTimeP99 || 0); }
  }
  return { porStatus, porHora: Object.values(porHora).sort((a, b) => a.h < b.h ? -1 : 1), cpuMedianoMs: peso ? +(cpu50 / peso / 1000).toFixed(1) : null, cpuP99Ms: cpu99 ? +(cpu99 / 1000).toFixed(1) : null };
}
