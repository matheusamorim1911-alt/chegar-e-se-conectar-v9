# Partes do app

O build junta as partes nesta ordem (a ordem importa: cada parte registra suas etapas na ordem em que é carregada).

## Estilos (css/)
- `01-base.css`: layout, mapa, painéis e volta à noite
- `02-vidro-e-lugares.css`: vidro líquido, abas, prédios, planta do andar, serviços e grade
- `03-capa-ajustes-login.css`: fontes, capa, Ajustes, login, rota animada e glossário
- `04-tema-claro-desempenho.css`: ícones no tema claro, mapa claro, login obrigatório, desempenho e modo Completo
- `05-fila-e-gestao.css`: fila do RU, estados da gestão, formulários e tela do gestor
- `06-lugares-conta-tema.css`: Lugares, conta, fonte, localização, legenda, capa, tema, biometria e administradores
- `07-bussola-e-capa.css`: bússola, celular, login por e-mail, apresentação e botões da capa
- `08-wifi-conta-eduroam-feedback.css`: cobertura do Wi-Fi, rede, conta, eduroam, feedback e instalação
- `09-onibus-cidade-e-ct.css`: ônibus da cidade, ao vivo e planta real do CT
- `10-tiroteios.css`: lista de tiroteios perto das saídas
- `11-bandejapp-e-saude.css`: atalho do BandejApp e aba Saúde e estatísticas
- `12-predios-ufrj.css`: cor dos prédios que faltavam na planta e do chão onde a planta é redesenhada
- `13-jae.css`: atalho para o Jaé e ícone dos atalhos para apps de fora (Jaé, BandejApp, WhatsApp)
- `14-seguir-onibus.css`: botão "Buscar ônibus", busca, card do ônibus seguido e caminho feito
- `15-ruas-cidade.css`: esboço das ruas ao redor da ilha e crédito do OpenStreetMap
- `16-anel-ao-vivo.css`: anel ao redor da bússola com o estado dos ônibus ao vivo
- `17-instalar.css`: folha do convite para instalar o app
- `18-avisos-tiroteio.css`: notificações de tiroteio em Ajustes
- `19-chegando-e-legenda.css`: ônibus chegando e legenda do ao vivo
- `20-perfil-de-uso.css`: folha do perfil de uso
- `21-capa-avisos.css`: avisos na capa
- `22-idioma.css`: botões de idioma

## Código (js/)
- `01-nucleo.js`: pontos de extensão (etapas), modo do site, ajustes salvos e utilidades básicas
- `02-dados.js`: paradas, linhas internas, prédios, Wi-Fi aberto e tutorial do eduroam
- `03-mapa.js`: estado, mapa, traçado vetorial, zoom e arrasto, nomes dos prédios e várias linhas no ponto
- `04-trajeto-e-detalhes.js`: volta à noite, componentes, planejador, detalhes e eventos da tela
- `05-servicos-avisos-grade.js`: camada de serviços, avaliações e avisos compartilhados, grade
- `06-calendario-e-lugares.js`: avisar alguém, calendário acadêmico, aba Lugares, planta do andar e mudanças de data
- `07-ajustes-e-glossario.js`: Ajustes e glossário de siglas
- `08-gestao.js`: dados que a gestão altera, fila do RU, solicitações e tela do gestor
- `09-lugares-conta-fonte.js`: Lugares enxuto, conta (claude.ai ou Firebase) e fonte
- `10-localizacao-tema-admins.js`: localização do aparelho, legenda, tema, administradores e busca de ponto
- `11-bussola.js`: rosa dos ventos que aponta para o destino
- `12-robustez.js`: limites de envio, vagas, registro de erros, modo apresentação, navegador interno e versão nova
- `13-servicos-no-mapa-foto-desempenho.js`: gestão dos serviços no mapa, foto de perfil, planta minimizada e desempenho
- `14-wifi-cobertura-e-rede.js`: cobertura do Wi-Fi, diagnóstico da rede, coleta de medições e menu do Wi-Fi
- `15-capa-login-biometria.js`: pausa das animações, modo enxuto, capa, login com perfil, biometria e quem pode informar
- `16-abas-destino-tempo.js`: modo simplificado, abas, destino pelo mapa e previsão do tempo
- `17-acesso-mapa-claro-wifi-tela-cheia.js`: login obrigatório, mapa claro, Wi-Fi em Lugares e tela cheia
- `18-conta-grade-eduroam.js`: motivos para entrar com conta, grade só com conta e configurar eduroam
- `19-padroes-gps-feedback-pwa.js`: padrões da gestão, bússola com GPS, feedback e app instalável
- `20-onibus-cidade.js`: ônibus da cidade (GTFS), ao vivo pelo Worker e paradas alinhadas às da UFRJ
- `21-planta-ct.js`: planta real do CT
- `22-onibus-ao-vivo.js`: ruas dos ônibus, posição prevista, aprendizado, paradas nos pontos e atualização a cada 10 s
- `23-tiroteios.js`: tiroteios perto das saídas do Fundão (Fogo Cruzado), opcional em Ajustes
- `24-bandejapp.js`: atalho para o cardápio no BandejApp (app oficial do RU)
- `25-saude.js`: Gestão › Saúde e estatísticas (se cada serviço responde e números de uso)
- `26-predios-ufrj.js`: prédios que faltavam na planta (CENPES II, IEN, bloco central do CT…), CENPES e CEPEL redesenhados e nomes no zoom, do cadastro da UFRJ
- `27-jae.js`: aviso de que a passagem da prefeitura é paga com o Jaé e atalho para o app oficial (Trajetos e pontos da prefeitura)
- `28-seguir-onibus.js`: buscar um ônibus da cidade ao vivo (linha, destino ou carro) e segui-lo no mapa, com o caminho feito e o próximo ponto
- `29-ruas-cidade.js`: esboço das ruas ao redor da ilha (OpenStreetMap, `ruas-cidade.json`) só com "Ônibus da cidade" ligado, e o mapa arrastável até a área do ao vivo
- `30-anel-ao-vivo.js`: anel ao redor da bússola: gira verde (ou laranja, com atraso) enquanto chegam posições ao vivo; vermelho e parado quando o Worker para de responder
- `31-instalar.js`: convite com o passo a passo para instalar o app no iPhone e no Android (uma vez por sessão, adiável)
- `32-avisos-tiroteio.js`: notificação no celular de tiroteio novo perto das saídas da ilha (Web Push pelo Worker), ligada em Ajustes › Segurança no caminho
- `33-chegando-e-legenda.js`: "Chegando agora" (ônibus ao vivo vindo para o ponto, com tempo estimado) e os itens do ao vivo na legenda
- `34-perfil-de-uso.js`: folha "Como você usa o Fundão?" depois do login (estuda, mora na Vila, trabalha, visita); define a Volta à noite para a Vila e se a aba Grade aparece
- `35-capa-avisos.js`: na capa, o alerta de tiroteio e o botão para ligar as notificações do celular
- `36-idioma.js`: escolha do idioma (Português, English, Español) em Ajustes e na capa; troca os textos fixos da tela por uma tabela e por padrões
- `37-idioma-textos.js`: segunda parte da tabela de tradução e padrões (datas, Ajustes, Lugares, Grade, Calendário, Wi-Fi, eduroam)
- `38-idioma-frases.js`: terceira parte da tradução: mensagens, estados e pedaços de frase trocados dentro de textos montados
- `99-inicio.js`: abre a aba pedida no endereço (#predios, #grade…) depois que tudo carregou; fica sempre por último
