# Worker "gps-fundao" (ônibus ao vivo)

O navegador não consegue ler a API de GPS da prefeitura do Rio direto (bloqueio de CORS), e ela devolve a cidade inteira (~9 MB a cada 5 minutos).
Este Worker busca a API, filtra as linhas que atendem o Fundão na região da ilha (e qualquer outra linha com ônibus dentro da ilha, para nenhuma ficar de fora) e devolve ~5 KB, guardando o resultado por 10 segundos. Se a prefeitura do Rio falhar, devolve a última resposta boa (até 3 minutos). Cada tentativa fica registrada e aparece em Gestão › Saúde e estatísticas.

## Publicar (grátis, ~10 minutos)

1. Crie uma conta gratuita em https://dash.cloudflare.com/sign-up
2. No painel: **Workers & Pages › Create › Create Worker**. Dê o nome `gps-fundao` e clique em **Deploy**.
3. Clique em **Edit code**, apague o código de exemplo, cole todo o conteúdo de `gps-fundao.js` e clique em **Deploy**.
4. Copie o endereço do Worker (algo como `https://gps-fundao.SEU-USUARIO.workers.dev`) e abra no navegador: deve aparecer um JSON com `"onibus":[...]`.
5. No repositório, em `config.js`, preencha `window.CSE_GPS_URL = "https://gps-fundao.SEU-USUARIO.workers.dev";`, faça commit e push.

## Limites

- Plano gratuito: 100 mil acessos por dia. O app só consulta com a camada "Cidade" ligada, o bloco "Ônibus da cidade" aberto ou um ponto selecionado, a cada 10 segundos e com a aba visível. Como a resposta fica guardada 10 s, a prefeitura do Rio recebe no máximo ~6 pedidos por minuto de cada data center da Cloudflare, não importa quantas pessoas usem o app.
- Se o limite for atingido ou a API da prefeitura do Rio cair, o app volta sozinho aos horários programados.
- Para mudar as linhas ou a área, edite `LINHAS` e `AREA` no começo do arquivo. As linhas fora de `LINHAS` vistas dentro da ilha no dia aparecem em Gestão › Saúde (`linhasFora` em `/saude`).

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

## Notificações de tiroteio (opcional)

Quem liga **Ajustes › Segurança no caminho › Notificar tiroteios novos** recebe um aviso no celular quando o Fogo Cruzado
registra tiroteio novo (últimas 2 horas) perto das saídas da ilha, mesmo com o app fechado. Precisa dos segredos do
Fogo Cruzado (acima) e de dois ajustes no painel da Cloudflare:

1. **Storage & Databases › KV › Create**: crie um namespace (por exemplo `cse-push`).
2. No Worker › **Settings › Bindings › Add › KV namespace**: nome da variável `PUSH`, escolha o namespace criado.
3. No Worker › **Settings › Triggers › Cron Triggers › Add**: `*/5 * * * *` (a cada 5 minutos).
4. Cole o `gps-fundao.js` novo e clique em **Deploy**.

As chaves que identificam o Worker para os serviços de notificação (VAPID) são criadas sozinhas na primeira vez e
ficam só no KV. O KV guarda só o endereço de notificação de cada aparelho (nada de nome, e-mail ou localização).
Os avisos vão em lotes de 40 a cada 5 minutos (limite de pedidos do plano grátis). Sem o KV, o app avisa que as
notificações ainda não foram ativadas. Em Gestão › Saúde aparecem quantos aparelhos assinaram e o último envio.

No iPhone, as notificações só funcionam com o app instalado na Tela de Início (iOS 16.4 ou mais novo).

## Fonte das posições (GTFS Realtime)

Desde 11/2026 o Worker lê o GTFS Realtime da prefeitura do Rio (`dados.mobilidade.rio/gtfs/realtime/onibus/vehicle-positions`
e `.../brt/vehicle-positions`, licença CC BY 4.0, sem chave). As APIs antigas em JSON (`/gps/sppo` e `/gps/brt`) saem do ar
até 30/11/2026; até lá, o Worker volta a elas se o GTFS Realtime falhar. Em Gestão › Saúde › "Fonte das posições" aparece
qual está sendo usada. Se aparecer "API antiga" com exemplos de route_id, mande esses exemplos para quem cuida do app.

## Alertas de ônibus (opcional)

O usuário cria alertas ("avise quando o 485 estiver a 5 min do ponto X") e recebe a notificação mesmo com o app
fechado. Usa o mesmo KV `PUSH` das notificações de tiroteio. Para o aviso sair na hora certa, troque o Cron Trigger
do Worker de `*/5 * * * *` para **`* * * * *`** (a cada minuto); os tiroteios continuam sendo conferidos de 5 em 5 min.
Com o gatilho de 5 em 5 min os alertas ainda funcionam, mas podem chegar com até 5 min de atraso.

Custo no plano grátis: uma leitura do KV por minuto e, só quando há alerta valendo naquele horário, uma busca das
posições. Cada aviso enviado gasta uma gravação no KV (limite de 1.000 por dia).
