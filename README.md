# Chega aí UFRJ

Protótipo de app web para calouros da UFRJ na Cidade Universitária (Ilha do Fundão).
Disciplina: Habilidades Sociais para o Trabalho (profa. Adriana Vivacqua).
Grupo: Sara Gianini Bernardo Dias, Pedro Lucas Dias de Oliveira, Matheus Amorim Campos, Caio Muniz Pires e Isadora Duarte Belo.

## Como trabalhar no projeto

O site publicado fica na **raiz** do repositório (é o que o GitHub Pages serve). **Não edite `app.js`, `style.css` nem o corpo do `index.html` à mão:** eles são gerados.

1. Edite o fonte em `src/`, separado por assunto (veja `src/PARTES.md`): `src/pagina/` (estrutura), `src/css/` (visual) e `src/js/` (código).
2. Gere o site: `python3 tools/build_site.py` (junta as partes e cria `app.js`, `style.css`, `index.html`, `version.json` e `sw.js` com um número de versão novo).
3. Teste: `npm install` e `npx playwright install chromium` (só na primeira vez), depois `npm test`.
4. Faça commit e push: o GitHub Pages publica sozinho.

Pastas:

- `src/`: o fonte do app, em partes por assunto. As partes não substituem funções umas das outras: acrescentam etapas às telas centrais com `aoFazer(...)` (detalhes em `CLAUDE.md`).
- `tools/`: `build_site.py` (gera o site), `montar.py` (junta as partes num arquivo único, `app-completo.html`, usado no claude.ai) e `sw_template.js` (modelo do service worker)
- `tools/gtfs_fundao.py`: lê o GTFS da prefeitura (SMTR) e gera `src/ext_onibus.json`, os ônibus da cidade que saem do Fundão, com traçados e pontos. Ao atualizar o GTFS (ele vale até 31/12/2026), gere o JSON de novo e rode o build.
- `tools/historico_gps.py` e `tools/HISTORICO.md`: ajustam a previsão dos ônibus com o histórico de GPS da prefeitura.
- `ct-plantas.json` (gerado por `tools/ct_plantas.py`): espaços internos do CT, do levantamento do EPLAN CT/UFRJ de 2018 publicado no ArcGIS. O app carrega esse arquivo só quando a pessoa abre a planta do CT.
- `worker/`: Worker do Cloudflare que entrega a posição ao vivo dos ônibus da cidade (veja `worker/README.md`). Depois de publicar, coloque o endereço em `config.js` (`CSE_GPS_URL`).
- `tests/`: testes automáticos (Playwright), um Firebase simulado (`firebase-mock.js`) e o teste de equivalência (`equivalencia.js`), que fotografa todas as telas para provar que uma reorganização não mudou nada
- `CLAUDE.md`: instruções para o Claude Code trabalhar neste repositório

O cabeçalho do `index.html` (até `<body>`) é mantido pelo build: mudanças nele, como meta tags, valem.

## Estrutura

- `index.html`: estrutura da página (login, capa, abas, painéis)
- `style.css`: visual (temas claro e escuro, vidro)
- `config.js`: configuração do Firebase (login com Google ou e-mail e banco de dados)
- `version.json`: número da versão publicada (o app avisa quando sai uma nova)
- `app.js`: lógica (mapa, linhas, trajeto, lugares, grade, calendário, siglas, fila do RU, gestão, conta)
- `mapa-campus.jpg` e `mapa-campus.svg`: mapa do campus feito a partir da planta de situação da Cidade Universitária (ETU/UFRJ). O JPG é a visão geral; o SVG, vetorial, é carregado no zoom e fica nítido em qualquer aproximação.
- `mapa-bordas.jpg`, `mapa-mini.jpg`, `mapa-blur.jpg`: bordas do mapa, miniatura e fundo desfocado.
- Os antigos `mapa-md.jpg` e `mapa-hd.jpg` não são mais usados e podem ser apagados do repositório.
- `firestore.rules`: regras de segurança do banco, para colar no Firebase

## Como rodar

Abra a pasta no VS Code e use a extensão **Live Server** ("Go Live"), ou publique no GitHub Pages.
Sem configurar nada, o app funciona inteiro e salva os ajustes só no aparelho.

## Banco de dados (Firebase)

Com o `config.js` preenchido, o app usa o Firebase para tudo o que é compartilhado:

| Coleção | O que guarda | Quem lê | Quem grava |
|---|---|---|---|
| `usuarios`, `data/users` | ajustes, trajeto favorito, grade | a própria pessoa | a própria pessoa |
| `fila` | tamanho da fila do RU | todos | cada um o seu; gestor apaga |
| `reports` | avisos dos alunos | todos | cada um o seu; gestor apaga |
| `votes` | notas do Wi-Fi | todos | cada um o seu |
| `requests` | pedidos de correção | quem pediu e gestores | quem pediu |
| `members` | quem usa o app (nome, visitas) | a própria pessoa e gestores | a própria pessoa |
| `gestao`, `plantas_img`, `cal` | linhas, pontos, Wi-Fi, horários, plantas, calendário, respostas, bloqueios | todos | gestores |
| `gestores` | administradores e seus privilégios | cada um o próprio; quem tem "Administradores" vê todos | principal: só pelo console; demais: quem tem "Administradores" |

Sem entrar, a pessoa vê a fila, os avisos e tudo o que a gestão publicou. Para enviar algo, entra com Google ou com e-mail e senha.

### Regras de segurança

Cole o conteúdo de `firestore.rules` em *Firestore Database › Regras* e clique em *Publicar*.

### Virar gestor (administrador principal)

1. No console do Firebase, abra *Firestore Database › Dados* e clique em *Iniciar coleção*.
2. ID da coleção: `gestores`. ID do documento: o e-mail com que você entra no app (Google ou e-mail e senha), em letras minúsculas.
3. Crie um campo `nome` (string) com o seu nome. **Não crie o campo `perms`**: sem ele, você é o
   administrador principal, com acesso total. Salve.
4. Saia e entre de novo no app: o ícone de gestão aparece no topo.

### Outros administradores e privilégios

Na gestão, aba *Administradores*, adicione o e-mail com que a pessoa entra no app (Google ou e-mail e senha) e marque o que ela pode fazer:
linhas, pontos, Wi-Fi, serviços, solicitações, plantas, avisos e filas, usuários, GPS, calendário e
administradores. As regras do Firestore conferem cada privilégio no servidor, então um administrador
sem "Linhas" não consegue alterar linhas nem mexendo no código do site.

### Vagas (limite de pessoas que participam)

Só quem ocupa uma vaga envia filas, avisos, notas de Wi-Fi e pedidos. O limite começa em **80** e
fica no documento `meta/vagas` (`n` = vagas em uso, `max` = limite). Na primeira vez que um gestor
entra depois desta versão, o app cria esse documento contando quem já usa o app. Em
*Gestão › Usuários* dá para ver as vagas, mudar o limite, recontar e **liberar a vaga** de alguém.
Gestores não ocupam vaga. Quem chega com as vagas esgotadas continua vendo tudo. As regras do
Firestore conferem a contagem no servidor.

### Limite de envios

Cada pessoa envia no máximo um aviso ou uma fila a cada 30 segundos e um pedido de correção por
minuto. O app avisa quanto falta esperar, e as regras do Firestore conferem pela hora do servidor.

### Modo apresentação e erros

Em *Gestão › Visão geral*:
- **Modo apresentação** preenche a fila do RU e os avisos com exemplos, para as telas não ficarem
  vazias numa demonstração, e **Limpar exemplos** tira tudo. Os exemplos também somem sozinhos.
- **Erros nos aparelhos** lista falhas que aconteceram no celular de quem usa o app, com aparelho,
  navegador e versão.

### Versão nova

Cada pacote traz um número de versão nos arquivos (`app.js?v=…`) e no `version.json`. Assim os
celulares não misturam arquivos antigos e novos, e quem está com o app aberto vê o aviso
*Saiu uma versão nova do app* com o botão *Atualizar*. Suba sempre o `version.json` junto.

### Navegador de outros apps

Links abertos dentro do WhatsApp, Instagram ou Facebook mostram um aviso para abrir no Chrome ou no
Safari, porque o Google não deixa entrar com a conta nesses navegadores. O login com e-mail e senha
funciona neles.

### Rede e cobertura do Wi-Fi

O navegador não informa o nome da rede. O app descobre se a pessoa está na rede da UFRJ pelo endereço de
internet (faixa 146.164.0.0/16, consultada em api.ipify.org) e mede a resposta e a velocidade baixando
`mapa-bordas.jpg`.

- **Ajustes › Rede e Wi-Fi:** "Testar minha conexão" e a opção "Ajudar a mapear o Wi-Fi". Com ela ligada
  e o app aberto no campus, a cada 5 minutos o app grava em `medicoes` a área de ~30 m, se a rede é da UFRJ,
  se é o eduroam (quando dá para saber), a velocidade e a hora arredondada. Não grava quem mediu, o endereço
  de internet nem a posição exata. Dados móveis não são enviados.
- **Mapa › Cobertura do Wi-Fi:** hexágonos de 30 m (60 m de longe) e prédios coloridos pelas medições dos
  últimos 30 dias. Sem medições reais, mostra dados de exemplo.
- **Gestão › Rede e Wi-Fi:** diagnóstico com o endereço de internet do aparelho, faixas extras da UFRJ e a
  faixa do eduroam (com ela, o app diferencia o eduroam das outras redes da UFRJ), e limpeza das medições
  com mais de 30 dias.

Para descobrir a faixa do eduroam: no campus, abra o diagnóstico conectado ao eduroam em alguns prédios e
depois em outras redes da UFRJ, anote os endereços e cadastre a faixa comum do eduroam.

### Plantas

As plantas enviadas pela gestão ficam no próprio Firestore: imagens são reduzidas para no máximo
1600 px e cerca de 900 KB; PDFs até 650 KB.

## Login com Google ou e-mail e ajustes na nuvem

Quando a pessoa entra com Google ou com e-mail e senha, o app guarda na conta dela os **ajustes** (capa, plano de fundo,
avisos, animação das rotas, tela de entrada), o **trajeto favorito** e a **grade**. Ao entrar em outro
aparelho, tudo volta. Isso usa o Firebase (gratuito para este uso):

```
Navegador ──"Entrar com Google"──▶ Firebase Authentication ──▶ uid da pessoa
    │                                                    │
    └── salva/lê ajustes ──▶ Firestore: usuarios/<uid> ◀──┘ (regra: só o dono lê e grava)
```

### Passo a passo (uns 10 minutos)

1. **Crie o projeto.** Entre em https://console.firebase.google.com com sua conta Google e clique em
   *Adicionar projeto*. Pode desligar o Google Analytics.
2. **Ligue os métodos de login.** No menu, *Authentication* › *Começar* › aba *Método de login*:
   - *Google* › *Ativar* › escolha o e-mail de suporte › *Salvar*.
   - *Adicionar novo provedor* › *E-mail/senha* › ligue só a primeira chave (*E-mail/senha*) › *Salvar*.
     Para os e-mails de confirmação e de troca de senha saírem em português, abra a aba *Modelos*
     e escolha o idioma *Português (Brasil)*.
3. **Autorize o endereço do site.** Ainda em *Authentication*, aba *Configurações* ›
   *Domínios autorizados* › *Adicionar domínio*: `matheusamorim1911-alt.github.io`
   (o `localhost` já vem autorizado, para testar com o Live Server).
4. **Crie o banco.** No menu, *Firestore Database* › *Criar banco de dados* › modo de produção ›
   escolha a região `southamerica-east1 (São Paulo)`. Depois, na aba *Regras*, apague o que estiver lá,
   cole o conteúdo do arquivo `firestore.rules` e clique em *Publicar*.
5. **Pegue a configuração.** Ícone de engrenagem › *Configurações do projeto* › *Seus apps* › ícone
   `</>` (Web) › dê um apelido › *Registrar app*. Copie o objeto `firebaseConfig` que aparece.
6. **Cole no app.** Abra `config.js`, troque `window.CSE_FIREBASE = null;` por
   `window.CSE_FIREBASE = { ...o objeto copiado... };` e salve.
7. **Publique.** Suba os arquivos no GitHub (substituindo os antigos). Em um ou dois minutos o botão
   *Entrar com Google* e o botão *Entrar com e-mail* aparecem na tela de entrada e em *Ajustes › Conta*.

### Observações

- **E-mail e senha:** a pessoa cria a conta no próprio app (nome, e-mail e senha de pelo menos 6
  caracteres) e recebe um link para confirmar o e-mail. Esqueceu a senha? O app manda um link para criar
  outra. Para virar gestor ou administrador com e-mail e senha, a pessoa precisa confirmar o e-mail
  antes: as regras do Firestore só aceitam gestores com e-mail confirmado.
- **Foto do perfil:** quem entra com Google usa a foto da conta Google; quem entra com e-mail e senha
  usa a foto cadastrada para aquele e-mail no Gravatar (gravatar.com), se existir. Dá para desligar em
  *Ajustes › Perfil*. O botão *Sair* do perfil fecha a sessão e a conta; *Esquecer este perfil* apaga o
  perfil e a biometria do aparelho.
- **Serviços no mapa:** na gestão, aba *Serviços e horários*, dá para mudar o lugar de cada ícone da
  camada Serviços (banco, farmácia, lanchonete, táxi…), mudar a referência "perto de", esconder e
  adicionar novos.
- No **claude.ai** os botões do Google e de e-mail não aparecem: lá a própria conta do Claude identifica a pessoa e os
  ajustes já ficam salvos na conta, de forma privada.
- A biometria usa o padrão WebAuthn (o mesmo das chaves de acesso): Face ID, Touch ID, digital ou Windows Hello. O rosto ou a digital nunca saem do aparelho; o app guarda só a chave pública e confere a assinatura a cada entrada. Funciona em endereço https (GitHub Pages) e em localhost.
- A tela de gestão, fora do claude.ai, funciona em modo demonstração (salva só no aparelho).

## App instalável (PWA) e feedback

- `manifest.json`, os ícones (`icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`) e `sw.js` fazem o site virar um app instalável que abre sem internet. O `sw.js` é gerado a cada versão pelo `build_site.py`; suba sempre a pasta inteira.
- Para instalar: Android/computador em Ajustes › Instalar o app (ou no menu do navegador); iPhone em Safari › Compartilhar › Adicionar à Tela de Início.
- As mensagens do botão "Algo errado? Conte aqui" e as notas da pergunta "O app te ajudou hoje?" ficam na coleção `feedback` do Firestore e aparecem em Gestão › Feedback (permissão Avisos). Publique o `firestore.rules` atualizado para isso funcionar.
