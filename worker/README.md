# Worker "gps-fundao" (ônibus ao vivo)

O navegador não consegue ler a API de GPS da prefeitura direto (bloqueio de CORS), e ela devolve a cidade inteira (~9 MB a cada 5 minutos).
Este Worker busca a API, filtra só as linhas que atendem o Fundão na região da ilha e devolve ~5 KB, guardando o resultado por 5 segundos. Se a prefeitura falhar, devolve a última resposta boa (até 2 minutos).

## Publicar (grátis, ~10 minutos)

1. Crie uma conta gratuita em https://dash.cloudflare.com/sign-up
2. No painel: **Workers & Pages › Create › Create Worker**. Dê o nome `gps-fundao` e clique em **Deploy**.
3. Clique em **Edit code**, apague o código de exemplo, cole todo o conteúdo de `gps-fundao.js` e clique em **Deploy**.
4. Copie o endereço do Worker (algo como `https://gps-fundao.SEU-USUARIO.workers.dev`) e abra no navegador: deve aparecer um JSON com `"onibus":[...]`.
5. No repositório, em `config.js`, preencha `window.CSE_GPS_URL = "https://gps-fundao.SEU-USUARIO.workers.dev";`, faça commit e push.

## Limites

- Plano gratuito: 100 mil acessos por dia. O app só consulta com a camada "Cidade" ligada, o bloco "Ônibus da cidade" aberto ou um ponto selecionado, a cada 10 segundos e com a aba visível. Como a resposta fica guardada 5 s, a prefeitura recebe no máximo ~12 pedidos por minuto de cada data center da Cloudflare, não importa quantas pessoas usem o app.
- Se o limite for atingido ou a API da prefeitura cair, o app volta sozinho aos horários programados.
- Para mudar as linhas ou a área, edite `LINHAS` e `AREA` no começo do arquivo.

## Testar sem internet

`node tests/teste-worker.mjs` (na raiz do repositório).

## Tiroteios perto das saídas (Fogo Cruzado)

O mesmo Worker atende em `/tiroteios` (o app usa só se a pessoa ligar em Ajustes › Segurança no caminho).
Ele entra na API do Fogo Cruzado (v2) com a **conta do projeto** e guarda a resposta por 5 minutos para todos.

Para ativar, no painel da Cloudflare, abra o Worker › **Settings** › **Variables and Secrets** › **Add**:
- tipo **Secret**, nome `FC_EMAIL`, valor: o e-mail da conta do projeto no Fogo Cruzado;
- tipo **Secret**, nome `FC_SENHA`, valor: a senha dessa conta.

Salve (Deploy). O e-mail e a senha ficam só ali: não vão para o app, para o GitHub nem para ninguém.
Sem os segredos, `/tiroteios` responde `{"disponivel":false,"motivo":"sem-conta"}` e o app avisa que o serviço não foi ativado.

## Uso da cota na aba Saúde (opcional)

Para a gestão ver, em Gestão › Saúde e estatísticas, quantos dos 100 mil pedidos diários do plano grátis já foram usados:
1. Na Cloudflare, em **My Profile › API Tokens › Create Token**, use **Create Custom Token** com a permissão
   **Account › Account Analytics › Read** (só leitura) e crie o token.
2. Copie o **Account ID** (aparece na página inicial da conta, à direita).
3. No Worker › **Settings** › **Variables and Secrets**, crie dois segredos: `CF_CONTA` (o Account ID) e `CF_TOKEN` (o token).

O Worker responde em `/saude` só os números; o token não sai da Cloudflare.
