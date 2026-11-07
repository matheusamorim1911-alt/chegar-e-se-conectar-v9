# Chega aí UFRJ: instruções para o Claude Code

App web (sem framework) da Cidade Universitária da UFRJ, publicado pelo GitHub Pages a partir da raiz deste repositório.

## Onde fica o código
- O fonte está em `src/`, separado por assunto (lista e descrição em `src/PARTES.md`):
  - `src/pagina/`: cabeçalho, estrutura (HTML) e fim da página;
  - `src/css/NN-*.css` e `src/js/NN-*.js`: estilos e código, juntados na ordem dos números;
  - `src/ext_onibus.json`: dados dos ônibus da cidade (gerado por `tools/gtfs_fundao.py`).
- `tools/montar.py` junta as partes num arquivo único (`app-completo.html`, o que vai para o claude.ai).
- `python3 tools/build_site.py` gera o site: `app.js`, `style.css`, o corpo do `index.html`, `version.json` e `sw.js`. **Nunca edite esses arquivos à mão.** O cabeçalho do `index.html` (até `<body>`) é mantido.

## Regras
- **Nenhuma parte substitui função de outra** (nada de `var _x=x; x=function(){...}`). Para acrescentar algo a uma tela central, registre uma etapa: `aoFazer('mapa montado', function(){...})`. As etapas existentes: `mapa vai montar`, `mapa montado`, `mapa atualizado`, `vista aplicada`, `trajeto montado`, `detalhe montado`, `ajustes montados`, `gestão montada`, `dados da gestão aplicados`, `tudo reconstruído`, `gestor definido`, `Firebase conectado`, `usuário saiu`. Elas rodam na ordem em que as partes são carregadas.
- Funcionalidade nova: arquivo novo em `src/js/` (e `src/css/`), com número depois do último, e uma linha em `src/PARTES.md`.
- Estado e dados usados por funções chamadas logo na carga ficam antes delas (cuidado com a ordem dos arquivos).
- Textos da interface em português do Brasil, frases curtas.
- Depois de mudar: `npm test`. Para reorganizar código sem mudar nada para quem usa, compare as telas antes e depois:
  `node tests/equivalencia.js <site antes> antes.json`, `node tests/equivalencia.js . depois.json`, `node tests/equivalencia.js --comparar antes.json depois.json`.
- Se mudar `firestore.rules`, avise que ela precisa ser **publicada no console do Firebase**. Se mudar `worker/`, avise que o Worker precisa ser **publicado de novo na Cloudflare**.
- Não apague documentos da coleção `erros` do Firestore sem o responsável pedir.
- Os nomes internos de armazenamento (`cse-…` no aparelho, coleções do Firestore, projeto Firebase `chegar-e-se-conectar`) ficam como estão para não perder dados.

## Ônibus da cidade
- Posições ao vivo: Worker da Cloudflare (`worker/gps-fundao.js`) busca a API de GPS da prefeitura, guarda 5 s e, se ela falhar, devolve a última resposta boa (até 2 min). O app pede a cada 10 s.
- Previsão: velocidade informada, parada de ~12 s no próximo ponto (pontos do GTFS em `EXT.shs`), encaixe no traçado da linha pelo sentido do movimento. Ajustes só entram com ganho comprovado: medições dos aparelhos (coleção `desvios`, modelo em `gestao/previsao`, campo `b2`) ou `historico-previsao.json` (gerado por `tools/historico_gps.py`, ver `tools/HISTORICO.md`), que desliga a coleta pelos aparelhos.

## Visão do projeto
Mobilidade e acesso ao campus para quem precisa chegar ao Fundão: calouros, pacientes do HU, moradores da Vila Residencial, trabalhadores e visitantes.
