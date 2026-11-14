// Coleta as posições dos ônibus da cidade em volta do Fundão, para conferir os horários e a espera nos pontos
// (tools/conferir_horarios.py) com sábados, domingos e o BRT, que o GPS guardado em tools/dados não tem.
// A API antiga da prefeitura do Rio, que dava o histórico por período, saiu do ar (nov/2026); agora só há as posições
// de agora. Por isso, pergunta ao Worker do app (que já filtra a região e as linhas) a cada 15 s e grava num CSV
// no mesmo formato de tools/dados/gps-*.csv.gz.
// Uso: node tools/coletar_gps.mjs <minutos> <arquivo.csv>   (roda na tarefa .github/workflows/coletar-gps.yml)
import fs from 'node:fs';
const [min = '60', saida = 'gps.csv'] = process.argv.slice(2);
const cfg = fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8');
const URL_GPS = process.env.GPS_URL || (cfg.match(/CSE_GPS_URL\s*=\s*"([^"]+)"/) || [])[1];
if (!URL_GPS) { console.error('sem CSE_GPS_URL no config.js'); process.exit(1); }
const fim = Date.now() + (+min) * 60e3, visto = new Set();
const horaRio = t => new Date(t - 3 * 3600e3).toISOString().slice(0, 19);  // o Rio não tem horário de verão
if (!fs.existsSync(saida)) fs.writeFileSync(saida, 'id_veiculo,servico,sentido,latitude,longitude,velocidade,direcao,datetime,shape_id\n');
let n = 0, falhas = 0;
while (Date.now() < fim) {
  const t0 = Date.now();
  try {
    const r = await fetch(URL_GPS + '/?coleta=1', { headers: { 'user-agent': 'chega-ai-ufrj-coleta' } });
    const j = await r.json(), linhas = [];
    for (const o of j.onibus || []) {
      const k = o.v + '|' + o.t; if (visto.has(k)) continue; visto.add(k);
      linhas.push([o.v, o.l, o.s || '', o.la, o.lo, o.vel ?? '', o.dir ?? '', horaRio(o.t), ''].join(','));
    }
    if (linhas.length) { fs.appendFileSync(saida, linhas.join('\n') + '\n'); n += linhas.length; }
  } catch (e) { falhas++; }
  if (visto.size > 200000) visto.clear();
  await new Promise(res => setTimeout(res, Math.max(1000, 15000 - (Date.now() - t0))));
}
console.log(n, 'posições gravadas em', saida, '·', falhas, 'falhas');
