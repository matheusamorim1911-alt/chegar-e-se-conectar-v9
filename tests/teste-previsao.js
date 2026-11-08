// Confere a conta da previsão dos ônibus (lvDist em src/js/22-onibus-ao-vivo.js) com casos feitos à mão,
// os mesmos que tools/redutores.py usa para testar semáforos e lombadas com o GPS da prefeitura.
const fs = require('fs'), path = require('path');
const fonte = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '22-onibus-ao-vivo.js'), 'utf8');
const i = fonte.indexOf('function lvDist(O,dt){'), j = fonte.indexOf('\n}\n', i);
if (i < 0 || j < 0) { console.log('FALHA  não achei lvDist'); process.exit(1); }
const lvDist = new Function('SHP', 'MPU', 'LV_PONTO_IGNORA', 'LV_EV_IGNORA', 'LV_PONTO_S', 'LV_HIST', 'lvV',
  fonte.slice(i, j + 2) + '\nreturn lvDist;')([{ st: [100] }, { st: [100], ev: [[150, 4], [400, 2]] }, { st: [] }], 1, 25, 10, 12, null, O => O.v);
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
process.exit(falhou ? 1 : 0);
