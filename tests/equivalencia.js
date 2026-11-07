// Teste de equivalência: percorre as telas do app com hora fixa e dados simulados (Firebase, GPS dos ônibus)
// e grava o HTML de cada tela. Serve para reorganizar o código provando que nada mudou para quem usa.
// Uso: node tests/equivalencia.js <pasta do site> <saida.json>
//      node tests/equivalencia.js --comparar antes.json depois.json
const fs = require('fs'), path = require('path');
if (process.argv[2] === '--comparar') {
  // a classe 'ent' marca a animação de entrada e depende do tempo de cada máquina: não conta como diferença
  const lim = o => { for (const k in o) o[k] = o[k].replace(/(class="[^"]*?)\s?\bent\b/g, '$1'); return o; };
  const A = lim(JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))), B = lim(JSON.parse(fs.readFileSync(process.argv[4], 'utf8')));
  let dif = 0;
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    if (A[k] === B[k]) continue;
    dif++;
    const a = A[k] || '', b = B[k] || '';
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.log('DIFERENTE  ' + k + '\n   antes:  …' + a.slice(Math.max(0, i - 120), i + 200) + '\n   depois: …' + b.slice(Math.max(0, i - 120), i + 200));
  }
  console.log(dif ? dif + ' telas diferentes' : 'ok     ' + Object.keys(A).length + ' telas idênticas');
  process.exit(dif ? 1 : 0);
}
const { chromium } = require('playwright'); const servir = require('./servidor');
const SITE = path.resolve(process.argv[2]), SAIDA = process.argv[3];
const HORA = new Date('2026-11-04T10:30:00-03:00');  // quarta-feira, aula, ônibus rodando
const mockFb = fs.readFileSync(path.join(__dirname, 'firebase-mock.js'), 'utf8');
const ONIBUS = JSON.parse(fs.readFileSync(path.join(__dirname, 'amostra-onibus.json'), 'utf8')).onibus;
const GESTOR = { uid: 'uG', displayName: 'Gestora Teste', email: 'gestor@ufrj.br', photoURL: '', emailVerified: true, providerData: [{ providerId: 'google.com' }] };
const LOJA = { 'meta/vagas': { n: 3, max: 80 }, 'gestores/gestor@ufrj.br': {}, 'members/uG': { nome: 'Gestora Teste', email: 'gestor@ufrj.br', last: 1 },
  'feedback/f1': { nota: 4, texto: 'Gostei do mapa', ts: HORA.getTime() - 3600e3, ver: 'x' }, 'erros/e1': { msg: 'TypeError: teste', ts: HORA.getTime() - 7200e3, ver: 'x', ua: 'Mac · Safari' } };
const out = {};
function normal(h) {
  return h.replace(/\d{8}-\d{4}/g, 'VERSAO').replace(/\?v=[\w-]+/g, '?v=X');
}
async function cena(b, nome, opc, passos) {
  const c = await b.newContext({ viewport: opc.vp || { width: 1200, height: 850 }, colorScheme: opc.esquema || 'dark', serviceWorkers: 'block', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await c.route(/gstatic\.com\/firebasejs\/.*app-compat\.js/, r => r.fulfill({ contentType: 'text/javascript', body: mockFb }));
  await c.route(/gstatic\.com\/firebasejs\/.*(auth|firestore)-compat\.js/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await c.route(/open-meteo|arcgisonline|openstreetmap|googleapis\.com\/css|fonts\.g/, r => r.abort());
  await c.route('**workers.dev**', r => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ t: HORA.getTime(), onibus: ONIBUS.map(o => ({ ...o, t: HORA.getTime() - 20000 })) }) }));
  await c.addInitScript(([loja, gestor, cfg, extra]) => {
    let s = 7; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    window.__fbstore = JSON.parse(JSON.stringify(loja)); window.__nextUser = gestor;
    if (!sessionStorage.getItem('__ini')) { sessionStorage.setItem('__ini', 1); if (cfg) localStorage.setItem('cse-cfg', JSON.stringify(cfg)); for (const k in extra) localStorage.setItem(k, extra[k]); }
  }, [LOJA, GESTOR, opc.cfg === undefined ? { cover: 'none', banner: false, login: false, flow: false } : opc.cfg, opc.extra || {}]);
  const p = await c.newPage(); await p.clock.setFixedTime(HORA);
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto(opc.url); await p.waitForTimeout(1800);
  const foto = async (n, sel) => { await p.waitForTimeout(500); out[nome + ' · ' + n] = normal(await p.evaluate(s => { const e = s ? document.querySelector(s) : document.body; return e ? e.outerHTML : '(sem ' + s + ')'; }, sel || null)); };
  const passo = async (n, f, sel) => { try { await f(p); await foto(n, sel); } catch (e) { out[nome + ' · ' + n] = 'ERRO: ' + e.message.split('\n')[0]; } };
  for (const [n, f, sel] of passos) await passo(n, f, sel);
  out[nome + ' · erros de JavaScript'] = JSON.stringify(erros);
  await c.close();
}
const abreTudo = sel => p => p.evaluate(s => document.querySelectorAll(s + ' details').forEach(d => d.open = true), sel);
const clica = (sel, i) => p => p.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i || 0]; if (!e) throw new Error('não achei ' + s); if (e.click) e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, [sel, i || 0]);
(async () => {
  const srv = await servir(8811, SITE); const b = await chromium.launch(); const url = 'http://localhost:8811/';
  await cena(b, 'computador', { url, extra: { 'cse-lay-ext': '1' } }, [
    ['início', async () => {}],
    ['aba Trajetos aberta', async p => { await clica('[data-tab="trajeto"]')(p); await abreTudo('#pane-trajeto')(p); }],
    ['aba Lugares', async p => { await clica('[data-tab="predios"]')(p); await abreTudo('#pane-predios')(p); }],
    ['aba Grade', clica('[data-tab="grade"]')],
    ['aba Calendário', clica('[data-tab="cal"]')],
    ['ponto interno', async p => { await clica('[data-tab="trajeto"]')(p); await clica('#map .mk:not(.ext)')(p); }],
    ['ponto da prefeitura', clica('#map .mk.ext:not(.xlive)')],
    ['ônibus ao vivo', clica('#map .xlive')],
    ['menu Ônibus', clica('#chBus')],
    ['Ajustes', async p => { await clica('#tab-cfg')(p); await abreTudo('#pane-cfg')(p); }, '#pane-cfg'],
    ['glossário', async p => { await clica('#cfgClose')(p); await clica('#glossBtn')(p); }, '#glossM'],
    ['glossário busca', async p => { await p.fill('#glQ', 'CT'); }, '#glossM'],
    ['login Google', async p => { await clica('#glClose')(p); await clica('#tab-cfg')(p); await p.waitForTimeout(300); await clica('#accsec [data-goo]')(p); await p.waitForTimeout(1500); await abreTudo('#pane-cfg')(p); }, '#pane-cfg'],
    ['grade logada', async p => { await clica('#cfgClose')(p); await clica('[data-tab="grade"]')(p); }],
    ...['geral', 'usuarios', 'linhas', 'pontos', 'wifi', 'servicos', 'solic', 'plantas', 'avisos', 'padrao', 'feedback', 'previsao', 'rede'].map(g =>
      ['gestão ' + g, async p => { if (!(await p.evaluate(() => { const m = document.getElementById('gestM'); return m && !m.hidden; }))) await clica('#gestBtn')(p); await p.waitForTimeout(300); await clica('.gtab[data-gtab="' + g + '"]')(p); await p.waitForTimeout(500); }, '#gestM']),
  ]);
  await cena(b, 'celular claro', { url, vp: { width: 390, height: 844 }, esquema: 'light', cfg: { cover: 'none', banner: false, login: false, flow: false, tema: 'claro' } }, [
    ['início', async () => {}],
    ['aba Trajetos', clica('[data-tab="trajeto"]')],
    ['aba Lugares', clica('[data-tab="predios"]')],
    ['prédios por dentro', async p => { await p.evaluate(() => { const d = document.getElementById('fdBld'); if (!d) throw new Error('sem #fdBld'); if (!d.open) d.querySelector('summary').click(); }); await p.waitForTimeout(2000); }],
    ['Ajustes', async p => { await clica('#tab-cfg')(p); await abreTudo('#pane-cfg')(p); }, '#pane-cfg'],
  ]);
  await cena(b, 'primeira visita', { url, cfg: null }, [
    ['capa', async () => {}],
    ['seta para o login', clica('#cvToLogin')],
  ]);
  await b.close(); srv.close();
  fs.writeFileSync(SAIDA, JSON.stringify(out, null, 0));
  const erros = Object.entries(out).filter(([k, v]) => v.startsWith('ERRO')).map(([k, v]) => k + ': ' + v);
  console.log(Object.keys(out).length + ' telas gravadas em ' + SAIDA + (erros.length ? '\npassos que falharam (também são comparados):\n  ' + erros.join('\n  ') : ''));
})();
