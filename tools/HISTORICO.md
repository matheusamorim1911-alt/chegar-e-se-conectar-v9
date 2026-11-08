# Previsão dos ônibus com o histórico de GPS da prefeitura

A Secretaria Municipal de Transportes (SMTR) publica no Data.Rio o histórico de posições dos ônibus
("Transporte Rodoviário: Histórico de GPS dos ônibus (SPPO)"), consultável pelo BigQuery do Google.
Com alguns dias desse histórico, o script `tools/historico_gps.py` ajusta a previsão do app
(tempo parado em cada ponto e, onde houver ganho comprovado, a velocidade por trecho) e gera
`historico-previsao.json`. Com esse arquivo no site, os aparelhos param de enviar medições.

## 1. Abrir o BigQuery (grátis, sem cartão)

1. Abra a página do conjunto no Data.Rio: https://www.data.rio/documents/6409ea499d474bfeb4063cfc31203403
   e siga o link de acesso aos dados (BigQuery).
2. Entre com uma conta Google. Se pedir, crie um projeto (o "sandbox" do BigQuery é grátis: 1 TB de consultas por mês).
3. No painel da esquerda, ache a tabela do histórico de GPS dos ônibus e copie o nome completo
   (algo como `projeto.conjunto.tabela`). Na aba **Esquema**, confira os nomes das colunas.

## 2. Consultar só o que interessa

Troque `TABELA` pelo nome copiado. Se o BigQuery reclamar de uma coluna (`Unrecognized name`),
troque pelo nome que aparece na aba Esquema (o script reconhece `id_veiculo`/`ordem`, `servico`/`linha`,
`datetime_gps`/`timestamp_gps`/`datahora`, `velocidade`/`velocidade_instantanea`, `direcao`).
A coluna de data (`data`) serve para a consulta ler só os dias pedidos e ficar barata.

```sql
SELECT id_veiculo, servico, datetime_gps, ROUND(latitude, 5) AS latitude, ROUND(longitude, 5) AS longitude,
       ROUND(velocidade) AS velocidade
FROM `TABELA`
WHERE data BETWEEN '2026-10-27' AND '2026-10-31'          -- 5 dias úteis; acrescente um sábado se quiser
  AND latitude BETWEEN -22.885 AND -22.825 AND longitude BETWEEN -43.27 AND -43.195
  AND servico IN ('321','323','324','325','326','327','328','329','42','43','485','486','616','634','635','663',
                  '696','90','901','910','913','915','922','975','979','SN324','SN328','SN696','SP324','SP328',
                  'SP329','SP485','SP635','SPB326','SR328','SV922','SVB901')
ORDER BY id_veiculo, datetime_gps
```

## 3. Baixar e mandar

Em **Salvar resultados**, escolha **CSV (Google Drive)** (o download direto só aceita arquivos pequenos).
Baixe do Drive, compacte em .zip e mande no chat. Ou, quem tiver o repositório:

```
python3 tools/historico_gps.py historico.csv <pasta do GTFS> historico-previsao.json
```

O script separa os últimos 30% dos dados para teste e só grava um ajuste se ele reduzir o erro nesses dias.
O resultado mostra o erro médio antes e depois. Copie `historico-previsao.json` para a raiz do site.

## 4. Semáforos e lombadas

O mesmo CSV serve para testar se considerar os semáforos e as lombadas melhora a previsão:

```
python3 tools/redutores.py historico.csv
```

O script só grava o ajuste em `src/redutores.json` se ele reduzir o erro nos dias de teste. Ele também gera
`tools/dados/paradas-fora-dos-pontos.csv`, com os lugares onde vários ônibus param longe de um ponto (semáforo ou
lombada que ainda não estão mapeados, ou retenção). Depois rode `python3 tools/build_site.py`.
