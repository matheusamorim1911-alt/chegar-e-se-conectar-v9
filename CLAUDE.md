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
- Ícone do app (pin com a Ilha do Fundão): `tools/icone_app.py` gera `icone.svg` e os PNGs (`icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`) a partir do litoral do OpenStreetMap. Não usar o brasão (Minerva) da UFRJ: o app não é oficial.
- `tools/montar.py` junta as partes num arquivo único (`app-completo.html`, o que vai para o claude.ai).
- `python3 tools/build_site.py` gera o site: `app.js`, `style.css`, o corpo do `index.html`, `version.json` e `sw.js`. **Nunca edite esses arquivos à mão.** O cabeçalho do `index.html` (até `<body>`) é mantido.

## Regras
- **Nenhuma parte substitui função de outra** (nada de `var _x=x; x=function(){...}`). Para acrescentar algo a uma tela central, registre uma etapa: `aoFazer('mapa montado', function(){...})`. As etapas existentes: `mapa vai montar`, `mapa montado`, `mapa atualizado`, `vista aplicada`, `trajeto montado`, `detalhe montado`, `ajustes montados`, `gestão montada`, `dados da gestão aplicados`, `tudo reconstruído`, `gestor definido`, `Firebase conectado`, `usuário saiu`, `login fechado`. Elas rodam na ordem em que as partes são carregadas.
- Funcionalidade nova: arquivo novo em `src/js/` (e `src/css/`), com número depois do último, e uma linha em `src/PARTES.md`.
- Estado e dados usados por funções chamadas logo na carga ficam antes delas (cuidado com a ordem dos arquivos). Um erro na carga para o resto do app (as partes seguintes não rodam): `tests/teste-carga.js` abre o app com seções e camadas guardadas abertas.
- Textos da interface em português do Brasil, frases curtas.
- Depois de mudar: `npm test`. Para reorganizar código sem mudar nada para quem usa, compare as telas antes e depois:
  `node tests/equivalencia.js <site antes> antes.json`, `node tests/equivalencia.js . depois.json`, `node tests/equivalencia.js --comparar antes.json depois.json`.
- Se mudar `firestore.rules`, avise que ela precisa ser **publicada no console do Firebase**. Se mudar `worker/`, avise que o Worker precisa ser **publicado de novo na Cloudflare**.
- Não apague documentos da coleção `erros` do Firestore sem o responsável pedir.
- Os nomes internos de armazenamento (`cse-…` no aparelho, coleções do Firestore, projeto Firebase `chegar-e-se-conectar`) ficam como estão para não perder dados.

## Ônibus da cidade
- Posições ao vivo: Worker da Cloudflare (`worker/gps-fundao.js`) busca a API de GPS da prefeitura, guarda 10 s e, se ela falhar, devolve a última resposta boa (até 3 min). O app pede a cada 10 s (5 s depois de uma falha) e, se a prefeitura falhar sem cópia, mantém os ônibus que já estavam no mapa.
- A resposta da prefeitura (~3,7 MB, ~11 mil registros) é lida por varredura do texto (`extrairLinhas`): ler tudo com JSON.parse passava do limite de 10 ms de CPU do plano grátis e o Worker caía antes de responder. Cada tentativa (resultado, tempo, tamanho, motivo) fica no registro do Worker (cache, 60 últimas); `/saude` devolve esse registro e, com `CF_CONTA`/`CF_TOKEN`, as falhas do dia por motivo (status da Cloudflare), por hora e o tempo de CPU.
- Filtro do Worker: as linhas de `LINHAS` (em `worker/gps-fundao.js`) na região do Fundão e acessos, e mais qualquer outra linha com ônibus dentro da ilha (contorno do OSM; quem só passa pela Linha Vermelha fica de fora). Essas vêm com `f:1`: aparecem no mapa sem horários nem traçado, e Gestão › Saúde lista as vistas no dia (`linhasFora` em `/saude`). `tools/gtfs_fundao.py` põe destinos sem grupo em "Outros destinos" e avisa as linhas que faltam em `LINHAS`. Teste: `tests/teste-linhas-fora.js`.
- Previsão: velocidade informada, parada de ~12 s no próximo ponto (pontos do GTFS em `EXT.shs`), encaixe no traçado da linha pelo sentido do movimento. Ajustes só entram com ganho comprovado: medições dos aparelhos (coleção `desvios`, modelo em `gestao/previsao`, campo `b2`) ou `historico-previsao.json` (gerado por `tools/historico_gps.py`, ver `tools/HISTORICO.md`), que desliga a coleta pelos aparelhos.
- Perfil dos trechos (dias úteis): `tools/perfil_trechos.py <gps.csv…>` guarda, por traçado, sentido, trecho de 60 m e faixa de horário (5–7h, 7–9h, 9–13h, 13–18h e noite 18–5h; as faixas vão no arquivo e o app as lê de lá), a velocidade com que os ônibus seguem dali, e gera `perfil-onibus.json` (raiz do site). Cada dia é testado com o perfil dos outros dias; um período só entra com ganho de pelo menos 2% e 1 m e sem piorar na maioria dos dias. Fins de semana e feriados (`FERIADOS` em `06-calendario-e-lugares.js`) usam a previsão de sempre. Peças comuns das ferramentas em `tools/previsao_comum.py`; a conta do app é conferida por `tests/teste-previsao.js`.
- Seguir um ônibus (`src/js/28-seguir-onibus.js`): "Buscar ônibus" no mapa acha os ônibus ao vivo pela linha, destino ou carro; seguir um deles (ou tocá-lo no mapa) faz o mapa acompanhá-lo, desenha o caminho feito e mostra o próximo ponto com o tempo estimado (perfil dos trechos quando há). Com o ônibus fora da tela, uma seta na borda aponta para ele. Guardado no aparelho (`cse-seguir`) por 30 min. Teste: `tests/teste-seguir.js`.
- Anel ao redor da bússola (`src/js/30-anel-ao-vivo.js`), com a camada "Ônibus da cidade" ligada: verde girando com posições chegando, laranja girando quando a prefeitura falhou ou as posições estão velhas, vermelho e parado quando o Worker não responde há 40 s. Teste: `tests/teste-anel.js`.
- Ruas ao redor da ilha (`src/js/29-ruas-cidade.js`): esboço das vias fora da ilha (OpenStreetMap, ODbL, com crédito embaixo do mapa), só com a camada "Ônibus da cidade" ligada; aí o mapa pode ser arrastado até a área do ao vivo (`LIMITES_EXTRA` em `03-mapa.js`). `ruas-cidade.json` (raiz) é gerado por `tools/ruas_cidade.py` a partir da cópia em `tools/dados/osm-ruas-fundao.json.gz`; dentro da ilha vale a planta.
- Semáforos e lombadas: `tools/redutores.py <gps.csv>` testa a previsão com o GPS da prefeitura (70% treino, 30% teste) e só grava em `src/redutores.json` o tempo perdido em cada um se reduzir o erro em pelo menos 2% e 1 m; sem `ajuste`, a previsão não muda. Também lista em `tools/dados/paradas-fora-dos-pontos.csv` onde vários ônibus param longe de um ponto. As medições dos aparelhos guardam o traçado e a posição ao longo dele (de 5 em 5 m).

- Resposta parcial da prefeitura do Rio (só ônibus comuns ou só BRT respondeu, comum com HTTP 500): o Worker tenta de novo uma vez e, se continuar, completa com os ônibus da cópia guardada (`completar`), marcando `parcial`. Códigos que não são linha (GARAGEM, APOIO, TR, 0…) não entram (`linhaDeVerdade`).
- Ônibus chegando (`src/js/33-chegando-e-legenda.js`): no painel de um ponto da cidade, "Chegando agora" lista os ônibus ao vivo vindo pelo traçado, com tempo e distância; a legenda ganha os itens do ao vivo com a camada ligada.

## Textos
- "Prefeitura Universitária" (da UFRJ: linhas internas, segurança) e "prefeitura do Rio" (ônibus da cidade, GPS, Jaé) sempre por extenso; nunca só "prefeitura".
- Idioma (`src/js/36-idioma.js`): o app é escrito em português; com English ou Español (`CFG.idioma`, em Ajustes e na capa), os textos fixos são trocados na tela pela tabela `IDI_TAB` e pelos padrões `IDI_PAD`. Texto novo de interface: acrescente a linha na tabela. Nomes de lugares e linhas não se traduzem.

## Perfil de uso
- `src/js/34-perfil-de-uso.js`: depois do login, a folha "Como você usa o Fundão?" (`cse-uso`). Quem mora na Vila Residencial tem a Volta à noite para o ponto mais perto da Vila (`nightDest`, `vilaPonto`); a aba Grade aparece conforme a resposta (`CFG.tabsOff`). A etapa `login fechado` avisa quando o login termina.
- Capa (`src/js/35-capa-avisos.js`): alerta de tiroteio e botão das notificações. Teste de tudo isso: `tests/teste-novidades.js`.

## Desempenho
- Modos em Ajustes: completo (vidro e animações), intermediário (padrão no celular: tudo opaco, classe `solido`, sem `backdrop-filter` nem refração, mas com o movimento do mapa e dos ônibus) e leve (`lowgfx`: opaco e sem movimento). Regras só visuais usam `.solido`; as de movimento, `.lowgfx`.
- O mapa base é sempre sólido (o controle de transparência saiu; no lugar, "Buscar ônibus").
- `box()` em `03-mapa.js` guarda a caixa do mapa (renova ao rolar, redimensionar e no começo de cada toque): lê-la a cada quadro forçava o layout.

## Instalar o app
- `src/js/31-instalar.js`: no celular, com o app aberto no navegador, uma folha com o passo a passo (iPhone: Compartilhar › Adicionar à Tela de Início; Android: botão "Instalar" quando o navegador oferece, senão menu ⋮). Uma vez por sessão, depois de 15 s e com a tela livre; "Agora não" adia 7 dias e "Não mostrar mais" para (`cse-instalar`). Não aparece no computador, no app instalado, nos navegadores internos (WhatsApp, Instagram…) nem no claude.ai. Teste: `tests/teste-instalar.js`.

## Tiroteios (Fogo Cruzado)
- Opcional, desligado por padrão (`CFG.tiroteios`). O Worker atende `/tiroteios` com a conta do projeto (segredos `FC_EMAIL` e `FC_SENHA` na Cloudflare; nunca no código). Só registros das últimas 6 h perto das saídas da ilha, com fonte e horário; sem dados, o app diz que não há dados. As datas da API vêm com "Z" mas são horário de Brasília (`fcHora` no Worker): lê-las como UTC punha cada tiroteio 3 h no passado.

- Notificações (`src/js/32-avisos-tiroteio.js`): Ajustes › Segurança no caminho › "Notificar tiroteios novos" assina no Worker (`/push/chave`, `/push/assinar`, `/push/sair`, `/push/teste`). O gatilho Cron do Worker (a cada 5 min, `scheduled`) avisa tiroteio novo das últimas 2 h, em lotes de 40. O aviso vai sem conteúdo; o `sw.js` (`tools/sw_template.js`, com o endereço do Worker tirado do `config.js` no empacotamento) busca `/tiroteios` e mostra onde e quando. Precisa do KV `PUSH` ligado ao Worker; as chaves VAPID nascem no Worker e ficam só no KV (nunca no código). No iPhone, só com o app instalado. Teste: `tests/teste-avisos.js`.

## Gestão › Saúde e estatísticas
- `src/js/25-saude.js`: mostra quem está fora do ar e por quê (no topo) e, em "Ônibus ao vivo: falhas de hoje", os pedidos ao Worker que falharam por motivo e por hora e as tentativas com a prefeitura. Confere, a partir do aparelho do gestor, site, Worker, GPS da prefeitura, Fogo Cruzado, cota do Worker (rota `/saude`, segredos opcionais `CF_CONTA` e `CF_TOKEN`), Firebase, Open-Meteo, ipify, validade do GTFS e planta do CT; mostra números de uso. Só lê.
- Cardápio do RU: só um atalho para o BandejApp (`src/js/24-bandejapp.js`); não usar o serviço de dados deles sem acordo.

## Visão do projeto
Mobilidade e acesso ao campus para quem precisa chegar ao Fundão: calouros, pacientes do HU, moradores da Vila Residencial, trabalhadores e visitantes.
