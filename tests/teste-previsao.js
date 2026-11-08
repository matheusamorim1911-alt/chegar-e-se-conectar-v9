// Confere a conta da previsão dos ônibus (lvDist em src/js/22-onibus-ao-vivo.js) com casos feitos à mão,
// os mesmos que tools/redutores.py usa para testar semáforos e lombadas com o GPS da prefeitura.
const fs = require('fs'), path = require('path');
const fonte = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '22-onibus-ao-vivo.js'), 'utf8');
const pega = nome => { const i = fonte.indexOf('function ' + nome + '(O,dt){'), j = fonte.indexOf('\n}\n', i); if (i < 0 || j < 0) { console.log('FALHA  não achei ' + nome); process.exit(1); } return fonte.slice(i, j + 2); };
const lvDist = new Function('SHP', 'MPU', 'LV_PONTO_IGNORA', 'LV_EV_IGNORA', 'LV_PONTO_S', 'LV_HIST', 'lvV',
  pega('lvDist0') + '\nreturn lvDist0;')([{ st: [100] }, { st: [100], ev: [[150, 4], [400, 2]] }, { st: [] }], 1, 25, 10, 12, null, O => O.v);
// mistura com o perfil do trecho: w × previsão + (1 − w) × velocidade do trecho × tempo
const pega2 = nome => { const i = fonte.indexOf('function ' + nome + '('), j = fonte.indexOf('\n}\n', i); return fonte.slice(i, j + 2); };
const comPerfil = (pf) => new Function('lvDist0', 'lvPerfil', pega('lvDist') + '\nreturn lvDist;')(lvDist, () => pf);
let falhou = false; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA') + '  ' + m); if (!c) falhou = true; };
const O = (i, s, sign, v) => ({ i, s, sign, v });
ok(lvDist(O(0, 0, 1, 10), 30) === 180, 'para 12 s no próximo ponto e segue (100 m + 8 s × 10 m/s)');
ok(lvDist(O(0, 0, 1, 10), 5) === 50, 'ponto longe: anda na velocidade informada');
ok(lvDist(O(0, 90, 1, 10), 10) === 100, 'ponto a menos de 25 m à frente é ignorado (já está nele)');
ok(lvDist(O(0, 200, -1, 10), 30) === 180, 'no sentido contrário, o ponto fica para trás do traçado');
ok(lvDist(O(1, 0, 1, 10), 30) === 150, 'semáforo depois do ponto: perde 4 s e fica nele quando o tempo acaba');
ok(lvDist(O(1, 0, 1, 10), 60) === 400 + 10 * (60 - 10 - 12 - 5 - 4 - 25 - 2), 'semáforo e lombada no caminho somam as perdas (420 m)');
ok(lvDist(O(2, 0, 1, 10), 30) === 300, 'traçado sem pontos: velocidade informada');
ok(lvDist(O(0, 0, 1, 0), 30) === 0, 'parado continua parado');
ok(comPerfil({ v: 4, w: 0.5 })(O(2, 0, 1, 10), 30) === 0.5 * 300 + 0.5 * 4 * 30, 'com perfil do trecho: metade da previsão, metade do que os ônibus costumam fazer (210 m)');
ok(comPerfil(null)(O(2, 0, 1, 10), 30) === 300, 'sem perfil (fim de semana, feriado ou trecho sem dados): previsão de sempre');
ok(comPerfil({ v: 4, w: 0.5 })(O(0, 0, 1, 0), 30) === 0, 'parado continua parado mesmo com perfil');
// o perfil gerado por tools/perfil_trechos.py é lido com a mesma chave (traçado|sentido|período) e o mesmo trecho
const arqPerfil = path.join(__dirname, '..', 'perfil-onibus.json');
if (fs.existsSync(arqPerfil)) {
  const PF = JSON.parse(fs.readFileSync(arqPerfil, 'utf8'));
  const ate = n => { const i = fonte.indexOf('function ' + n + '('); return fonte.slice(i, fonte.indexOf('\nfunction ', i + 1) + 1); };  // a função inteira, até a próxima
  const corpo = ate('lvDiaUtil') + ate('lvPeriodo') + pega2('lvPerfil');
  const FER = [['2026-11-02', 'Finados']];
  const lvPerfil = new Function('LV_PERF', 'FERIADOS', 'MPU', 'lvmTracado', corpo + '\nreturn lvPerfil;')(PF, FER, 1, i => i);
  const [k, L] = Object.entries(PF.p).find(([k, L]) => L[1][0] >= 0); const [tr, sg, per] = k.split('|');
  const hora = PF.faixas ? PF.faixas.find(f => f[2] === per)[0] : { manha: 9, tarde: 15, noite: 20 }[per], t = new Date(2026, 10, 5, hora).getTime(), s0 = L[0] * PF.trecho_m + 1;
  const r = lvPerfil({ i: +tr, sign: +sg, s: s0, t });
  ok(r && r.v === L[1][0] / 10 && r.w === PF.periodos[per].w, 'perfil: acha o trecho ' + k + ' numa quinta-feira');
  ok(lvPerfil({ i: +tr, sign: +sg, s: s0, t: new Date(2026, 10, 8, hora).getTime() }) === null, 'perfil: domingo fica de fora');
  ok(lvPerfil({ i: +tr, sign: +sg, s: s0, t: new Date(2026, 10, 2, hora).getTime() }) === null, 'perfil: feriado fica de fora');
}
process.exit(falhou ? 1 : 0);
