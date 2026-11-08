# Chega aí UFRJ: instruções para o Claude Code

App web (sem framework) da Cidade Universitária da UFRJ, publicado pelo GitHub Pages a partir da raiz deste repositório.

## Onde fica o código
- O fonte está em `src/`, separado por assunto (lista e descrição em `src/PARTES.md`):
  - `src/pagina/`: cabeçalho, estrutura (HTML) e fim da página;
  - `src/css/NN-*.css` e `src/js/NN-*.js`: estilos e código, juntados na ordem dos números;
  - `src/ext_onibus.json`: dados dos ônibus da cidade (gerado por `tools/gtfs_fundao.py`).
  - `src/edificacoes.json`: prédios que faltavam na planta do mapa (gerado por `tools/edificacoes_ufrj.py` a partir do cadastro da UFRJ no ArcGIS, copiado em `tools/dados/`).
  - `src/redutores.json`: semáforos e lombadas (UFRJ e OpenStreetMap) para a previsão dos ônibus, gerado por `tools/redutores.py` (fontes em `tools/dados/redutores-fontes.json`).
  - Planta do CT (`src/js/21-planta-ct.js`): no celular em pé, quando o enquadramento é mais largo que alto, a planta gira 90° (o Bloco A fica em cima).
  - `mapa-*.jpg` (capa, fundos e visão geral do mapa): refeitas por `tools/planta_imagens.py` a partir das originais em `tools/dados/planta/` e de `src/edificacoes.json`. Rode depois de mudar os prédios. Os `mapa-campus*.svg` (zoom) ficam como estão; os prédios entram por cima pelo app.
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
- Perfil dos trechos (dias úteis): `tools/perfil_trechos.py <gps.csv…>` guarda, por traçado, sentido, trecho de 60 m e faixa de horário (5–7h, 7–9h, 9–13h, 13–18h e noite 18–5h; as faixas vão no arquivo e o app as lê de lá), a velocidade com que os ônibus seguem dali, e gera `perfil-onibus.json` (raiz do site). Cada dia é testado com o perfil dos outros dias; um período só entra com ganho de pelo menos 2% e 1 m e sem piorar na maioria dos dias. Fins de semana e feriados (`FERIADOS` em `06-calendario-e-lugares.js`) usam a previsão de sempre. Peças comuns das ferramentas em `tools/previsao_comum.py`; a conta do app é conferida por `tests/teste-previsao.js`.
- Seguir um ônibus (`src/js/28-seguir-onibus.js`): "Buscar ônibus" no mapa acha os ônibus ao vivo pela linha, destino ou carro; seguir um deles (ou tocá-lo no mapa) faz o mapa acompanhá-lo, desenha o caminho feito e mostra o próximo ponto com o tempo estimado (perfil dos trechos quando há). Com o ônibus fora da tela, uma seta na borda aponta para ele. Guardado no aparelho (`cse-seguir`) por 30 min. Teste: `tests/teste-seguir.js`.
- Ruas ao redor da ilha (`src/js/29-ruas-cidade.js`): esboço das vias fora da ilha (OpenStreetMap, ODbL, com crédito no mapa), só com a camada "Ônibus da cidade" ligada; aí o mapa pode ser arrastado até a área do ao vivo (`LIMITES_EXTRA` em `03-mapa.js`). `ruas-cidade.json` (raiz) é gerado por `tools/ruas_cidade.py` a partir da cópia em `tools/dados/osm-ruas-fundao.json.gz`; dentro da ilha vale a planta.
- Semáforos e lombadas: `tools/redutores.py <gps.csv>` testa a previsão com o GPS da prefeitura (70% treino, 30% teste) e só grava em `src/redutores.json` o tempo perdido em cada um se reduzir o erro em pelo menos 2% e 1 m; sem `ajuste`, a previsão não muda. Também lista em `tools/dados/paradas-fora-dos-pontos.csv` onde vários ônibus param longe de um ponto. As medições dos aparelhos guardam o traçado e a posição ao longo dele (de 5 em 5 m).

## Tiroteios (Fogo Cruzado)
- Opcional, desligado por padrão (`CFG.tiroteios`). O Worker atende `/tiroteios` com a conta do projeto (segredos `FC_EMAIL` e `FC_SENHA` na Cloudflare; nunca no código). Só registros das últimas 6 h perto das saídas da ilha, com fonte e horário; sem dados, o app diz que não há dados.

## Gestão › Saúde e estatísticas
- `src/js/25-saude.js`: confere, a partir do aparelho do gestor, site, Worker, GPS da prefeitura, Fogo Cruzado, cota do Worker (rota `/saude`, segredos opcionais `CF_CONTA` e `CF_TOKEN`), Firebase, Open-Meteo, ipify, validade do GTFS e planta do CT; mostra números de uso. Só lê.
- Cardápio do RU: só um atalho para o BandejApp (`src/js/24-bandejapp.js`); não usar o serviço de dados deles sem acordo.

## Visão do projeto
Mobilidade e acesso ao campus para quem precisa chegar ao Fundão: calouros, pacientes do HU, moradores da Vila Residencial, trabalhadores e visitantes.
