# Handoff Front-Partner → Backend

Pendencias do app **partner** (profissional/owner) que dependem do backend. O front ja esta pronto (ou pronto para consumir) na maioria dos casos. Detalhe completo nos callouts do `PRD_FRONT-PARTNER.md`.

Ultima atualizacao: 2026-07-22 · branch `dev` do front-partner.

> 🔍 **AUDITORIA CRUZADA 2026-07-22 (li o PRD_BACKEND e o PRD/HANDOFF do client).** Muita coisa reconciliou bem: auto-fechamento virou o **#2 da FONTE UNICA deles**, o C2 foi **desbloqueado** (GET de pendentes + `cutRequestId` no envelope — ver "Detalhe — C2"), Refeicoes Modelo B ja anota a remocao do nosso stub ⏱, e as referencias cruzadas passaram a citar NOME. **Mas 3 itens nossos NAO estao na lista oficial de pendencias deles (1-20):**
> 1. **S1 — VERIFICADO NO CODIGO-FONTE (2026-07-22): a fatia 1 JA ESTA IMPLEMENTADA, mas e INVISIVEL no PRD deles** (zero ocorrencias). Existe `PATCH /professional/me/status { status: WORKING | ON_BREAK | OFF }` (ROLE_PROFESSIONAL; `UpdateProfessionalStatusUseCase`) com os gates combinados: `422 PROFESSIONAL_HAS_NO_SERVICE` (entrar em expediente sem servico, gate #31) e `409 PROFESSIONAL_HAS_ACTIVE_ATTENDANCES` (ficar OFF com atendimento/fila). O status volta como **`work_status`** no `ProfessionalQuickCreateResponse` (mesmo DTO do `GET /professional/me`). **Pelos javadocs: fatia 1 = persistir/expor; fatia 2 = derivar o `open_status` (+ expor no `professionals-with-queue`, que hoje NAO traz o status); fatia 3 = "fechar fila"/drenar.** Pedidos: (a) **documentar a fatia 1 no PRD** (hoje so o codigo sabe que existe); (b) **listar as fatias 2-3 na FONTE UNICA** — sao o nosso TOPO.
> 2. **S9 (listar TODOS os profissionais) · S10 (status REMOVIDO) · S11 (ETA −10min)** — a nota de numeracao deles ate RECONHECE que "os S9/S10/S11 do Partner sao outros itens", mas **nenhum dos tres esta na tabela de pendencias**. Reconhecer nao e listar. **Pedido: incorporar os tres.**
> 3. **TROCA `/swap-offers` (fila viva, nao-dirigida):** a nota de reconciliacao deles (2026-07-07) diz que o item foi *"substituido pela spec INTENTION"* — **STALE**: em **2026-07-15 partner+client fecharam que a TROCA e item PROPRIO** (1-por-1 bidirecional na fila viva, partner passivo), distinto da INTENTION (agendamento) E do `#42 /swap-requests` dirigido ja entregue. O PRD do client registra textualmente *"o INTENTION nao substitui a troca"*. **Pedido: reabrir o item com o nome "troca como oferta aberta /swap-offers".**
>
> *(Informativo, dono = client: os docs do client sao de 2026-07-19 e ainda nao registram a fatia 3 do C2, o envelope corrigido nem o Brevo/SMTP.)*

> 🆕 **Lote de feedback Andre 2026-07-14 (seguranca de fechamento + fila).** (a) **BUG1 EVOLUIU** — a loja **nao pode "dormir aberta"**: agora **HA auto-fechamento**, porem com **carencia de 15min + prompt** (ver "Detalhe — BUG1", nota 2026-07-14 que **supersede** o "NAO auto-fechar" de 2026-07-04). (b) Gate de entrada fora do horario (BUG1) ganha **timeout de decisao → auto-nega** o cliente (prioridade = comportamento normal da loja). (c) Novo **S10 — status REMOVIDO** (profissional retira da fila, distinto de CANCELADO = cliente desiste). (d) Novo **S11 — ETA com buffer de −10min** (regra global, mesmo numero no client e no partner). (e) **Horas vagas ao cliente = JANELA** (nao slots) — ver nota no S2 e no HANDOFF_CLIENT.

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

> 🟡 **UI STUBS "em breve" (estrategia Andre 2026-07-12).** Onde o front tem UI mas o backend ainda nao, a tela **ja fica pronta** e o clique dispara **"Em breve"** (helper `src/components/comingSoon.ts`). **Ao backend entregar, so conectar** (cada componente tem comentario `// Ao ligar: <endpoint>`); esses stubs saem desta lista. Ja stubados: ~~**S1**~~ **pills de Status ✅ LIGADAS em 2026-07-22 (fatia 1)** — do S1 so resta stub o **"Fechar fila"** (fatia 3), ~~**S3** (`d93aefb`)~~ **stub REMOVIDO em 2026-07-20 junto com a secao de refeicoes da fila** (ver a linha do S3), **S4** (`dae6221` — ✅ ja ligado, backend entregou), **S5** (`ba41a6c`), ~~**S7** (`94c92ab`)~~ **✅ ligado em 2026-07-20** (fatia 1 entregue; resta o envio real via S8). *Nao stubados (e por que): S2/S6 = front do CLIENTE; S8 = infra sem UI; S9 = precisa do dado real (nao e botao).*

---

## BUGs (abertos)

| # | Item | Status backend | O que o backend precisa fazer | O que o front faz depois |
|---|------|----------------|-------------------------------|--------------------------|
| BUG1 | Fechamento seguro (prompt + carencia 15min → **auto-fecha**) + gate de entrada fora do horario | 🧪 sera testado + ⬜ **auto-fecha e novo** (2026-07-14) | Ver **"Detalhe — BUG1"** abaixo. Resumo: (1) **loja nao dorme aberta** — prompt "quer fechar?"; sem resposta em **15min** (timer **server-side**) ⇒ **auto-`indisponivel`**; (2) bloquear NOVAS entradas na fila fora do horario/apos "parar novos"; (3) **"solicitar corte"** fora do horario / fila cheia = pedido sob aprovacao **com validade de 5min → auto-nega** se o pro nao confirmar; (4) `is_open` efetivo + `opening/closing` na listagem. **Encadeamento** (fim-do-ultimo + closing_time → popup fechar → fecha fila → fecha loja; 15min = fallback) — ver "Detalhe — BUG1". | Prompt de fechar + countdown (consome o timer do backend); tratar o gate; dashboard mostra "fechado p/ novos". Front so **avisa/prompt** — a garantia (timer + gate) e do backend (celular dorme). |
| ~~BUG2~~ | **Apelido (nickname) nao volta no `GET /professional/me`** | ✅ **RESOLVIDO pelo backend (2026-07-20)** — o `/professional/me` passa a projetar o `nickname`. | — | ✅ **Front ajustado (2026-07-20):** a **mitigacao local foi REMOVIDA** (o `updateNickname` reescrevia o valor no estado apos o `fetchMe`, para o apelido nao "sumir"). Agora o **backend e a fonte da verdade**, inclusive ao limpar. Manter a mitigacao mascararia uma regressao da projecao. |

## Pendencias / features (S — abertas)

| # | Item | Status backend | O que o backend precisa fazer | O que o front faz depois |
|---|------|----------------|-------------------------------|--------------------------|
| S1 | **Status do profissional → `open_status` derivado** (modelo acordado 2026-07-09) | 🟡 **fatia 1 ENTREGUE no codigo (verificado 2026-07-22; NAO documentada no PRD deles)** — faltam fatia 2 (open_status derivado + status no `professionals-with-queue`) e fatia 3 ("fechar fila"/drenar) | Profissional muda o **proprio** status (`trabalhando`/`intervalo`/`indisponivel`); `open_status` **derivado/read-only** = `∃ prof ∈ {trabalhando, intervalo}`. + flag **`aceitandoNovos`** ("fechar fila": drena e **auto-`indisponivel`** no fim). + **rotulo do cliente** derivado (DISPONIVEL/ENCERRANDO/INDISPONIVEL). `PATCH /professional/me/status`; recalculo atomico + evento. | 🟡 **UI STUB PRONTA** — **desde 2026-07-20 mora no MENU "Opcoes da fila"** (`src/components/ProfessionalMenu.tsx`), secao **AGORA**: linha **"Status"** com pills Trabalhando/Intervalo/**Fora** + linha **"Fechar fila"**. *(O componente `ProfessionalStatusControl`, que ficava no topo da fila, foi REMOVIDO — a fila enxugou e as acoes viraram itens de menu.)* Ja real: "Fora" **nao dispara** quando ha atendimento/fila. ✅ **PILLS LIGADAS NO FRONT (2026-07-22):** `updateMyStatus` no store (PATCH + fetchMe re-le o `work_status`), pills refletem o status real, no-op na pill ativa, 422/409 traduzidos; "Fora" segue bloqueado na UI com fila (409 como rede). **"Fechar fila" segue `comingSoon`** (fatia 3). Agendar no card do `indisponivel` liga ao S2/calendario. |
| S2 | **Intencao de atendimento → promocao automatica a fila** | ⬜ aberto — **spec 2026-07-05, modelo de encaixe fechado 2026-07-14** (ver "Detalhe — S2" abaixo) | Novo status **INTENTION**: criado com `desiredTime`, **congela num estimado realista** (encaixa a duracao entre os ja congelados, **protegido por ordem de criacao**), fica **fora da fila** e e **promovido a `SCHEDULED`** quando o **fim da fila cruza o horario**; **piso** no `desiredTime` (`desiredTime >= projectedQueueEnd`). Encaixe validado no create/edit (nao cruza bloco congelado, nao empurra anteriores). Ver detalhe. | Client: **barra de encaixe** (particao de disco) p/ agendar (`design/agendamento-barra.html`). Partner: reflete quando a INTENTION vira `SCHEDULED` na fila (ja consome `professionals-with-queue`). |
| S3 | Refeicoes Modelo B (janela flexivel) | ⬜ aberto | Placement da refeicao no 1o buraco dentro de `[alvo−adiant, min(proxRefeicao−3h, fechamento−dur)]` + **auto-supressao** (3h/fechamento) no ETA meal-aware + "iniciar = proxima nao suprimida". Ja existem: `skip` (#41), ETA meal-aware, "atender encerra a refeicao ativa". | ⚠️ **O STUB ⏱ FOI REMOVIDO (2026-07-20).** Ele vivia na secao "Refeicoes" da fila, que **saiu da tela** no redesign (a fila enxugou; refeicoes foram p/ o menu). Hoje o front tem: item **"Refeicoes"** no menu com **contagem regressiva** (acende 30min antes) → leva a `meals.tsx`, onde editar horario/duracao ja funciona. **Ao entregar:** recriar a acao **adiantar/adiar** (sugestao: dentro de `meals.tsx` ou como acao do proprio item do menu, nao de volta na fila) chamando o placement do backend; + "almoco iniciado as HH:MM" (`actualStartTime`). |
| S4 | Promover cliente ao 1o lugar (reordenar a fila) | ⬜ aberto (gap real, confirmado 2026-07-04) | `PATCH /attendances/{id}/promote` (move ao indice 0, empurra os demais). Obs.: `start` ja atende **qualquer** id SCHEDULED/LATE fora de ordem; falta so o "promover ao topo sem atender". | 🟡 **UI STUB PRONTA** ("em breve", `dae6221`): botao "Promover ao topo" nos cards fora do 1o lugar (distinto do "Adiantar", que ja atende fora de ordem via `start`). **Ao entregar:** chamar `PATCH /attendances/{id}/promote`. |
| S5 | Expediente (inicio/fim) nos relatorios | ⬜ aberto | Registrar eventos reais de abrir/fechar (timestamp) ou expor a janela `opening/closing` + eventos num endpoint de relatorio. Ligado ao BUG1 e ao S1 (o 1o `trabalhando` / ultimo `indisponivel` marcam inicio/fim). | 🟡 **UI STUB PRONTA** ("em breve", `ba41a6c`): `ExpedienteCard` (placeholder `--:-- – --:--` + selo EM BREVE) nos relatorios do dono e do profissional. **Ao entregar:** trocar o placeholder pelos horarios reais. |
| S6 | **Cliente adiciona servico a um attendance ja na fila** | ⬜ aberto (pedido 2026-07-04) | Endpoint para **acrescentar** service item(s) a um attendance **existente** (cliente ja na fila decide somar servico) que **recalcula** duracao estimada + total e reflete na fila do profissional. Ex.: `PATCH /attendances/{id}/service-items` (add). | Lado client (HANDOFF_CLIENT): botao "adicionar servico" na tela do atendimento em fila. Partner: o card da fila ja mostra os servicos — reflete sozinho o recalculo. |
| S7 | "Esqueci minha senha" (reset por e-mail) | 🟡 **fatia 1 ENTREGUE (2026-07-20)** — o restante depende do S8 (SMTP) | Fluxo publico `POST /auth/forgot-password {email}` + `POST /auth/reset-password {token,newPassword}`. | ✅ **FRONT LIGADO (2026-07-20):** tela `(auth)/forgot-password` (e-mail → codigo 6 digitos + nova senha) + store `forgotPassword`/`resetPassword`; erros traduzidos. ⚠️ **Falta o S8 (SMTP)** p/ o e-mail chegar de verdade — sem `MAIL_PROVIDER=smtp` o codigo so sai no LOG do servidor (QA em staging exige configurar o SMTP ou ler o log). Link "Esqueci minha senha" no login. **Ao entregar:** navegar p/ tela de pedir e-mail (`POST /auth/forgot-password`) + tela de nova senha (`reset-password`). | *(O backend chama este item de **S5**; ver a nota de aliases no topo — chavear por NOME, nao por numero.)*
| S8 | Notificacao por e-mail / infra SMTP | 🔧 **Brevo configurado (2026-07-22) — falta testar** (e o #1 da lista deles) | Integrar provedor (SMTP/SendGrid/SES) — infra nova. Habilita o S7 e avisos por e-mail. | Consome quando existir. |
| S9 | **Listar TODOS os profissionais do estabelecimento (incl. sem servico)** | ⬜ aberto (pedido 2026-07-09) | Hoje so existe `professionals-with-queue`, que **esconde** profissional sem servico (#31). Falta um `GET /establishment/{id}/professionals` (ou count) que retorne **todos os vinculados**, com flag/contagem de servicos. | Desbloqueia o checklist de prontidao a **separar** "1+ profissional vinculado" de "1+ com servico" (hoje colapsados num item) e o owner ver o profissional recem-vinculado que ainda nao cadastrou servico. |
| S10 | **Status REMOVIDO (profissional retira da fila) — distinto de CANCELADO (cliente desiste)** | ⬜ **novo — pedido 2026-07-14** | Hoje ha um caminho de remocao (`DELETE /professional-queue/{id}/remove`), mas o status resultante nao diferencia **quem** agiu. Andre quer **dois status distintos**: **`CANCELLED`** = o **proprio cliente** desistiu/cancelou; **`REMOVED`** (rotulo PT **REMOVIDO**) = o **profissional** tirou o cliente da fila. Alem disso, o **auto-nega** do gate fora do horario (BUG1) precisa de rotulo proprio: sugerido **`REFUSED`/RECUSADO** (cliente **nem entrou** — decidir se reusa REMOVED ou ganha status proprio; **Andre ainda vai bater o martelo**). Refletir o novo status nos read-models (partner + client) e no WS `/user/queue/notifications`. **Sem escalonamento (Andre 2026-07-14):** o profissional pode **atrasar (LATE) quantas vezes quiser** (sem teto) e **Remover a qualquer momento** — `DELETE .../remove` (→ REMOVED) **nao exige** que o cliente esteja LATE antes. A UI do partner **dropa o "no-show" gated**; a acao de tirar o cliente e so **Remover**. (Se o backend quiser manter strike/no-show interno, tudo bem — mas nao gatear o Remover por LATE.) | Partner: card enxuto — ⋮ com **Nao chegou** (atrasa, ilimitado) e **Remover** (qualquer hora). Rotulo certo no card / historico. Client (HANDOFF_CLIENT C9): mensagem distinta "voce cancelou" vs "o estabelecimento removeu voce" vs "pedido recusado". |
| S11 | **ETA com buffer de −10min (regra global)** | ⬜ **novo — pedido 2026-07-14** | O **tempo de espera exibido** deve ser o ETA calculado **menos 10min** (piso 0), para o cliente **chegar antes**. Andre decidiu que e **regra GLOBAL**: o **backend calcula** o ETA ja com o buffer e **client e partner exibem o mesmo numero** — nada de cada front subtrair por conta (evita divergencia). Definir se o buffer entra no valor exposto do read-model ou num campo separado (`display_wait` vs `raw_eta`). | Ambos os fronts so **exibem** o valor que vier do backend (partner e client). Sem logica de buffer no front. |

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

> ⚠️ **UPDATE Andre 2026-07-14 — SUPERSEDE o "NAO auto-fechar" abaixo.** A loja **nao pode "dormir aberta"**. O modelo agora e **prompt + carencia, com auto-fechamento como backstop**:
> 1. **O profissional deve SINALIZAR** se fecha ou nao. O caminho preferido continua **manual com confirmacao** (fecha na hora se ele confirmar).
> 2. **Prompt "quer fechar?"** disparado em dois momentos: (a) ao **finalizar um atendimento** apos o `closing_time` (ex.: fecha 20:00, termina 20:15 → pergunta); (b) ao **passar do `closing_time`** com a loja ainda aberta.
> 3. **Se ele NAO sinalizar** (ignora / sai da tela): **timer server-side de 15min** → **auto-`indisponivel`** (auto-fecha; se for o ultimo, `open_status` derivado cai p/ fechado). **O timer e do BACKEND** — nao pode ser `setTimeout` no app (o celular dorme e a loja ficaria aberta). O front so exibe o countdown e o prompt.
> 4. **Gate fora do horario / fila cheia — pedido de corte com validade de 5min (Andre 2026-07-14):** quando **todos os horarios ja estao cheios** (ou fora do horario) e um cliente **quer cortar**, o profissional recebe uma **notificacao com VALIDADE** de que alguem deseja ser atendido. **Se ele nao confirmar em ate 5 minutos, a solicitacao EXPIRA** (auto-negada). O cliente so entra se o profissional der **aceite explicito (TRUE)** dentro dos 5min — prioridade = seguir o comportamento normal da loja (fechada p/ novos). *(O gate padrao fora do horario segue a mesma logica de timeout → auto-nega.)*
>
> 5. **Encadeamento (Andre 2026-07-14 — "uma funcao chama a outra"):** as regras se encadeiam, nao sao independentes:
>    - **(a) Fim do ultimo corte + passou do `closing_time`** ⇒ **popup pergunta se quer fechar a loja**. Se ele confirmar: a **fila se fecha** (`aceitandoNovos=false`) e, como nao ha mais ninguem, o **estabelecimento fica `fechado` logo em seguida** (open_status derivado cai — ver S1).
>    - **(b) Se ele NAO sinalizar** (nem fecha nem "encerra a fila" sendo o ultimo do estabelecimento): **timer de 15min** ⇒ **auto-fecha** (auto-`indisponivel` → estabelecimento fechado). O 15min e o backstop do (a) quando o profissional ignora o popup.
>    - Ou seja: **fim-do-atendimento → (checa horario) → popup-fechar → fecha-fila → fecha-estabelecimento**, com o **timer de 15min como fallback** se a cadeia nao for confirmada.
>
> ✅ **DESALINHAMENTO RESOLVIDO (auditoria 2026-07-22).** O backend **reconciliou**: o **auto-fechamento (prompt + carencia 15min) e o item #2 da FONTE UNICA deles** ("decisao Andre 2026-07-14, reconciliada 2026-07-20") e a secao do `is_open` foi corrigida. *Residuo textual apontado a eles: a secao do `IntentionPromotionScheduler` (~l.1680 do PRD deles) ainda justifica os `@Scheduled` dormentes com "a decisao NAO auto-fechar" — contradiz o proprio item #2; so texto, nao muda prioridade.*
>
> O resto das regras abaixo (bloquear novos apos o horario, `is_open` efetivo, `closing_time` = fonte da verdade) **permanece**. A unica reversao e: **antes** "nunca auto-fecha"; **agora** "auto-fecha em 15min se o profissional nao sinalizar". Reaproveita a mecanica de **auto-`indisponivel`** ja descrita no S1 (so adiciona o **gatilho por horario + carencia**, alem do gatilho "fim do ultimo com `aceitandoNovos=false`").

**Decisao Andre (2026-07-04, PARCIALMENTE SUPERSEDIDA — ver update acima): NAO auto-fechar.** Fechar era **sempre acao manual com CONFIRMACAO** (owner **ou** profissional, ver S1). Regras:

1. O backend **NAO** muda `open_status` sozinho (nao auto-fecha no `closing_time`).
2. Ao chegar o `closing_time` das **configuracoes** (ou apos "parar de aceitar novos"), **bloquear NOVAS entradas na fila** — `POST /attendances` rejeita (ex.: `422 QUEUE_CLOSED_FOR_NEW_ENTRIES`). A **fila existente segue sendo atendida ate esvaziar** — nunca remover clientes.
3. Mesmo fechado p/ novos, o cliente **ainda pode "solicitar corte"**: um **pedido sob aprovacao** (o profissional aceita/recusa) — entrada nao automatica.
4. **Status efetivo:** apos o `closing_time`, `is_open` efetivo = **fechado** (nao recebe cliente nem aparece "aberto"), mesmo com `open_status` manual ainda OPEN. Expor `opening/closing` + `is_open` na **listagem** (client + partner). ✅ **ENTREGUE pelo backend e agora CONSUMIDO pelo partner (2026-07-20):** o menu deixou de dizer "ABERTA" so pelo `open_status` — quando a chave esta OPEN mas o horario venceu, mostra **"marcada como aberta, mas FORA DO HORARIO — clientes nao entram"**, que e o que o cliente de fato enxerga (e o que o gate C1 aplica).
5. Se o profissional/owner **quiser continuar atendendo** apos o horario, o app **exige confirmacao que leva a ALTERAR o `closing_time` nas configuracoes** — o horario configurado e a fonte da verdade (e alimenta os relatorios, ver S5). Nao ha "continuar aberto" solto.

Confirmado pelo backend como gap real: `updateOpenStatus` nao checa fila/horario; so existe o gate de **abrir** (>=1 profissional com servico + horario definido).

**Sugestao de produto:** separar `TEMPORARILY_CLOSED` ("parar de aceitar novos", permitido, termina a fila) de `CLOSED` total (so com fila vazia + sem `IN_PROGRESS`).

---

## Detalhe — C2 "solicitar corte" · ✅ DESBLOQUEADO pelo backend (2026-07-22) — UI do partner LIBERADA p/ implementar

Historico: fatias 1-3 entregues (criar / aceitar-recusar / auto-nega 5min) e a UI do partner ficou **bloqueada** por 2 gaps de contrato (WS sem `cutRequestId` + sem GET de pendentes). **O backend fechou os dois** — auditoria de 2026-07-22 contra o PRD deles:

1. ✅ **`GET /attendances/cut-requests`** (PROFESSIONAL, por JWT): lista os **PENDING** do profissional logado, `createdAt ASC`. Response = `CutRequestResponse[]` (`id, status, professional_id, establishment_id, client_id, service_item_ids, expires_at, created_at, resulting_attendance_id`). E o caminho de recuperacao quando o WS foi perdido (app fechado).
2. ✅ **Envelope do WS corrigido:** `cutRequestId` agora e **campo proprio** do `QueueNotification` em TODOS os eventos de corte (`CUT_REQUESTED`/`CUT_ACCEPTED`/`CUT_REFUSED`/`CUT_EXPIRED`; o `CUT_ACCEPTED` traz ambos — `attendanceId` do atendimento gerado + `cutRequestId`). Eventos nao-corte: `cutRequestId=null`. **Ler `cutRequestId`, nao `attendanceId`.**
3. ✅ **`CUT_EXPIRED`** (fatia 3): o pedido expira sozinho em 5min. Orientacao do proprio backend p/ o partner: **expirar a UI local pelo `expires_at`** ja recebido (o WS pessoal do expired vai pro CLIENTE).

**AFAZER DO FRONT-PARTNER (destravado, a implementar):** buscar o GET ao abrir a fila / voltar do background; item **"Solicitacoes"** do menu com badge = contagem real; tela/sheet com **Aceitar/Recusar** (store `acceptCutRequest`/`refuseCutRequest` ja pronta e testada, `a7895b6`); countdown local pelo `expires_at`. Servicos do pedido: resolver `service_item_ids` contra os `myServices` locais (ids do proprio profissional).

**Gap remanescente (nice-to-have, NAO bloqueia):** o `CutRequestResponse` traz so `client_id` — **sem `clientName`**. O card sai como "Cliente quer: Corte + Barba (expira em 3min)" sem o nome. Pedido: incluir `client_name` no response.

### ⭐ Proposta do Andre (2026-07-20) — solicitacao nasce como Attendance `INTENTION` · **SUPERADA (2026-07-22)**

> **Status:** o backend desbloqueou por outro caminho (GET de pendentes + `cutRequestId` no envelope, ver acima) **antes** de avaliar esta proposta — os 2 gaps que a motivavam sumiram. Fica registrada como historico; se um dia o modelo for revisitado, as 2 condicoes abaixo continuam valendo.

> **"Toda solicitacao de atendimento deve gerar um atendimento, so que com status de INTENTION, isso ja gera um id."**

Em vez de `CutRequest` ser entidade paralela invisivel, o pedido **nasce como um `Attendance`** em status `INTENTION` (ou equivalente "aguardando aprovacao"). **Resolve o gap na raiz e e melhor que (a) e (b):**
- o pedido **ja tem `id` de atendimento** → cabe no **campo `attendanceId` que o envelope `QueueNotification` JA TEM** (nenhum campo novo no WS);
- **`clientName` + `services` + `totalValue` vem de graca** (o Attendance ja os carrega) → da p/ montar o card sem inventar payload;
- o partner **ja sabe ler/renderizar Attendance**; e a listagem pode sair do **`GET /attendances` que ja existe** (filtrando o status), dispensando endpoint novo;
- aceitar/recusar viram transicoes de status do proprio atendimento (mesmo padrao de `start/finish/late/...`).

**⚠️ Duas condicoes que o backend PRECISA garantir (senao vira bug):**
1. **Nao colidir com a semantica atual de `INTENTION`.** Hoje `INTENTION` = intencao de agendamento (#40/S2), que o **`IntentionPromotionScheduler` PROMOVE SOZINHO** ~15min antes do `desiredTime`. Solicitacao de corte e o oposto: so entra com **aceite explicito do profissional** e **expira em 5min**. Sem distinguir os dois casos (sub-status, flag `requiresApproval`, ou um status proprio tipo `PENDING_APPROVAL`), o scheduler vai **promover sozinho um pedido nunca aprovado**.
2. **Nao contar na fila viva enquanto pendente.** Nao pode entrar em `waiting_list`, `queue_count` nem no ETA — senao a fila "fechada p/ novos" enche de pedido nao aprovado. E a mesma razao pela qual o `cut_request` hoje fica fora dos read-models; a regra tem de continuar valendo (o backend ja faz isso p/ as intencoes #40).

**Endpoint:** a definir com o backend (Andre: *"sobre o endpoint podemos pedir ao backend"*). O front nao tem preferencia forte — o que importa e o **id no evento** e o pedido **fora da fila viva**.

**Impacto no front se adotado:** a store atual (`acceptCutRequest`/`refuseCutRequest`, commit `a7895b6`) troca de URL, mas a UI (card do pedido + Aceitar/Recusar + dot no ☰) passa a ser direta. Baixo retrabalho.

Enquanto isso: **store pronta**; falta so ligar a exibicao + botoes Aceitar/Recusar quando um dos itens acima existir. (Fatia 3 = auto-nega por timer 5min, ja e do backend.)

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
> ✅ **Ajuste Andre 2026-07-14 (SEM a folga de 15min).** A regra e simplesmente `desiredTime >= fim projetado da fila` — o horario **exato** do fim previsto e permitido; so o **estritamente anterior** e recusado. **Sem** margem de 15min. Motivo do Andre: *"nao faz sentido o cara marcar para 17:00 e ser notificado que o corte vai comecar as 16:45"* — a folga de 15min empurraria o inicio real para antes do que o cliente pediu. (Backend ja implementado assim: `422 INTENTION_BEFORE_QUEUE_END`, definicao 2026-07-13; PRD_BACKEND alinhado.)

Nao se pode criar/editar uma INTENTION com `desiredTime` **anterior ao fim projetado da fila** (nao "do agora"): `desiredTime >= projectedQueueEnd`. Motivo: garante que a intencao e um slot **futuro e alcancavel**, e que ela nunca precisa ser promovida "ja nascendo". **Re-checar tambem na promocao**: se a fila **inchou** e o slot ja passou, decidir a regra de borda (inserir mesmo assim vs. avisar o cliente que atrasou).

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

> ⚠️ **DUAS features DISTINTAS — nao confundir** (reconciliado com PRD-Client 2026-07-15, secao "Trocar de posicao (Adiantar/Atrasar) + Agendar (Intencao)"; o erro antigo foi tratar as duas como a mesma). **`/swap-offers` NAO e mais "esboco do S2" — virou o mecanismo da TROCA (abaixo).**
> - **Agendar = INTENÇÃO (futuro)** = **ESTE S2** (`/attendances/intentions` + barra de encaixe). Horario que a fila **ainda nao alcancou** ("hoje mais tarde" / "outro dia"). Nao usa `/swap-offers`.
> - **Trocar de posicao (Adiantar/Atrasar) = TROCA na FILA VIVA** = feature **SEPARADA**, contrato **`/swap-offers`** (backend **NOVO**; o `#42`/`/swap-requests` dirigido segue em paralelo, nao atende). Troca **1-por-1 bidirecional**; o solicitante pode estar **fora da fila** (entra na vaga de quem aceita; quem aceita vai pro fim); expira **so quando o solicitante e atendido**; **nunca multa**. **O profissional NAO participa** — o **partner so REFLETE** a fila pos-troca (ja via `professionals-with-queue`/WS; **nao marca LATE**). **NAO e S2 nem S4** (S4 = o PROFISSIONAL promover ao topo — outra origem, acao do partner). Spec no PRD-Client. Ver **C13** no HANDOFF_CLIENT.
> - **Fronteira limpa:** horario que a fila ainda nao alcancou → **INTENÇÃO** (S2); furar/ceder **dentro da fila viva** → **TROCA** (`/swap-offers`).

### Encaixe de agendamento (horas vagas) — modelo fechado com Andre 2026-07-14

Fechado num vai-e-vem de design (evoluiu de "janela unica" → "mapa de cinema" → **barra de encaixe estilo particao de disco**). O modelo final do agendamento (= a UI e a semantica do S2 do lado do cliente):

**Ciclo de vida da INTENÇÃO (o "agendado" e uma intencao):**
1. **Congela num ESTIMADO REALISTA no ato de criar.** O horario mostrado ao cliente ja encaixa a **duracao do serviço escolhido** na linha do tempo das intencoes/agendados **que ja existem**. Ex.: cliente quer 17:00, mas ja ha um corte de 1h15 na frente → o estimado dele **ja nasce 18:05**. O cliente **confirma ciente de que e estimativa** (nao ha horario garantido).
2. **Protegido por ORDEM DE CRIAÇÃO.** Quem congelou **primeiro** segura o horario; intencao criada **depois** **nao empurra** as anteriores — ela so se encaixa **em volta ou depois**. Ex.: o agendado das 17:00 (que entrou 1o) nao se mexe; o de 16:50 que chega depois e que muda. **Isto e o que capa o drift** e impede "17:00 virar 20:00" (nada novo fura o congelado).
3. **Piso no horario escolhido.** Nunca e chamado **antes** do horario que pediu (17:00), mesmo se a fila esvaziar. `desiredTime >= projectedQueueEnd` (invariante ja implementada, `422 INTENTION_BEFORE_QUEUE_END`).
4. **Promoção → fila viva.** Quando o **fim da fila cruza o horario**, a intencao vira `SCHEDULED`, entra na fila viva e passa a **oscilar de leve** (a fila viva tem preferencia: um corte em andamento nunca e interrompido; empurra a intencao pra frente, dentro do razoavel). **Sem notificacao de atraso** — o cliente ja consentiu que era estimativa.

**A UI = barra de encaixe (particao de disco).** Mockup: `design/agendamento-barra.html`.
- A barra mostra **so a faixa agendavel**: comeca no **FIM DA FILA VIVA** (nao da pra agendar dentro da fila que ja roda) e vai ate o **`closing_time`**.
- Os **agendamentos ja congelados** aparecem como **blocos travados** (nao-clicaveis).
- O cliente arrasta uma **"sombra" do tamanho do seu serviço** (soma das duracoes selecionadas) e a solta num vao livre — ela **nao cruza** bloco travado. E o calculo "ultimo inicio = proximo agendado − duracao" feito visualmente.

**O que o backend precisa expor** (p/ o client desenhar a barra):
- **`projectedQueueEnd`** (inicio da faixa agendavel) + **`closing_time`** (fim) por profissional.
- A **lista dos blocos ocupados** na faixa: cada agendado/intencao ja congelado com `{ start, durationEstimada }` (nao so uma `free_window` unica — pode haver **varios** blocos e **varios** vaos entre eles).
- No `POST/PATCH /attendances/intentions`: validar o **encaixe** (a `[desiredTime, desiredTime+duracao]` nao pode cruzar bloco ja congelado; `desiredTime >= projectedQueueEnd`), congelando em **ordem de criacao** (nao desloca os anteriores). Erro dedicado se cruzar (ex.: `422 INTENTION_OVERLAP`).

Front do agendamento em si = **client** (C12/S2); o partner so **reflete** quando a intencao promove e entra em `professionals-with-queue`. Esta nota fixa o **modelo + a UI** que os dois fronts seguem.
