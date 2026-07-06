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
| BUG7 | **Pausar atendimento torna-o orfao** (some da fila) | 🔴 **CONFIRMADO em teste 2026-07-04** ("bugou mesmo") | Ao `PATCH /attendances/{id}/pause`, o atendimento **some** — some do `professionals-with-queue` (nem `current_attendance` nem `waiting_list`) **e** some pro proprio cliente. O profissional **nao consegue retomar nem reiniciar** o atendimento desse cliente (fica como se o atendimento nao estivesse mais vinculado a ninguem; do lado cliente o status ainda diz "agora/em atendimento"). O `pause` provavelmente deixa o attendance num estado que **todos os read-models filtram**. Corrigir: um attendance PAUSED tem que continuar **exposto e retomavel** (`current_attendance` do profissional) ate `resume`/`finish`, e o cliente ver "pausado". | **Ja pronto:** o card trata `PAUSED` e mostra "Retomar" — volta a funcionar assim que o pausado continuar sendo retornado. |
| BUG8 | **Cliente na fila nao aparece — nem pro profissional nem na lista do proprio cliente** | ⬜ aberto (observado em teste 2026-07-04; provavel backend/dados) | Cliente entra na fila de um profissional. **Sintomas:** (a) na tela "meu atendimento" do app-client aparece "voce esta na fila", MAS (b) na **lista de atendimentos do proprio cliente** (`GET /attendances?clientId=...`) **nao aparece nada**, e (c) no app-partner (login fresco, sem cache) o atendimento **nao vem** no `professionals-with-queue.waiting_list` do profissional. Ou seja: o attendance existe numa leitura (queue do cliente) mas **nao e projetado** em `GET /attendances` nem em `professionals-with-queue` → inconsistencia entre os read-models. Confirmar que o attendance criado pelo client aparece nos 3. Suspeitas: vinculo `professional_queue` ausente, filtro `is_open`/#31, estabelecimento divergente, ou o attendance ficar num estado que os outros GETs filtram. | **Ja pronto (partner):** a tela le `waiting_list`/`current_attendance` e faz `find` por `professional.id` corretamente — exibe sozinho quando o backend projetar. Verificado que **nao e bug de front** no partner. |
| BUG9 | **Remover da fila nao reflete pro cliente** | ⬜ aberto (observado em teste 2026-07-04; provavel backend + client) | Profissional remove o cliente (`DELETE /professional-queue/{id}/remove`), mas o **app cliente continua mostrando "voce esta na fila"**. Garantir que a remocao (1) **cancele** o attendance de forma que ele **suma do read do cliente** (`GET /client-queue/...` / status do proprio atendimento) e (2) **emita notificacao** em `/user/queue/notifications` (ex.: `ATTENDANCE_CANCELLED`/removido) + push, para o client sair do estado "em fila" sem depender de reload manual. | Lado client = **C9** (HANDOFF_CLIENT): refletir a remocao (refetch/WS). Habilitado pelo sinal do backend. |
| BUG10 | **Apelido (nickname) nao volta no `GET /professional/me`** | ⬜ aberto (observado em teste 2026-07-04) | O `PATCH /profile/general-infos { nickname }` retorna **200** (salva), mas ao reabrir as Configuracoes o apelido **some** — o `GET /professional/me` (usado pelo `fetchMe`) **nao projeta o nickname** (ou usa outro nome de campo). Confirmar: (1) o `general-infos` **persiste** mesmo o nickname; (2) `GET /professional/me` **retorna** `nickname`. (O partner ja mostra "Nome (Apelido)" na busca via `ProfessionalSearchResponse`, entao la o nickname existe — falta no `/me`.) | **Mitigado no front:** apos salvar, o partner reflete o valor localmente (+persist) e o `normalize` tolera `nickname`/`nickName`/`nick_name`. Fica 100% quando o `/me` projetar o campo. |
| S10 | **Cliente adiciona servico a um attendance ja na fila** | ⬜ aberto (pedido 2026-07-04) | Endpoint para **acrescentar** service item(s) a um attendance **existente** (cliente ja na fila decide somar servico) que **recalcula** duracao estimada + total e reflete na fila do profissional. Ex.: `PATCH /attendances/{id}/service-items` (add). | Lado client = **C8** (HANDOFF_CLIENT): botao "adicionar servico" na tela do atendimento em fila. Partner: o card da fila ja mostra os servicos — reflete sozinho o recalculo. |
| S9 | Expediente (inicio/fim) nos relatorios | ⬜ aberto | Registrar eventos reais de abrir/fechar (timestamp) ou expor a janela `opening/closing` + eventos num endpoint de relatorio. Ligado a BUG5/BUG6 (horario configurado = fonte da verdade). | Exibir "Expediente: HH:MM–HH:MM" nos relatorios (owner e profissional). |
| S8 | Profissional abrir/fechar o estabelecimento | ⬜ aberto | Liberar `PATCH /establishment/{id}/open-status` para o papel `PROFESSIONAL` afiliado (hoje OWNER-only; analogo ao S1 que abriu `POST service-items` ao afiliado). | Expor o toggle abrir/fechar na area do profissional. |
| S7 | Promover cliente ao 1o lugar (reordenar a fila) | ⬜ aberto (gap real, confirmado 2026-07-04) | `PATCH /attendances/{id}/promote` (move ao indice 0, empurra os demais). Obs.: `start` ja atende **qualquer** id SCHEDULED/LATE fora de ordem; falta so o "promover ao topo sem atender". | Botao "Atender este" em qualquer card → promove → inicia. (Enquanto nao vem, usa `start` direto.) |
| S3 | **Intencao de atendimento → promocao automatica a fila** | ⬜ aberto — **spec desenhada 2026-07-05** (ver "Detalhe — S3" abaixo) | Novo status **INTENTION**: atendimento criado com um `desiredTime` que fica **fora da fila** ("solto") e e **promovido a `SCHEDULED`** quando falta **≤15min** pro horario. Base do modelo de "manifestar intencao (adiantar/atrasar) + horario" (antes esbocado como `/swap-offers`). Ponto unico de entrada (create/edit passam pelo algoritmo), promocao **event-driven** (timer, nao polling), invariante dos 15min. Ver detalhe. | Client (C6): UI de manifestar intencao. Partner: reflete quando a INTENTION vira `SCHEDULED` na fila (ja consome `professionals-with-queue`). |
| S4 | Refeicoes Modelo B (janela flexivel) | ⬜ aberto | Placement da refeicao no 1o buraco dentro de `[alvo−adiant, min(proxRefeicao−3h, fechamento−dur)]` + **auto-supressao** (3h/fechamento) no ETA meal-aware + "iniciar = proxima nao suprimida". Ja existem: `skip` (#41), ETA meal-aware, "atender encerra a refeicao ativa". | Popup adiantar/adiar + lapis + "almoco iniciado as HH:MM" (`actualStartTime`). |
| S5 | "Esqueci minha senha" (reset por e-mail) | ⬜ aberto (depende S6) | Fluxo publico `POST /auth/forgot-password {email}` + `POST /auth/reset-password {token,newPassword}`. | Link "Esqueci minha senha" no login + telas de pedir e-mail / nova senha. |
| S6 | Notificacao por e-mail / infra SMTP | ⬜ aberto | Integrar provedor (SMTP/SendGrid/SES) — infra nova. Habilita o S5 e avisos por e-mail. | Consome quando existir. |

> ⚠️ **Reconciliacao pendente (combinada 2026-07-04):** BUG4/BUG5/BUG6/BUG7/BUG8/BUG9/S3/S4/S5/S6/S7/S8/S9/S10 **ainda nao estao** na "Pendencias abertas do BACKEND — FONTE UNICA" do PRD_BACKEND. BUG7/BUG8/BUG9/BUG10/S10 sao **novos** (teste manual/pedido 2026-07-04; BUG7 CONFIRMADO). A confirmar/reproduzir no backend. O backend confirmou os demais como gaps reais e se ofereceu p/ incorpora-los na lista dele. Ate la, esta tabela e a referencia.

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

---

## Detalhe — S3 (intencao de atendimento → promocao a fila)

Desenho fechado com o Andre (2026-07-05). Objetivo: o cliente cria um atendimento com um **horario pretendido** (`desiredTime`) que **nao entra na fila na hora** — fica "solto" com status **`INTENTION`** — e o sistema o **promove** a `SCHEDULED` (fila real) quando o horario esta perto. Isso evita poluir a fila com itens de futuro distante e roda com **custo ~zero enquanto nao ha nada a fazer**.

### Conceito
- Novo status **`INTENTION`**: **nao pertence a fila nenhuma**. Nao aparece em `professionals-with-queue` (nem `waiting_list` nem `current_attendance`) enquanto for INTENTION.
- Cada INTENTION tem um `desiredTime` (horario pretendido).
- Quando falta **≤ 15min** pro `desiredTime`, a INTENTION e **promovida a `SCHEDULED`** e inserida na fila **na posicao correspondente ao ETA** naquele instante. So ai ela passa a existir pra fila/profissional.

### Ponto UNICO de entrada (a chave do desenho)
**Todo create E todo edit de uma INTENTION passam pelo mesmo algoritmo antes de persistir.** O algoritmo:
1. Valida a **invariante** (abaixo).
2. Recalcula qual e a **cabeca** = a INTENTION de **menor `desiredTime`**.
3. **(Re)agenda** o gatilho de promocao para `cabeca.desiredTime − 15min`.

Consequencia: quando o cliente **edita** o horario, o endpoint chama o algoritmo de novo → a cabeca e o gatilho **se corrigem na hora**. Nao existe "despertador velho" a limpar — inclusive o caso "mudou pra **mais cedo**" e resolvido no proprio edit (nao fica esperando um timer atrasado).

### Gatilho de promocao — EVENT-DRIVEN, nao polling
- Agendar **um job/timer** para `cabeca.desiredTime − 15min` (nao varrer todas as intencoes de tempos em tempos). Fora dos disparos, **zero custo**.
- **No disparo**, o handler **NAO promove cego** — ele **re-busca no banco** o menor INTENTION (`WHERE status=INTENTION ORDER BY desiredTime ASC LIMIT 1`) e **re-checa** `now ≥ desiredTime − 15min`:
  - se due → **promove** (INTENTION → SCHEDULED, insere na fila pela posicao do ETA) → **re-busca o proximo menor** → repete enquanto houver due (**loop de drenagem**, cobre rajadas apos ociosidade) → reagenda o timer pro proximo.
  - se nao due (ex.: horario foi adiado) → nao promove, so **reagenda**.

### Os 3 casos de edicao/cancelamento (todos cobertos)
1. **Cancelou** → status sai de INTENTION → a re-busca do disparo **nao o encontra** → ignorado (auto-limpante).
2. **Mudou pra mais tarde** → ainda e INTENTION, mas a re-checagem ve `now < desiredTime−15min` → nao promove, reagenda.
3. **Mudou pra mais cedo** → o **edit passou pelo algoritmo** → a cabeca/gatilho ja foram adiantados na hora. (Este era o unico caso que exigiria "reagendar"; o ponto unico de entrada o resolve de graca.)

### Invariante
Nao se pode criar/editar uma INTENTION com `desiredTime` **menor que, ou a ≤15min de,** o **fim projetado da fila** (nao "do agora"). Motivo: garante que a intencao e um slot **futuro e alcancavel** com folga, e que ela nunca precisa ser promovida "ja nascendo". **Re-checar tambem na promocao**: se a fila **inchou** e o slot ja passou, decidir a regra de borda (inserir mesmo assim vs. avisar o cliente que atrasou).

### Robustez / performance
- **Nao cachear o "menor" num campo mutavel cru** — derivar por **indice** em `(status, desiredTime)`; `ORDER BY desiredTime LIMIT 1` fica O(log n) e **sempre fresco**. O timer e um **palpite**; a **fonte da verdade e a query**.
- **Promocao atomica** (transacao/lock otimista) → sem dupla-insercao em corrida (dois edits/promocoes concorrentes).
- **No boot/restart**, reconstruir o timer a partir do banco (senao perde o despertador da cabeca).
- Ao promover, **notificar o cliente** (WS `/user/queue/notifications` + push) que ele entrou na fila.
- Custo: ~zero ocioso (dorme entre eventos) + O(log n) por promocao. Muito melhor que manter futuros na fila e reordenar a cada mudanca.

### Endpoints (sugestao)
- `POST /attendances/intentions { professionalId, serviceItemIds, desiredTime }` → cria INTENTION (passa pelo algoritmo).
- `PATCH /attendances/intentions/{id} { desiredTime }` → edita (passa pelo algoritmo; recalcula cabeca/timer).
- `DELETE /attendances/intentions/{id}` → cancela (status → CANCELLED).
- Promocao e **interna** (job), nao endpoint. Cliente recebe via WS/push quando vira SCHEDULED.

> ⚠️ Este desenho **substitui** o esboco anterior de `/swap-offers` para o S3 (a "manifestacao de intencao + horario" agora e o mecanismo de INTENTION → promocao). Se a **troca dirigida entre dois clientes** ainda for desejada em paralelo, tratar como item separado.
