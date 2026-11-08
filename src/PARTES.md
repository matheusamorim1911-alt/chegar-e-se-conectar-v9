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
- `99-inicio.js`: abre a aba pedida no endereço (#predios, #grade…) depois que tudo carregou; fica sempre por último
