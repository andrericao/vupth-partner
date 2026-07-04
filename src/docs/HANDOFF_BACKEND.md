# Handoff Front-Partner → Backend

Pendencias do app **partner** (profissional/owner) que dependem do backend. O front ja esta pronto (ou pronto para consumir) na maioria dos casos. Detalhe completo nos callouts do `PRD_FRONT-PARTNER.md`.

Ultima atualizacao: 2026-07-04 · branch `dev` do front-partner.

> **Fonte unica dos handoffs do partner.** Nao espalhar handoff pelo corpo do PRD — registrar aqui. O backend edita o proprio PRD; estes itens sao para o backend consumir e refletir na lista dele.

---

## Tabela consolidada

| # | Item | Status backend | O que o backend precisa fazer | O que o front faz depois |
|---|------|----------------|-------------------------------|--------------------------|
| BUG2 | `POST /establishment/{id}/service-items` falha (lado OWNER) | ⬜ confirmar staging | Reproduzir/corrigir "Nao foi possivel adicionar o servico" quando o **owner** adiciona (o lado do profissional ja foi validado 2026-06-28, OK). | Nada — so re-testar. |
| BUG3 | `GET /attendances?establishmentId=X&status=Y` nao carrega | ⬜ confirmar staging | Reproduzir/corrigir o "Carregar atendimento" (afeta relatorios/atendimentos do partner). | Nada — so re-testar. |
| BUG4 | Endereco do establishment nao volta (read-back) | ⬜ aberto (gap real, confirmado 2026-07-04) | `EstablishmentResponse` **nao tem `address`** e nao ha `GET /establishments/{id}/addresses`. Incluir `address` no `EstablishmentResponse` **ou** criar o GET. | Ja pronto: `fetchEstablishmentById` le `data.address` — liga sozinho quando o campo existir. |
| BUG5/BUG6 | Fechamento com confirmacao + gate de entrada fora do horario — **NAO auto-fechar** | ⬜ aberto (gap real, confirmado 2026-07-04) | Ver **detalhe** abaixo. Resumo: (1) NAO auto-mudar `open_status`; (2) bloquear NOVAS entradas na fila fora do horario/apos "parar novos"; (3) fluxo de **"solicitar corte"** (pedido sob aprovacao); (4) `is_open` efetivo + `opening/closing` na listagem. | Confirmacao no toggle de fechar; tratar o gate; dashboard mostra "fechado p/ novos". |
| S9 | Expediente (inicio/fim) nos relatorios | ⬜ aberto | Registrar eventos reais de abrir/fechar (timestamp) ou expor a janela `opening/closing` + eventos num endpoint de relatorio. Ligado a BUG5/BUG6 (horario configurado = fonte da verdade). | Exibir "Expediente: HH:MM–HH:MM" nos relatorios (owner e profissional). |
| S8 | Profissional abrir/fechar o estabelecimento | ⬜ aberto | Liberar `PATCH /establishment/{id}/open-status` para o papel `PROFESSIONAL` afiliado (hoje OWNER-only; analogo ao S1 que abriu `POST service-items` ao afiliado). | Expor o toggle abrir/fechar na area do profissional. |
| S7 | Promover cliente ao 1o lugar (reordenar a fila) | ⬜ aberto (gap real, confirmado 2026-07-04) | `PATCH /attendances/{id}/promote` (move ao indice 0, empurra os demais). Obs.: `start` ja atende **qualquer** id SCHEDULED/LATE fora de ordem; falta so o "promover ao topo sem atender". | Botao "Atender este" em qualquer card → promove → inicia. (Enquanto nao vem, usa `start` direto.) |
| S3 | Troca de posicao ENTRE CLIENTES — **OFERTA ABERTA** | ⬜ aberto (o #42 dirigido ja existe) | Oferta aberta: `POST /swap-offers {attendanceId, direction, maxMinutes}`, `GET /swap-offers`, `PATCH /swap-offers/{id}/accept` + broadcast WS so p/ quem esta na janela. O `POST /swap-requests` (#42) e **dirigido 1-a-1**, nao cobre a oferta aberta. | **Nenhum — e do front-client** (C6). Registrado aqui so por rastreabilidade (o profissional nao participa). |
| S4 | Refeicoes Modelo B (janela flexivel) | ⬜ aberto | Placement da refeicao no 1o buraco dentro de `[alvo−adiant, min(proxRefeicao−3h, fechamento−dur)]` + **auto-supressao** (3h/fechamento) no ETA meal-aware + "iniciar = proxima nao suprimida". Ja existem: `skip` (#41), ETA meal-aware, "atender encerra a refeicao ativa". | Popup adiantar/adiar + lapis + "almoco iniciado as HH:MM" (`actualStartTime`). |
| S5 | "Esqueci minha senha" (reset por e-mail) | ⬜ aberto (depende S6) | Fluxo publico `POST /auth/forgot-password {email}` + `POST /auth/reset-password {token,newPassword}`. | Link "Esqueci minha senha" no login + telas de pedir e-mail / nova senha. |
| S6 | Notificacao por e-mail / infra SMTP | ⬜ aberto | Integrar provedor (SMTP/SendGrid/SES) — infra nova. Habilita o S5 e avisos por e-mail. | Consome quando existir. |

> ⚠️ **Reconciliacao pendente (combinada 2026-07-04):** BUG4/BUG5/BUG6/S3/S4/S5/S6/S7/S8/S9 **ainda nao estao** na "Pendencias abertas do BACKEND — FONTE UNICA" do PRD_BACKEND. O backend confirmou todos como gaps reais e se ofereceu p/ incorpora-los na lista dele. Ate la, esta tabela e a referencia.

---

## Detalhe — BUG5/BUG6 (fechamento pelo horario)

**Decisao Andre (2026-07-04): NAO auto-fechar.** Fechar e **sempre acao manual com CONFIRMACAO** (owner **ou** profissional, ver S8). Regras:

1. O backend **NAO** muda `open_status` sozinho (nao auto-fecha no `closing_time`).
2. Ao chegar o `closing_time` das **configuracoes** (ou apos "parar de aceitar novos"), **bloquear NOVAS entradas na fila** — `POST /attendances` rejeita (ex.: `422 QUEUE_CLOSED_FOR_NEW_ENTRIES`). A **fila existente segue sendo atendida ate esvaziar** — nunca remover clientes.
3. Mesmo fechado p/ novos, o cliente **ainda pode "solicitar corte"**: um **pedido sob aprovacao** (o profissional aceita/recusa) — entrada nao automatica.
4. **Status efetivo:** apos o `closing_time`, `is_open` efetivo = **fechado** (nao recebe cliente nem aparece "aberto"), mesmo com `open_status` manual ainda OPEN. Expor `opening/closing` + `is_open` na **listagem** (client + partner).
5. Se o profissional/owner **quiser continuar atendendo** apos o horario, o app **exige confirmacao que leva a ALTERAR o `closing_time` nas configuracoes** — o horario configurado e a fonte da verdade (e alimenta os relatorios, ver S9). Nao ha "continuar aberto" solto.

Confirmado pelo backend como gap real: `updateOpenStatus` nao checa fila/horario; so existe o gate de **abrir** (>=1 profissional com servico + horario definido).

**Sugestao de produto:** separar `TEMPORARILY_CLOSED` ("parar de aceitar novos", permitido, termina a fila) de `CLOSED` total (so com fila vazia + sem `IN_PROGRESS`).
