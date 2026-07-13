# Handoff Front-Partner → Backend

Pendencias do app **partner** (profissional/owner) que dependem do backend. O front ja esta pronto (ou pronto para consumir) na maioria dos casos. Detalhe completo nos callouts do `PRD_FRONT-PARTNER.md`.

Ultima atualizacao: 2026-07-11 · branch `dev` do front-partner.

> **Fonte unica dos handoffs do partner.** Nao espalhar handoff pelo corpo do PRD — registrar aqui. O backend edita o proprio PRD; estes itens sao para o backend consumir e refletir na lista dele.
>
> **Numeracao (DINAMICA, por PRIORIDADE — espelha o backend).** BUGs e pendencias (S) sao numerados **1..N por prioridade**: **#1 = prioridade maxima**. Ao **resolver** um item, ele sai e a lista **renumera 1..N** (sem acumular riscados). Ao **repriorizar**, o item promovido assume a nova posicao (ex.: o antigo #7 vira **#1**) e todos os demais sao **empurrados para baixo** — renumeracao total, eternamente. **O numero e so a posicao de prioridade: VOLATIL.** A **chave estavel de cada item e o NOME** (igual ao backend — cross-references e commits citam o NOME, nunca o numero).

> **Alinhamento backend↔partner (autoritativo — backend 2026-07-11).** PRD-Partner **coerente**. **REGRA (fonte de verdade = backend): nao chavear por numero — os numeros do backlog do backend sao volateis** (renumeram a cada item fechado/inserido; ex.: os "#5/#7" da 1a rodada ja viraram "#4/#6" quando o BUG9 fechou). **Chavear por NOME + endpoints.** O backend registrou os aliases no PRD dele (commit `e098aff`).
>
> **NAO havia colisao** — o que parecia "S2/S3=#5" e "S5/S7/S8=#7" era so a **numeracao S do Partner mudando entre rodadas** cruzada com o backlog volatil: intencao→promocao foi **S3 (1a rodada) → S2 (2a)**; esqueci-senha foi **S5 → S7**; SMTP foi **S6 → S8**. Sao os mesmos itens.
>
> Ancoras estaveis por nome (numero so informativo, volatil):
> - **Intencao → promocao** (S2) = `POST/PATCH/DELETE /attendances/intentions` — backend #4 hoje.
> - **Esqueci senha + SMTP** (S7 + S8, agrupados de proposito: o SMTP habilita o reset) = `POST /auth/forgot-password` + `POST /auth/reset-password` — backend #6 hoje.
> - Demais itens: chavear pelo **nome/endpoint da propria linha** (os numeros vivem no PRD do backend).
>
> **Resolvidos na rodada anterior (sairam da lista):**
> - **BUG2 antigo** (pausar atendimento → orfao) = **backend BUG7, commit `d3ce7a2`** (dev). Ja implementado; falta **QA do front** (o card ja trata PAUSED/Retomar).
> - **BUG4 antigo** (estabelecimento vazio some da busca) = **NAO era backend** (efeito do filtro do BUG5: `GET /establishment` so devolve OPEN). **Front aplicou `includeAll=true`** na `find-establishment`. (Andre pode pedir endpoint de afiliacao dedicado se preferir.)

> 🟡 **UI STUBS "em breve" (estrategia Andre 2026-07-12).** Onde o front tem UI mas o backend ainda nao, a tela **ja fica pronta** e o clique dispara **"Em breve"** (helper `src/components/comingSoon.ts`). **Ao backend entregar, so conectar** (cada componente tem comentario `// Ao ligar: <endpoint>`); esses stubs saem desta lista. Ja stubados: **S1** (`e69c288`), **S3** (`d93aefb`), **S4** (`dae6221`), **S5** (`ba41a6c`), **S7** (`94c92ab`). *Nao stubados (e por que): S2/S6 = front do CLIENTE; S8 = infra sem UI; S9 = precisa do dado real (nao e botao).*

---

## BUGs (abertos)

| # | Item | Status backend | O que o backend precisa fazer | O que o front faz depois |
|---|------|----------------|-------------------------------|--------------------------|
| BUG1 | Fechamento com confirmacao + gate de entrada fora do horario — **NAO auto-fechar** | 🧪 **sera testado** (2026-07-09) | Ver **"Detalhe — BUG1"** abaixo. Resumo: (1) NAO auto-mudar `open_status`; (2) bloquear NOVAS entradas na fila fora do horario/apos "parar novos"; (3) fluxo de **"solicitar corte"** (pedido sob aprovacao); (4) `is_open` efetivo + `opening/closing` na listagem. | Confirmacao no toggle de fechar; tratar o gate; dashboard mostra "fechado p/ novos". |
| BUG2 | **Apelido (nickname) nao volta no `GET /professional/me`** | ⬜ aberto (confirmado 2026-07-11) | O `PATCH /profile/general-infos { nickname }` retorna **200** (salva), mas ao reabrir as Configuracoes o apelido **some**. Backend confirmou: `/professional/me` devolve `ProfessionalQuickCreateResponse` **sem nickname** (o campo vive no `BaseUser`, setado via `PATCH /profile/general-infos`). **Fix = projetar `nickname` no `/me`.** | **Mitigado no front:** apos salvar, o partner reflete o valor localmente (+persist) e o `normalize` tolera `nickname`/`nickName`/`nick_name`. Fica 100% quando o `/me` projetar o campo. |

## Pendencias / features (S — abertas)

| # | Item | Status backend | O que o backend precisa fazer | O que o front faz depois |
|---|------|----------------|-------------------------------|--------------------------|
| S1 | **Status do profissional → `open_status` derivado** (modelo acordado 2026-07-09) | ⬜ **novo — precisa de backend** (ver "Detalhe — S1" abaixo) | Profissional muda o **proprio** status (`trabalhando`/`intervalo`/`indisponivel`); `open_status` **derivado/read-only** = `∃ prof ∈ {trabalhando, intervalo}`. + flag **`aceitandoNovos`** ("fechar fila": drena e **auto-`indisponivel`** no fim). + **rotulo do cliente** derivado (DISPONIVEL/ENCERRANDO/INDISPONIVEL). `PATCH /professional/me/status`; recalculo atomico + evento. | 🟡 **UI STUB PRONTA** ("em breve", `e69c288`): `ProfessionalStatusControl` no topo da fila (seletor Trabalhando/Intervalo/Indisponível + "fechar fila"). Ja real: "indisponivel" desabilitado com aviso quando ha fila. **Ao entregar:** `current` vem da projecao + acoes chamam `PATCH /professional/me/status`. Agendar no card do `indisponivel` liga ao S2/calendario. |
| S2 | **Intencao de atendimento → promocao automatica a fila** | ⬜ aberto — **spec desenhada 2026-07-05** (ver "Detalhe — S2" abaixo) | Novo status **INTENTION**: atendimento criado com um `desiredTime` que fica **fora da fila** ("solto") e e **promovido a `SCHEDULED`** quando falta **≤15min** pro horario. Ponto unico de entrada (create/edit passam pelo algoritmo), promocao **event-driven** (timer, nao polling), invariante dos 15min. Ver detalhe. | Client: UI de manifestar intencao/agendar. Partner: reflete quando a INTENTION vira `SCHEDULED` na fila (ja consome `professionals-with-queue`). |
| S3 | Refeicoes Modelo B (janela flexivel) | ⬜ aberto | Placement da refeicao no 1o buraco dentro de `[alvo−adiant, min(proxRefeicao−3h, fechamento−dur)]` + **auto-supressao** (3h/fechamento) no ETA meal-aware + "iniciar = proxima nao suprimida". Ja existem: `skip` (#41), ETA meal-aware, "atender encerra a refeicao ativa". | 🟡 **UI STUB PRONTA** ("em breve", `d93aefb`): botao ⏱ (adiantar/adiar) na refeicao prevista, ao lado do lapis (✎, ja funcional). **Ao entregar:** ⏱ move o placement no backend; + "almoco iniciado as HH:MM" (`actualStartTime`). |
| S4 | Promover cliente ao 1o lugar (reordenar a fila) | ⬜ aberto (gap real, confirmado 2026-07-04) | `PATCH /attendances/{id}/promote` (move ao indice 0, empurra os demais). Obs.: `start` ja atende **qualquer** id SCHEDULED/LATE fora de ordem; falta so o "promover ao topo sem atender". | 🟡 **UI STUB PRONTA** ("em breve", `dae6221`): botao "Promover ao topo" nos cards fora do 1o lugar (distinto do "Adiantar", que ja atende fora de ordem via `start`). **Ao entregar:** chamar `PATCH /attendances/{id}/promote`. |
| S5 | Expediente (inicio/fim) nos relatorios | ⬜ aberto | Registrar eventos reais de abrir/fechar (timestamp) ou expor a janela `opening/closing` + eventos num endpoint de relatorio. Ligado ao BUG1 e ao S1 (o 1o `trabalhando` / ultimo `indisponivel` marcam inicio/fim). | 🟡 **UI STUB PRONTA** ("em breve", `ba41a6c`): `ExpedienteCard` (placeholder `--:-- – --:--` + selo EM BREVE) nos relatorios do dono e do profissional. **Ao entregar:** trocar o placeholder pelos horarios reais. |
| S6 | **Cliente adiciona servico a um attendance ja na fila** | ⬜ aberto (pedido 2026-07-04) | Endpoint para **acrescentar** service item(s) a um attendance **existente** (cliente ja na fila decide somar servico) que **recalcula** duracao estimada + total e reflete na fila do profissional. Ex.: `PATCH /attendances/{id}/service-items` (add). | Lado client (HANDOFF_CLIENT): botao "adicionar servico" na tela do atendimento em fila. Partner: o card da fila ja mostra os servicos — reflete sozinho o recalculo. |
| S7 | "Esqueci minha senha" (reset por e-mail) | ⬜ aberto (depende S8) | Fluxo publico `POST /auth/forgot-password {email}` + `POST /auth/reset-password {token,newPassword}`. | 🟡 **UI STUB PRONTA** ("em breve", `94c92ab`): link "Esqueci minha senha" no login. **Ao entregar:** navegar p/ tela de pedir e-mail (`POST /auth/forgot-password`) + tela de nova senha (`reset-password`). |
| S8 | Notificacao por e-mail / infra SMTP | ⬜ aberto (infra que habilita o S7) | Integrar provedor (SMTP/SendGrid/SES) — infra nova. Habilita o S7 e avisos por e-mail. | Consome quando existir. |
| S9 | **Listar TODOS os profissionais do estabelecimento (incl. sem servico)** | ⬜ aberto (pedido 2026-07-09) | Hoje so existe `professionals-with-queue`, que **esconde** profissional sem servico (#31). Falta um `GET /establishment/{id}/professionals` (ou count) que retorne **todos os vinculados**, com flag/contagem de servicos. | Desbloqueia o checklist de prontidao a **separar** "1+ profissional vinculado" de "1+ com servico" (hoje colapsados num item) e o owner ver o profissional recem-vinculado que ainda nao cadastrou servico. |

> ✅ **Resolvidos/entregues 2026-07-09 (sairam da lista, numeracao renumerada):**
> - **Endereco no `EstablishmentResponse`** (backend `a58704f`) — front ja lia `data.address`, liga sozinho.
> - **`open-status` ao profissional afiliado — toggle bruto** (backend `7819914`) — front consumiu (card Abrir/Fechar). **Sera substituido pelo S1** (status do profissional → `open_status` derivado).
> - **Gate 409 ao fechar com fila ativa** (`ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES`, backend `0b63678`) — front trata no dashboard e na fila.
> - **`GET /attendances?establishmentId&status`** (nao carregava) — resolvido.
> - **Cliente na fila nao aparecia** nos read-models — resolvido.
> - **Remover da fila nao refletia pro cliente** — resolvido.
> - **Adicionar servico pelo OWNER** — **nao era bug**: por regra, so o **profissional** salva servico (owner nao adiciona).
> Front consumiu os itens de contrato; falta QA no celular.
>
> ✅ **Reconciliacao 2026-07-11:** o backend confirmou os itens como gaps reais e chaveia por **nome + endpoints** (numeros do backlog sao volateis — ver nota de alinhamento no topo). Nao havia colisao de numeros. **S1** = status do profissional → `open_status` derivado, modelo acordado 2026-07-09.

---

## Detalhe — BUG1 (fechamento pelo horario)

**Decisao Andre (2026-07-04): NAO auto-fechar.** Fechar e **sempre acao manual com CONFIRMACAO** (owner **ou** profissional, ver S1). Regras:

1. O backend **NAO** muda `open_status` sozinho (nao auto-fecha no `closing_time`).
2. Ao chegar o `closing_time` das **configuracoes** (ou apos "parar de aceitar novos"), **bloquear NOVAS entradas na fila** — `POST /attendances` rejeita (ex.: `422 QUEUE_CLOSED_FOR_NEW_ENTRIES`). A **fila existente segue sendo atendida ate esvaziar** — nunca remover clientes.
3. Mesmo fechado p/ novos, o cliente **ainda pode "solicitar corte"**: um **pedido sob aprovacao** (o profissional aceita/recusa) — entrada nao automatica.
4. **Status efetivo:** apos o `closing_time`, `is_open` efetivo = **fechado** (nao recebe cliente nem aparece "aberto"), mesmo com `open_status` manual ainda OPEN. Expor `opening/closing` + `is_open` na **listagem** (client + partner).
5. Se o profissional/owner **quiser continuar atendendo** apos o horario, o app **exige confirmacao que leva a ALTERAR o `closing_time` nas configuracoes** — o horario configurado e a fonte da verdade (e alimenta os relatorios, ver S5). Nao ha "continuar aberto" solto.

Confirmado pelo backend como gap real: `updateOpenStatus` nao checa fila/horario; so existe o gate de **abrir** (>=1 profissional com servico + horario definido).

**Sugestao de produto:** separar `TEMPORARILY_CLOSED` ("parar de aceitar novos", permitido, termina a fila) de `CLOSED` total (so com fila vazia + sem `IN_PROGRESS`).

---

## Detalhe — S1 (status do profissional → `open_status` derivado)

Decisao Andre (2026-07-09). **Substitui** o toggle bruto de `open_status` (entregue em `7819914` — mantido so como base) por um modelo onde **o profissional muda o proprio status** e o `open_status` do estabelecimento e **derivado**, nunca escrito diretamente. Elimina o estado ilegal "aberto sem ninguem atendendo" e a corrida do booleano compartilhado.

### Status do profissional (enum, por profissional)
- **`trabalhando`** (WORKING): em expediente. **Conta** para a loja. Fila **ao vivo** (publicada). So pode entrar em `trabalhando` se tiver ≥1 servico (gate #31).
- **`intervalo`** (ON_BREAK): **sub-estado de trabalhando**. **Conta como aberto** — a loja **nao fecha** no almoco de quem vai voltar. Profissional nao atende no momento; o ETA ja e tratado pelos intervals (#14).
- **`indisponivel`** (OFF): fora de expediente. **NAO conta.** Fila em **DRAFT** (reordenavel a vontade). **Neste status o cliente pode tocar no card do profissional e AGENDAR** um atendimento para os **dias em que a agenda estiver liberada** (ver "Agendamento" abaixo).

### `open_status` derivado
`aberto ⇔ ∃ profissional afiliado com status ∈ {trabalhando, intervalo}`. `fechado` quando **todos** estao `indisponivel`. O estabelecimento **nunca** tem o status escrito — e **projecao read-only** em todos os GETs (`professionals-with-queue`, listagem, detalhe).

### Transicoes (event-driven, na MESMA transacao do PATCH)
- `indisponivel → trabalhando`: se era o **1o** da loja (`0→1`) ⇒ **abre** o estabelecimento; **publica** a ordem da fila (DRAFT→PUBLISHED); **registra inicio de expediente** (S5).
- `trabalhando → indisponivel`: se era o **ultimo** (`1→0`) ⇒ **fecha**; **registra fim de expediente** (S5).
- `trabalhando ↔ intervalo`: **nao** muda o `open_status` (intervalo conta).

### Fila fechada / drenar (`aceitandoNovos`) + auto-`indisponivel`
Resolve o "e se clientes seguem entrando, o profissional nunca sai?". O profissional **para de aceitar novos** mas continua atendendo quem ja esta, ate esvaziar (padrao **drenar**).
- **Flag `aceitandoNovos`** sobre o `trabalhando`. `false` = **fila fechada/encerrando**: nenhum cliente novo entra; os que ja estao continuam. **Ainda conta como loja aberta** (ele esta servindo).
- **Dois gatilhos p/ `aceitandoNovos=false`:** (a) **manual** — botao "fechar fila" (imediato); (b) **automatico** — passou do **`closing_time` das configuracoes** ("mudar o horario final" = mudar esse `closing_time`, **nao** um horario avulso do dia).
- **Auto-`indisponivel`:** com `aceitandoNovos=false`, ao **finalizar o ULTIMO** atendimento (`waiting_list` vazia + `current_attendance` null) o profissional **transiciona sozinho para `indisponivel`** (na MESMA transacao do finish). Se ao fechar a fila ela **ja estiver vazia** → vai **direto** a `indisponivel`. O profissional nao precisa "lembrar de sair".
- Se ele for o **ultimo**, a auto-transicao fecha a loja (open_status derivado) — tudo event-driven.
- Mesmo com fila fechada, o cliente ainda pode **"solicitar corte"** (pedido sob aprovacao — ver BUG1); fechar a fila nao impede o pro de encaixar manualmente.

### Rotulo do cliente (projecao derivada — NAO expor o estado interno cru)
O cliente **nunca** ve `trabalhando`/`aceitandoNovos`. Ve um rotulo derivado que comunica **se da pra entrar**:
| Cliente ve | Deriva de | Entra? |
|---|---|---|
| **DISPONIVEL** | `trabalhando` aceitandoNovos=true **ou** `intervalo` | ✅ sim |
| **ENCERRANDO** | `trabalhando` aceitandoNovos=false (fila fechada/drenando) | ❌ nao |
| **INDISPONIVEL** | `indisponivel` | ❌ nao |

- **`intervalo` projeta como DISPONIVEL** — pro cliente na espera so importa o **tempo de espera**, que **ja embute** o intervalo (ETA meal-aware, #14). Nao ha rotulo "EM INTERVALO" pro cliente.
- O intervalo so se manifesta pro **cliente EM PROGRESSO**: quando o profissional inicia um intervalo durante um atendimento `IN_PROGRESS`, o **timer do atendimento PAUSA** e o **timer do intervalo comeca**; ao `finish` do intervalo, o atendimento **retoma**. (Depende de `pause` manter o atendimento **exposto e retomavel** — **resolvido**: backend BUG7, commit `d3ce7a2`; falta QA do front.)
- **CHEIO** (fila no limite de capacidade) fica como **evolucao futura** — so entra se criarmos teto de fila; seria mais um rotulo derivado (`fila ≥ limite`, temporario, reabre ao drenar), distinto de ENCERRANDO (terminal no dia).

### UX — prevenir o clique (botao desabilitado + aviso inline), nao so o erro
- O botao **"indisponivel"** (sair) fica **desabilitado** enquanto o profissional tem `current_attendance` **ou** `waiting_list` nao-vazia — com **aviso inline visivel** ("Nao e possivel ficar indisponivel com cliente em atendimento ou na fila"). Com fila, o caminho e **"fechar fila"** (drena e sai sozinho).
- **Manter o gate no servidor** (`409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES`) como **rede de seguranca** — o disable e UX, o 409 e correcao (cache velho, outro aparelho, corrida). No mobile o motivo tem que ser **texto fixo** (botao desabilitado nao recebe toque p/ explicar).

### Por que e a prova de corrida
Cada profissional escreve **so o proprio** status (idempotente e comutativo por profissional). O `open_status` e `COUNT(status ∈ {trabalhando, intervalo}) ≥ 1`. Dois entrando em `trabalhando` ao mesmo tempo ⇒ conjunto com 2 ⇒ **aberto** — nao ha booleano disputado nem "ultimo a escrever vence".

### Owner continua com override (nao com presenca)
O owner mantem um **gate/override** (feriado, emergencia, `TEMPORARILY_CLOSED`) que pode **forcar fechado**, mas **nunca forcar aberto** (senao o status volta a mentir). Presenca (status dos profissionais) abre; override do owner e horario podem fechar.

### Agendamento no card do profissional `indisponivel`
Requisito novo (Andre 2026-07-09): com o profissional em `indisponivel`, o cliente agenda um atendimento **futuro**. Depende de:
- **(a) Agenda liberada** — quais dias o profissional aceita agendamento (calendario publicado, PRD secao 12).
- **(b) Endpoint de agendamento futuro** — que e o proprio modelo **S2 (INTENTION → promocao)** com `desiredTime` num dia futuro da agenda liberada. Ou seja: "indisponivel + agendar" = criar uma **INTENTION** para um dia liberado.

### Contrato sugerido
- `PATCH /professional/me/status { status: "trabalhando" | "intervalo" | "indisponivel" }` (substitui o uso **profissional** do `open-status`). Bloquear `→ indisponivel` com `409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES` se houver `current_attendance`/`waiting_list` (o app tambem desabilita o botao).
- **`aceitandoNovos`** (fechar fila): `PATCH /professional/me/accepting-new { value: false|true }` **ou** embutido no status endpoint. `false` **e** apos o `closing_time` ⇒ `POST /attendances` (novo cliente) rejeita p/ esse profissional. **Auto-`indisponivel`** no `finish` do ultimo com `aceitandoNovos=false` (server-side, atomico).
- **`open_status`** do estabelecimento **read-only derivado** em todos os GETs.
- **Rotulo do cliente por profissional** projetado nos GETs do **client** (ex.: `professional_client_status: DISPONIVEL | ENCERRANDO | INDISPONIVEL`) — deriva do estado interno (intervalo→DISPONIVEL). **Nao** expor `aceitandoNovos`/`trabalhando` cru pro cliente.
- Recalcular o agregado **atomicamente** na transacao; emitir evento (WS `/topic/establishment/{id}/queue` + push) **na transicao** de abertura/fechamento e de aceita-novos.
- No boot/restart, o agregado se recompoe do banco (e projecao, nao ha timer a reconstruir).

### Estado do front (2026-07-09)
- ✅ **Ja feito (OTA-puro, lado OWNER):** no dashboard do dono o botao **"Fechar Estabelecimento"** fica **desabilitado com aviso inline** quando ha cliente em atendimento/fila (o caminho vira "Fechar Temporariamente" p/ drenar), e trata o `409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES`. Isso ja aplica a regra de UX ("prevenir o clique") no que **nao** depende do backend novo.
- ⬜ **Aguardando o backend (o resto do S1):** o toggle bruto do PROFISSIONAL (entregue em `7819914`) **nao** foi evoluido ainda — o seletor de status + "fechar fila" + auto-`indisponivel` + rotulo do cliente **so entram quando o backend expuser os endpoints abaixo**.

### Front-partner depois (quando o backend entregar)
- Trocar o toggle bruto do profissional por **seletor de status** (trabalhando/intervalo/indisponivel); `open_status` da loja **so exibido, nunca escrito**.
- Botao **"fechar fila"** (aceitandoNovos=false) + botao **"indisponivel"** **desabilitado com aviso inline** enquanto houver atendimento/fila (mesma regra ja aplicada ao dono).
- O "agendar no card" (profissional indisponivel) entra junto com o S2/calendario (client tambem).

---

## Detalhe — S2 (intencao de atendimento → promocao a fila)

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

> ⚠️ Este desenho **substitui** o esboco anterior de `/swap-offers` para o S2 (a "manifestacao de intencao + horario" agora e o mecanismo de INTENTION → promocao). Se a **troca dirigida entre dois clientes** ainda for desejada em paralelo, tratar como item separado.
