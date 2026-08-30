# VUPTH Front Partner — PRD (Product Requirements Document)

> Documento de comunicacao entre frontend partner e backend.
> Descreve os fluxos implementados, endpoints consumidos, formato dos requests/responses,
> e o que esta pendente no frontend.
>
> **App:** React Native 0.81 + Expo SDK 54, Gluestack UI v1, Expo Router v6
> **State:** Zustand v5 + Axios + Expo SecureStore
> **Testes:** Jest 29 + axios-mock-adapter
>
> **Ultima atualizacao:** 2026-08-27 (v19.0 — **O APP ABRE POR LINK, e o S23 saiu do papel.** (a) **A2/A3 entregues:** `expo export --platform web`, `web.output: "single"`, `public/_redirects` e deploy na **Cloudflare Pages** (Production=`main`, Preview=`dev`). (b) 🔴 **Tres defeitos empilhados ate o app abrir** — ver **A7**: CORS inexistente no backend (preflight `OPTIONS` caia em `anyRequest().authenticated()` e preflight nao leva `Authorization`, entao dava **401**, erro mudo); as **fontes descartadas** pela Cloudflare por estarem sob `node_modules`; e o `_layout` segurando a tela em `fontLoaded` sem considerar o erro. (c) ✅ **S23 ENTREGUE do nosso lado:** entra o passo **"Onde voce vai atender?"** entre o perfil e a busca — antes, quem tinha loja propria procurava na busca uma loja que ainda nao existe, sem saida. O backend nunca foi o bloqueio (auditoria de 27/08). (d) ⚠️ **`npm run build:web` contaminava tsc E eslint** com o `dist/`: `RangeError: Maximum call stack size exceeded` no primeiro e ~19.500 problemas no segundo, nenhum dos dois citando a causa. Corrigido com `exclude`/`ignores`, travado por teste. (e) **`deploy-web.yml` REMOVIDO** — a Cloudflare builda pelo Git, o workflow era um segundo pipeline e quebrava o merge. **v18.9** (2026-08-11 — **TESTE MANUAL DE 11/08 + OTA em dia.** (a) **Feito:** "Adicionar Servico" **saiu do menu do dono** e o onboarding `also-professional` passou a mandar p/ **"Meus Servicos"** (fecha a decisao de 06-28: servico e do PROFISSIONAL, e havia duas portas p/ a mesma coisa) · o **card da solicitacao de corte** passou a mostrar o servico pedido (corrigido o bug de `myServices` nao carregado, que dava "Servico nao identificado") e a **hora do pedido** (`hhmmFromIso` +testes). (b) ⚠️ **LICAO:** o item "opcao de tambem ser profissional" **voltou no teste** porque eu tinha segurado o OTA — ele testou o bundle de 07/08 e reportou de novo algo ja resolvido. **Publicar antes de cada teste manual.** (c) **Novos no backend:** **S27** (horario e UM SO p/ a semana — nao da p/ ter domingo fechado, e isso alimenta gate de fila, auto-fechamento e refeicoes) · **S26** (a solicitacao de corte nao diz PARA QUANDO) · **S23 ganhou o caso do ONBOARDING** (quem escolhe "sou profissional" cai direto em "Buscar Estabelecimento" e nunca e perguntado se quer abrir a propria loja) · **S7/S21 com prova de device** (o e-mail nao sai E a tela passa com e-mail inexistente). (d) **Client:** **C22** (exibir horario por dia) e **C23** (mensagem do esqueci-minha-senha). (e) ⚠️ **Convencao registrada, apontada pelo backend:** os numeros **#N deles** envelhecem a cada renumeracao — **citar por NOME**; os nossos **S**/**C** sao estaveis. (f) Checklist de QA de device em `src/docs/QA_MIGRACAO.md`. **v18.8** — **A PENDENCIA PASSA A MOSTRAR A SAIDA + batch 8 da migracao.** (a) Feedback do Andre — *"a intencao e sempre levar o usuario a um caminho, neste caso a solucao"*: a pendencia **"1+ profissional com servico"** levava a um formulario que criava o perfil do **proprio dono** sem dizer isso, sob o titulo "Adicionar Profissional"; agora a tela abre com **"Quem vai atender?"** e tres caminhos nomeados (eu tambem vou atender · convidar · ver solicitacoes), o formulario so abre depois da escolha, e o alerta de sucesso **encadeia** o passo seguinte ("Cadastrar servicos" — criar o perfil ainda nao destrava a loja). Fechada tambem a **divergencia de portas**: o menu mandava o dono nao-profissional p/ o onboarding `also-professional` e o checklist p/ `add-professional`. (b) **Batch 8** da migracao: `queue-options`, `settings` e `add-professional` (restam 28 arquivos). ⚠️ **Jest NAO rodou** depois destas mudancas (o gate roda no push). **v18.7** — **BRANCH UNICA + 4 ENTREGAS NO MESMO OTA + O QA DA MIGRACAO NO AR.** (a) **A divisao em duas branches acabou** (decisao do Andre): a `dev` foi **mergeada** na `chore/gluestack-update` (`6804bf9`) e tudo passou a viver la — migracao, badge, fix de WS. (b) **Entregue e publicado num OTA so** (`"migracao + badge + diagnostico ws"`): **badge com contagem 1..9+** no menu da fila (o dot mudo nao dava conta de um pedido que expira em 5min) · **rodape volta a ser so "Iniciar proximo"** (o nome do cliente saiu do botao e da dica; ele ja esta no card com o selo "Proximo") · **heartbeat DECLARADO** no `useQueueSocket` (10s/10s espelhando o `HEARTBEAT_MS` do backend — antes funcionava pelo *default* da lib, que muda calado) · **diagnostico de WS em Configuracoes** (`wsDiagnostics.store` + `WsDiagnostics`, espelhando os canais e os nomes do store do client para o A/B valer; existe porque os logs sao gated por `__DEV__` e o QA roda em bundle de producao). (c) **S17 FECHADO dos dois lados** — o backend ligou o heartbeat e confirmou no Render. (d) **Plano de teste de WS deles ACEITO com uma correcao aceita por eles:** o A/B tem **tres** variaveis, nao duas — falta a renovacao de token, que so o partner tem; logo o teste do token expirado **nao absolve o S14** se o partner passar. (e) 🆕 **S25** — lendo os docs do client (GPS encerrado la em 06/08), achamos que o **geocoding e silencioso**: o partner nunca envia coordenadas, e endereco que falha na conversao deixa a loja **invisivel na busca por proximidade** sem ninguem saber. (f) **Intencoes separadas do backlog** a pedido do Andre: foto de perfil e modo fila-vs-agenda **nao sao para codar**. **v18.6 (2026-08-05)** — **FEEDBACK DE DEVICE (5 itens), so registro: 1 e nosso, 4 estao bloqueados por contrato.** Ver "Feedback de device 2026-08-05" na secao 10. (1) 🔴 **solicitacao de corte nao aparece** — o partner consome o fluxo, mas o unico aviso na Fila e um **dot de 12px no ☰** e o pedido **expira em 5min**: virou o **item #1** da lista priorizada (banner na propria Fila com countdown e Aceitar/Recusar). As outras duas hipoteses do sumico (pedido nunca criado / ja expirado) sao de backend/client — callout de 2026-08-05 no HANDOFF_BACKEND + **C19** no HANDOFF_CLIENT. (2) **receita liquida do profissional** → **S18**: hoje so o `clientPrice` e persistido (o acordado e a absorcao **nunca sao gravados**), entao o front nao tem como derivar o liquido. (3) **apagar a conta** → **S19**: nao existe endpoint (e e exigencia de loja/LGPD). (4) **tipo de loja imutavel** → **S20**: `serviceType` so entra no quick-create; o `general-infos` nao aceita. (5) **"esqueci minha senha" sem anti-enumeracao** → **S21**: backend passa a devolver `404 EMAIL_NOT_FOUND`; trade-off de enumeracao registrado, decisao do Andre mantida, mitigar com rate limit. **v18.5 (2026-08-01)** — **INFRA DE TEMPO REAL: token fresco no socket + volta do background.** Estudo das tres pontas (partner, client, backend) a pedido do Andre; achados registrados no HANDOFF_BACKEND (**S14** auth do CONNECT, **S15** push/Expo, **S16** broker em memoria, **S17** heartbeat) e no HANDOFF_CLIENT (**C16/C17/C18**). **Corrigido no partner:** (1) o `connectHeaders` do STOMP era montado **uma vez** no mount, e como o access token dura **1h** e o `reconnectDelay` reconecta sozinho, toda reconexao depois da 1a hora subia com token vencido — e o backend, ao receber token invalido, **conecta como ANONIMO em vez de recusar**, entao o app ficava "conectado" e o `/user/queue/notifications` **secava para sempre**, sem erro em ponta nenhuma (o topico publico da fila continuava chegando, o que mascarava tudo). Agora o token e lido no **`beforeConnect`** (roda em TODA tentativa) e renovado antes se estiver expirado ou dentro da margem de 2min — decisao em `src/lib/socketAuth.ts` (`needsRefresh`, funcao pura +testes). (2) **`AppState`**: ao voltar para `active`, invalida as queries de fila e reativa o socket se ele nao estiver conectado (o Android suspende o processo e o socket morre SEM evento). ⚠️ **Isto ENCURTA a janela, nao fecha o buraco** — enquanto o backend aceitar token invalido como sessao anonima (S14) e nao ligar o heartbeat (S17, `heart-beat:0,0` medido no device 2026-08-01), o socket ainda pode virar zumbi sem ninguem perceber. **v18.4 (2026-07-25) — **`CLOSING_PROMPT` (auto-fechamento) LIGADO no partner** (resto do BUG1 do nosso lado, desbloqueado ao certificar que o backend entregou o `EstablishmentAutoCloseScheduler`): quando a loja passa do `closing_time` com o profissional em expediente, o backend fecha a fila e manda o WS **`CLOSING_PROMPT`** (com `graceUntil`). O `useQueueSocket` reconhece o evento (`isClosingPromptEvent`, `src/lib/closing.ts`) e guarda o `graceUntil` na `ui.store`; o componente **`ClosingPrompt`** (na tela da Fila) mostra o prompt "quer fechar?" com **countdown server-authoritative**, **"Fechar agora"** (`PATCH /me/status OFF`) e **"Continuar atendendo"** (dispensa; o backend poe `OFF` no fim da carencia). Fecha sozinho ao zerar. +testes (closing.ts, ui.store, ClosingPrompt RNTL). **Antes (v18.3):** **feedback de device (Andre 2026-07-25), 5 itens:** (1) 🐛 **bug do FUSO — 2a metade:** o `toApiTime` ja mandava o offset real, mas o `parseApiTime` lia o HH:MM cru; o backend NORMALIZA o OffsetTime p/ UTC e devolvia "15:00Z" p/ um almoco de 12:00 local → a UI mostrava 15:00 (+3h) e a janta era barrada "apos o horario de funcionamento". `parseApiTime` agora CONVERTE o OffsetTime de volta ao relogio local do aparelho (inverso do `toApiTime`, robusto a qualquer offset ecoado) — `src/lib/time.ts` +testes. Como o `meals.ts` (`mealSignal`/`isMealDue`) consome o `parseApiTime`, o `meals.test` (que usava `"12:00Z"` como se fosse 12:00 LOCAL) passou a fixar o `getTimezoneOffset` em UTC p/ ficar independente do fuso da maquina. ⚠️ **horarios JA SALVOS** (funcionamento da loja + refeicoes) precisam ser **RE-SALVOS** p/ regravar com o offset certo. (2) **rodape "Meu dia" → "Relatorios"** (rotulo da aba + titulo da tela; conteudo/rota `my-day.tsx` inalterados). (3) 🐛 **voltar das Configuracoes caia na Fila:** `meals.tsx` e `my-services.tsx` tinham o back HARDCODED p/ `queue`; agora o chamador passa `?from=` (settings/queue/queue-options) e o voltar retorna a ORIGEM real (Tabs href:null nao dao `router.back()` confiavel). (4) **"Fechar fila":** o estado fechado mostra so **"fila fechada para proximos clientes"** (hint enxuto). (5) **status POR PROFISSIONAL confirmado** — o 1o "Trabalhando" NAO implica os outros; dois profissionais do mesmo estabelecimento tem status independentes (loja e so DERIVADA = ∃ trabalhando; fechar fila fecha SO a sua). O partner ja e assim; a implicacao ("cliente entra na fila do prof A trabalhando OU AGENDA com o prof B que ainda nao comecou") e do **CLIENT/BACKEND** (S2/INTENTION + `availability` por profissional) — registrado no HANDOFF. **Antes (v18.2):** **"Fechar fila" LIGADO** (S1 fatia 3): o item da tela Opcoes da fila deixou de ser stub e chama `PATCH /professional/me/accepting-new` (`{value:false}` fecha/drena — quem ja esta segue; `{value:true}` reabre). Store: campo `accepting_new` + `setAcceptingNew` (+testes); a UI mostra "Fechar fila" quando aceitando e "Reabrir fila" quando drenando; fechar tem confirmacao e, sendo o ultimo, avisa que a loja fechou (auto-`OFF` derivado). **Antes (v18.1):** **feedback de device (Andre 2026-07-24), 5 itens:** (1) 🐛 **atendimento EM ANDAMENTO nao aparecia pro CLIENTE** (so ao finalizar) — cross-project, registrado no HANDOFF_CLIENT como **C14** (lado client do C3 + conferir read-model/`ATTENDANCE_STARTED` no backend; partner mostra IN_PROGRESS OK); (2) **"Abrir estabelecimento" nao funcionava** (toggle nao mudava o status) → resolvido REMOVENDO o botao; (3) **decisao: profissional NAO abre NEM fecha a loja na mao** — 100% derivado do status: fica "Trabalhando" e, sendo o primeiro, a loja abre sozinha (app AVISA "voce e o primeiro"); sendo o ultimo, fecha (app AVISA "voce era o ultimo"). SUPERA o "so ABRIR" de 2026-07-23 — o botao de estabelecimento saiu da tela Opcoes da fila; (4) **Status com affordance** — bloco proprio com pills LARGAS e "Voce esta: X · toque para trocar"; (5) **dot POR CARD em Configuracoes** — a aba tinha dot mas nao dizia ONDE; agora o dot acende no card exato (Dados cadastrais p/ apelido/especialidade, Meus servicos p/ servico, Vinculo p/ afiliacao). **Antes (v18):** **NAV v2** (mockup `design/professional-nav-v2.html`, aprovado): (a) **rodape de volta** na area do profissional — tabs **Fila · Meu dia · Configuracoes** ("a tela fica muito vazia" sem ele), com **dot** na aba Configuracoes quando ha pendencia de cadastro; (b) o banco no header da Fila deixa de abrir modal e **NAVEGA para a tela cheia "Opcoes da fila"** (`queue-options.tsx` + `src/components/QueueOptions.tsx`, "mais amigavel a tela inteira"), que so tem **ACOES DO DIA** (Status semaforo 🟢🟡🔴 / Abrir estabelecimento / Fechar fila stub / Solicitacoes / Refeicoes / Adicionar cliente) — **sem duplicar o rodape** (`ProfessionalMenu` REMOVIDO); (c) decisao: profissional **so ABRE** a loja, **nao fecha** (fechar mataria a fila dos colegas; o fim natural e o auto-fechamento S1); loja aberta DENTRO do horario nao mostra nada, FORA do horario mostra so o aviso "clientes nao entram"; (d) **Configuracoes dividida** em menu de cards → sub-telas `settings-account` (nome/apelido/e-mail/senha) e `settings-vinculo` (convites + buscar/desafiliar), com Meus servicos, Refeicoes (o liga/desliga do aviso MIGROU para `meals.tsx`), **Area do dono** (dual-role) e **Sair** morando no menu de Configuracoes; badge no card Vinculo quando ha convite pendente. Tambem em 2026-07-23: **fix de FUSO** — `toApiTime` enviava hora local rotulada "Z" (UTC), deslocando janelas de funcionamento/refeicoes em −3h (raiz do BUG2 "janta 18:00 barrando as 18:30" e do "aberto as 6:30"); agora envia o offset real do aparelho (`deviceOffsetSuffix`). Registros antigos precisam ser RE-SALVOS. **Antes (v17):** **S1 fatia 1 e C2 LIGADOS no front**: pills de **Status** do menu chamam `PATCH /professional/me/status` (WORKING/ON_BREAK/OFF, gates 422/409, no-op na pill ativa; "Fechar fila" segue stub — fatia 3) e a **UI de Solicitacoes de corte** esta completa (GET de pendentes + modal Aceitar/Recusar + countdown + badge/dot). Fruto da **auditoria cruzada de 2026-07-22** (S1 fatia 1 existia no CODIGO do backend sem constar no PRD deles; C2 desbloqueado com GET + `cutRequestId` no envelope). Cobrancas remanescentes ao backend no HANDOFF (S1 fatias 2-3, S9/S10/S11, TROCA, clientName no CutRequestResponse). **Antes (v16):** **"Esqueci minha senha" LIGADO** (S7 fatia 1): tela `(auth)/forgot-password` em 2 passos (e-mail → codigo de 6 digitos + nova senha), store `forgotPassword`/`resetPassword` (+testes), erros `RESET_CODE_INVALID/EXPIRED` traduzidos; o link do login deixou de ser stub. ⚠️ **Envio REAL do e-mail depende do SMTP (S8)** — sem `MAIL_PROVIDER=smtp` o codigo so aparece no LOG do servidor (implicacao de QA em staging). **Antes (v15):** **refeicao avisa SEM intromissao**: o item do menu ganha **contagem regressiva** ("em N min") e o popup ganha **"Nao ver mais"** (preferencia persistida, reversivel em Configuracoes > Refeicoes). **Antes (v14):** **o menu vira "Opcoes da fila"**: gatilho passa de ☰ para o **icone de BANCO**, conteudo reagrupado por uso DIARIO (Agora/Hoje/Acompanhar) com Configuracoes+Sair no rodape e "‹" para fechar; a **Fila enxuga** (Status, Refeicoes e Adicionar Cliente migram p/ o menu, fica so a faixa da refeicao em andamento); `ProfessionalStatusControl` removido; "Meus servicos" vai p/ Configuracoes; **refeicao passa a sinalizar 30min ANTES** do horario (`mealPhase` "proxima"/"agora", com o texto acompanhando a fase). Ver "Feedback 2026-07-20 (parte 2)". **Antes (v13, 2026-07-18):** **redesign da fila do profissional + menu ☰** (secao "Feedback 2026-07-18"): (a) **tab bar REMOVIDA** da area do profissional; a navegacao vai para um **menu ☰ no cabecalho** (`ProfessionalMenu`) que tambem traz **Abrir/Fechar estabelecimento** e **dot** (refeicao na janela / pendencia de cadastro); (b) fila reorganizada — **metricas viram chips**, **card do cliente INTEIRO clicavel** (kebab ⋮ removido), **"Iniciar proximo" fixo no rodape** (unico start, sempre no 1o) e **card "Atendendo agora"** no topo com Pausar/Finalizar/Retomar; (c) ligadas as entregas do backend: **S4 promover ao topo** (`/promote`) e a **camada de store do "solicitar corte"** (C2 — UI bloqueada, ver HANDOFF "Detalhe — C2"); (d) fix: checklist/faixa do dono passam a usar o **GET fresco**. Mockups: `design/queue-layout-options.html`, `design/queue-layout-combined.html`, `design/queue-menu-dropdown.html`. **Antes (v12, 2026-07-14):** **sessao de design (seguranca de fechamento + fila + agendamento)**, ver "Feedback 2026-07-14" na secao 10: (a) **fechamento seguro** — BUG1 evoluiu, a loja NAO pode dormir aberta → prompt + auto-close 15min server-side (supersede "NAO auto-fechar"); (b) **agendamento fechado** = INTENÇÃO congelada em ordem de criacao + **barra de encaixe estilo particao** (secao 12 reescrita; slots descartados); (c) front-only prontos p/ codar: **card da fila enxuto** (Iniciar so no 1o, resto no ⋮) + **modal ⓘ "fechar fila"**; (d) handoffs com **S10 REMOVIDO**, **S11 ETA −10min**. Mockups em `design/` (`card-fila-enxuto`, `agendamento-barra`, `availability-options`). **Antes (v11, 2026-07-12):** UI STUBS "em breve" p/ features backend-pending; **(v10, 2026-07-11):** prontidao faixa+checklist+dot; cobertura 97/84 (234 testes))

---

## Indice

1. [Visao Geral dos Fluxos](#1-visao-geral-dos-fluxos)
2. [Endpoints Consumidos — Status](#2-endpoints-consumidos--status)
3. [Fluxo 1 — Owner Solo Shop](#3-fluxo-1--owner-solo-shop)
4. [Fluxo 2 — Professional](#4-fluxo-2--professional)
5. [Stores Implementados](#5-stores-implementados)
6. [Telas Implementadas](#6-telas-implementadas)
7. [Formato dos Tokens e Refresh](#7-formato-dos-tokens-e-refresh)
8. [Enums da API](#8-enums-da-api)
9. [Testes E2E — Maestro](#9-testes-e2e--maestro)
10. [Pendente de Implementacao](#10-pendente-de-implementacao)
11. [Handoffs + alinhamento com o backend](#11-handoffs--alinhamento-com-o-backend) · handoffs em [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) e [`HANDOFF_CLIENT.md`](./HANDOFF_CLIENT.md)
12. [Features Futuras (Planejamento)](#12-features-futuras-planejamento)
13. [Redesign — EM IMPLEMENTACAO na dev](#13-redesign--em-implementacao-na-dev-consolidado-2026-06-17)
14. [Build, Distribuicao e Anti-quebra (DevOps)](#14-build-distribuicao-e-anti-quebra-devops--configurado-2026-06-23)

---

## 1. Visao Geral dos Fluxos

O app partner suporta dois perfis de usuario:

### Owner (dono de estabelecimento)
```
Register → Login → Quick-create establishment → Refresh token
→ Quick-create professional (a si mesmo) → Refresh token
→ Adicionar servicos → Dashboard (toggle aberto/fechado)
```

### Professional (profissional independente)
```
Register → Login → Register professional (sem establishment) → Refresh token
→ Buscar establishment por nome → Selecionar → Afiliar-se
→ Tabs: Fila (gerenciamento) | Servicos (CRUD + pricing) | Perfil (menu)
```

---

## 2. Endpoints Consumidos — Status

| Endpoint | Metodo | Fluxo | Status Frontend | Testes |
|----------|--------|-------|-----------------|--------|
| `/auth/register` | POST | Ambos | Implementado | 14 |
| `/auth/login` | POST | Ambos | Implementado | 14 |
| `/auth/refresh` | POST | Ambos | Implementado | 14 |
| `/auth/forgot-password` | POST | Ambos (publico) | Implementado (S7 fatia 1) | — |
| `/auth/reset-password` | POST | Ambos (publico) | Implementado (S7 fatia 1) | — |
| `/auth/logout` | POST | Ambos | Implementado | 14 |
| `/establishment/quick-create` | POST | Owner | Implementado | 2 |
| `/establishment/{id}/open-status` | PATCH | Owner | Implementado | 2 |
| `/professional/quick-create` | POST | Owner | Implementado | 2 |
| `/establishment/{id}/service-items` | POST | Owner | Implementado | 1 |
| `/establishment?name=X` | GET | Professional | Implementado | 2 |
| `/professional/register` | POST | Professional | Implementado | 2 |
| `/professional/me/affiliations` | POST | Professional | Implementado | — |
| `/establishment/id/{id}/professionals-with-queue` | GET | Owner | Implementado | 2 |
| `/attendances/{id}/start` | PATCH | Professional | Implementado | 2 |
| `/attendances/{id}/finish` | PATCH | Professional | Implementado | 2 |
| `/attendances/{id}/pause` | PATCH | Professional | Implementado | 1 |
| `/attendances/{id}/resume` | PATCH | Professional | Implementado | 2 |
| `/attendances/{id}/promote` | PATCH | Professional | Implementado (S4, 2026-07-18) | — |
| `/professional/me/status` | PATCH | Professional | Implementado (S1 fatia 1, 2026-07-22) | — |
| `/attendances/cut-requests` | GET | Professional | Implementado (C2, 2026-07-22) | — |
| `/attendances/cut-requests/{id}/accept` | PATCH | Professional | Implementado (C2, 2026-07-22) | — |
| `/attendances/cut-requests/{id}/refuse` | PATCH | Professional | Implementado (C2, 2026-07-22) | — |
| `/professional-queue/{id}/remove` | DELETE | Professional | Implementado | 1 |
| `/professional/{id}/service-items` | GET | Professional | Implementado | — |
| `/client-queue/{profId}/queue` | GET | Publico | Implementado | 2 |
| `/professional-queue/add-quest-attendance` | POST | Professional | Implementado | 2 |
| `/attendances` | GET | Ambos | Implementado | 3 |
| `/establishment/{id}/affiliations` | GET | Owner | Implementado | — |
| `/affiliations/{id}/accept` | PATCH | Owner | Implementado | — |
| `/affiliations/{id}/reject` | PATCH | Owner | Implementado | — |
| `/professional/me` | GET | Professional | Implementado | — |
| `/establishment/mine` | GET | Owner | Implementado | — |
| `/professional/me/affiliations` | GET | Professional | Implementado | — |
| `/professional/me/establishment` | DELETE | Professional | Implementado | — |
| `/professional/affiliate` | POST | Professional | Implementado | — |
| `/professional-queue/{profId}/add-service-items` | POST | Professional | Implementado | — |
| `/establishment/{id}/professionals` | POST | Owner | Backend existe (front pendente — convite, ver #6) | — |
| `/api/v1/professionals/{id}/intervals/**` | GET/POST/PATCH/DELETE | Professional | Implementado (#14: store + telas) | — |
| `/establishment/{id}/general-infos` | PATCH | Owner | Implementado (nome + horario opening/closing) | 2 |
| `/attendances/{id}/cancel` | PUT | Client | Backend existe (lado cliente) | — |
| `/profile/general-infos` | PATCH | Client | Backend existe (first/last name; front so com #16) | — |
| `/establishments/{id}/addresses` | POST | Owner | Implementado (frontend pronto) | — |
| `/users/me/addresses` | POST | Client | **FUTURO** | — |

---

## 3. Fluxo 1 — Owner Solo Shop

### Arquitetura de navegacao (owner)
```
(owner)/_layout.tsx              → Stack (root)
  (owner)/(tabs)/_layout.tsx     → Tabs (dashboard + menu)
    (owner)/(tabs)/dashboard.tsx   → Tab visivel
    (owner)/(tabs)/menu.tsx        → Tab visivel
    (owner)/(tabs)/add-professional.tsx  → href: null (tab bar visivel)
    (owner)/(tabs)/add-service.tsx       → href: null
    (owner)/(tabs)/affiliations.tsx      → href: null
    (owner)/(tabs)/queues.tsx            → href: null
    (owner)/(tabs)/professional-queue.tsx → href: null
    (owner)/(tabs)/attendances.tsx       → href: null
  (owner)/onboarding/_layout.tsx → Stack (onboarding)
    (owner)/onboarding/establishment.tsx
    (owner)/onboarding/also-professional.tsx
    (owner)/onboarding/address.tsx
```

> Sub-telas usam `href: null` no Tabs.Screen para manter a tab bar visivel em todas as telas,
> sem aparecer como abas extras. O grupo `(tabs)` e transparente na URL —
> `(owner)/(tabs)/add-professional.tsx` e acessivel como `/(owner)/add-professional`.

### Telas
1. **(auth)/index.tsx** — Escolha de papel: "Sou dono" vs "Sou profissional", passa role como param
2. **(auth)/register.tsx** — Email + senha → `POST /auth/register` → auto-login. Propaga param `role` para login
3. **(auth)/login.tsx** — Login com suporte a param `?role=` para routing dual-role (OWNER+PROFESSIONAL). Validacao por campo: email e senha tem estados de erro independentes (so o campo invalido mostra mensagem). Mesmo padrao em register.tsx
4. **(owner)/onboarding/establishment.tsx** — Seu nome + nome da loja + tipo → `POST /establishment/quick-create`. Salva ownerName no SecureStore e passa como param para also-professional
5. **(owner)/onboarding/also-professional.tsx** — "Voce tambem sera profissional?" — usa ownerName automaticamente (sem input), verifica se ja tem PROFESSIONAL role e pula. Se "Sim" → `POST /professional/quick-create`. Se "Nao" → `router.replace` ao dashboard. Trata 409 graciosamente
6. **(owner)/(tabs)/dashboard.tsx** — Badge de status com 3 estados (ABERTO / FECHADO / FECHADO TEMPORARIAMENTE), **fila em tempo real via WebSocket (`useQueueSocket`); polling 30s vira fallback** (#15), cards (fila, profissionais com nome/especialidade/fila/disponibilidade). useIsFocused para BackHandler. Se establishment null → botao "Criar Estabelecimento". Controle de status: "Abrir"/"Fechar" + "Fechar Temporariamente" (quando temp, vira "Reabrir"); `updateOpenStatus` envia OPEN/CLOSED/TEMPORARILY_CLOSED. Guard de abertura: bloqueia "Abrir" se nao ha profissional vinculado (alerta com acao "Adicionar Profissional"); validacao completa (profissional com servico) depende do backend — ver pendencia #7
7. **(owner)/(tabs)/menu.tsx** — Menu: Dados Pessoais (→ coming-soon "falta implementar"), **Dados do Estabelecimento (→ submenu establishment-data: Dados Cadastrais + Endereco)**, Relatorios (→ reports). Secao de gestao: Adicionar Profissional (se owner ja e PROFESSIONAL → add-professional info afiliacao; senao → also-professional quick-create), Solicitacoes, Servico, Filas, Atendimentos. Secao inferior: "Sair do Estabelecimento" (amber) e "Sair da Conta" (vermelho)
   - **(owner)/(tabs)/establishment-data.tsx** — submenu "Dados do Estabelecimento": **Dados Cadastrais** (→ establishment-registration) e **Endereco** (→ onboarding/address). Voltar via `router.back()`.
   - **(owner)/(tabs)/establishment-registration.tsx** — "Dados Cadastrais": edita **nome, telefone e Instagram** do estabelecimento via `updateGeneralInfos` → `PATCH /establishment/{id}/general-infos { name, phone, instagram }` (#13). Telefone com `maskPhone`, enviado sem mascara (`unmask`); phone/instagram em branco limpam o campo no backend.

   - **(owner)/(tabs)/reports.tsx** — Relatorio do owner que **unifica os profissionais do estabelecimento** (decisao 2026-06-13): cards "Agora" (na fila / disponiveis, via with-queue) + "Atendimentos finalizados" (total + receita, via `GET /attendances?establishmentId=X&status=FINISHED`) + breakdown por profissional (fila, espera, finalizados, receita — historico agregado por professionalId). Pull-to-refresh.
   - **coming-soon.tsx** (owner) — tela placeholder reutilizavel (`src/components/ComingSoon.tsx`) com titulo via param e mensagem "Em desenvolvimento / falta implementar". Usada por Dados Pessoais (owner). No professional o item "Dados Pessoais" foi ocultado (sem sentido por enquanto — decisao 2026-06-13)
8. **(owner)/(tabs)/add-professional.tsx** — Dois modos: (a) Se !PROFESSIONAL: formulario quick-create com tratamento 409 (tenta affiliate); (b) Se PROFESSIONAL: info afiliacao + "Ver Solicitacoes"
9. **(owner)/(tabs)/affiliations.tsx** — Solicitacoes de vinculacao: pendentes (aceitar/rejeitar) + historico. `GET /establishment/{id}/affiliations`, `PATCH /affiliations/{id}/accept|reject`
10. **(owner)/(tabs)/add-service.tsx** — Especialidade → tipo de servico → nome + preco + pricing preview → `POST /establishment/{id}/service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice` do calculatePricing: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12)
11. **(owner)/(tabs)/queues.tsx** — Visao de todas as filas por profissional (cards expansiveis), total na fila, profissionais disponiveis
12. **(owner)/(tabs)/professional-queue.tsx** — Fila detalhada de um profissional via `GET /client-queue/{profId}/queue` + botao "Desvincular Profissional" (`DELETE /establishment/{id}/professionals/{professionalId}`, volta ao dashboard)
13. **(owner)/(tabs)/attendances.tsx** — Historico de atendimentos: auto-load no mount, filtros, resumo de receita, erro real do backend + "tentar novamente"
14. **(owner)/onboarding/address.tsx** — Endereco do establishment (frontend + backend prontos)

### Sequencia de chamadas
```
POST /auth/register { email, password }
POST /auth/login { email, password }
  → armazena tokens no SecureStore
POST /establishment/quick-create { name, serviceType }
  → ganha OWNER
POST /auth/refresh { refresh_token }
  → novo token com ROLE_OWNER
  → Tela also-professional: "Voce tambem sera profissional?"
    Se SIM:
      POST /professional/quick-create { name, establishmentId, specialty? }
        → ganha PROFESSIONAL
      POST /auth/refresh { refresh_token }
        → novo token com ROLE_PROFESSIONAL
      POST /establishment/{id}/service-items { serviceItemType, customName, price }
    Se NAO:
      → Dashboard (establishment criado, sem profissional, status CLOSED)
PATCH /establishment/{id}/open-status { openStatus: "OPEN" }
```

### Regras de negocio
- Owner so pode criar UM perfil profissional (o dele mesmo) via `POST /professional/quick-create`
- Owner NAO pode criar profissional para outra pessoa — profissionais se cadastram pelo app e solicitam vinculacao
- Botao de hardware (Android) funciona em todas as telas com showBackButton via BackHandler no Header
- Botoes de cancelar/negar: transparente com borda vermelha e texto vermelho
- Service items sao vinculados ao profissional (JWT userId), nao ao establishment
- `estimatedMinutes` nao e enviado — backend tem default 30 via @PrePersist, atualizado semanalmente pela media dos atendimentos
- Establishment pode existir sem profissionais (status ACTIVE, openStatus CLOSED)
- `also-professional.tsx` verifica PROFESSIONAL role no mount e pula se ja existir

---

## 4. Fluxo 2 — Professional

### Telas
1. **(auth)/index.tsx** — Escolha "Sou profissional" (compartilhada)
2. **(auth)/register.tsx** — Email + senha (compartilhada)
3. **(professional)/onboarding.tsx** — 3 steps:
   - Step 1: Nome + especialidade → `POST /professional/register`
   - Step 2: Buscar establishment → `GET /establishment?name=X`
   - Step 3: Selecionar da lista → `POST /professional/me/affiliations { establishmentId }` (solicitacao pendente, requer aprovacao do owner)
4. **(professional)/_layout.tsx** — **NAV v2 (2026-07-23, mockup `design/professional-nav-v2.html`)**: o **rodape VOLTOU** — tabs visiveis **Fila** (people) · **Relatorios** (stats-chart; renomeada de "Meu dia" em 2026-07-25, arquivo/rota segue `my-day.tsx`) · **Configuracoes** (settings, com **dot vermelho** quando `hasAnyPending(completion)`); as demais telas seguem `href: null` (queue-options, my-services, onboarding, add-guest, find-establishment, establishment-detail, meals, settings-account, settings-vinculo). **Regra: rodape = LUGARES, banco = ACOES do dia.** O icone de **BANCO** (`BenchIcon`, provisorio) no header da Fila **NAVEGA para a tela cheia `queue-options.tsx`** ("Opcoes da fila") — nao e mais modal ("mais amigavel a tela inteira", Andre 2026-07-23) e **NAO duplica** os itens do rodape (`ProfessionalMenu` foi REMOVIDO). Conteudo da tela (componente `src/components/QueueOptions.tsx`, com testes RNTL): **AGORA** — **Status em bloco proprio, pills SEMAFORO LARGAS** (🟢 Trabalhando `$green500` / 🟡 Intervalo `$amber500` / 🔴 Fora `$red500`, full-width com "Voce esta: X · toque para trocar" — affordance, Andre 2026-07-24; ligadas ao `PATCH /professional/me/status`, gates 422/409; "Fora" bloqueado no CLIENTE quando ha fila — o 409 vira rede de seguranca) · **Fechar fila** ✅ LIGADO (S1 fatia 3, `PATCH /professional/me/accepting-new`; vira "Reabrir fila" enquanto drena; fechar confirma e, sendo o ultimo, fecha a loja via auto-`OFF`); **HOJE** — Solicitacoes (so se houver, badge + modal Aceitar/Recusar com countdown) · Refeicoes (rotulo com a proxima, ex. "Almoco 12:00", + contagem regressiva/dot via `mealSignal`) · Adicionar cliente. ⚠️ **SEM botao de abrir/fechar estabelecimento (removido 2026-07-24):** a loja e 100% derivada do status; ao trocar de status, a TELA (`queue-options.tsx`) compara o `open_status` antes/depois e AVISA "voce e o primeiro — a loja abriu" / "voce era o ultimo — a loja fechou". O **dot no banco** (na Fila) acende com refeicao sinalizada OU solicitacao de corte pendente; a pendencia de cadastro acende o dot da ABA Configuracoes (e, desde 2026-07-24, o dot POR CARD dentro de Configuracoes).
5. **(professional)/queue.tsx** — **LAYOUT 2026-07-18** (mockup `design/queue-layout-combined.html`): titulo **"Fila"** + **banco → tela "Opcoes da fila"** lado a lado (nav v2 2026-07-23; o rodape de tabs voltou); metricas (pessoas na fila / espera) viraram **chips compactos** no lugar dos 2 cards verdes; o **card do cliente INTEIRO e clicavel** e abre o menu de acoes por posicao (o kebab **⋮ foi removido** — acabou o toque errado ao lado do botao), com chevron › como affordance; o **1o card segue em destaque** com o selo "Proximo" (redundancia proposital); **"Iniciar proximo" e um botao FIXO no rodape** (rotulo FIXO desde 2026-08-05 — o nome do cliente saiu do botao e da dica a pedido do Andre; ele ja aparece no card com o selo "Proximo", logo acima) — o unico start, sempre no indice 0 — que vira a dica *"Finalize para iniciar o proximo"* enquanto ha atendimento rolando (impede atender dois ao mesmo tempo); o atendimento em andamento sobe para o **card "Atendendo agora"** no TOPO (verde, com cronometro, **Pausar** e **Finalizar**; pausado → card ambar com selo e **Retomar**). **Solicitacoes de corte (C2, 2026-07-22):** query de pendentes (GET) com **tempo real via WS pessoal** (`/user/queue/notifications`, assinado na MESMA conexao STOMP da fila; evento `CUT_*` invalida a query e o GET refaz — refetch 30s vira fallback) + **modal Aceitar/Recusar** com countdown local pelo `expires_at` — desde a nav v2 (2026-07-23) o modal mora na tela **"Opcoes da fila"**; a Fila mantem a MESMA query (`["cut-requests", profId]`, cache compartilhado) so para acender o dot do banco. Demais: lista de espera, start/pause/resume/finish/remove, **fila em tempo real via WebSocket (`useQueueSocket`); polling 30s fallback** (#15), pull-to-refresh. *(O botao "Adicionar Cliente" saiu da tela em 2026-07-20 — virou item do menu.)* **Atende-primeiro / LATE (2026-06-26; layout atualizado em 2026-07-18):** o "Iniciar" nao fica mais no card — e o **botao fixo do rodape**, que sempre atende o **indice 0**; no da vez ha tambem "Nao chegou" → `PATCH /attendances/{id}/late` (ele vira **ATRASADO** e cai 1 posicao, **continua na fila**) e o proximo vira o da vez; item LATE tem badge "Atrasado" + "Voltar a fila" (`/undo-late`). **Regra:** o **LATE so e aplicado quando o PROFISSIONAL pula o da vez (mecanismo #1)** — recai sempre sobre o **indice 0**. A **troca entre clientes (mecanismo #3, S2/C6) NAO marca LATE** (e consensual). Encaixe (#2) e outra coisa (cliente→pro, `/fit-in`). **Refeicoes (#14 Fase C) — desde 2026-07-20 a secao SAIU da tela:** iniciar/adiar/pular/editar ficam no **menu**; na fila permanece so a **faixa da refeicao EM ANDAMENTO** com "Encerrar" (`PATCH .../finish`), porque encerrar precisa estar a um toque. O **popup de nudge** continua na fila, disparando **no horario previsto** (ver 11.2). Botao "Buscar Estabelecimento" quando nao afiliado
6. **(professional)/add-guest.tsx** — Adicionar cliente walk-in: nome + selecao multipla de servicos + total → `POST /professional-queue/add-quest-attendance`
7. **(professional)/my-services.tsx** — Lista servicos + formulario com filtro por especialidade + pricing preview com absorcao. Guard: se profissional nao tem `establishment_id`, exibe aviso e botao para buscar estabelecimento (bloqueia adicao de servico); nesse estado faz `fetchMe()` no mount e no pull-to-refresh para detectar afiliacao aceita pelo owner (queue.tsx faz o mesmo no mount). Quando afiliado, mostra so o nome do estabelecimento (`establishment_name`, sem o prefixo "Vinculado a" — feedback 2026-06-22). Usa `POST /professional-queue/{profId}/add-service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice`: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12). Lista mostra o tipo de servico humanizado (humanizeServiceType, sem underline). ✅ **Editar/remover servico (2026-06-15):** cada item tem acoes "Editar" (nome+preco inline, dentro de FormControl) via `updateMyServiceItem` → `PATCH /professional-queue/{profId}/service-items/{itemId}` e "Remover" (com confirmacao) via `removeMyServiceItem` → `DELETE ...` (backend #10/#15 concluido)
8. **(professional)/find-establishment.tsx** — Gate no mount via `fetchMe` + `GET /professional/me/affiliations`: se ja afiliado mostra "Voce ja esta vinculado" (link Configuracoes); se tem solicitacao PENDING mostra "Solicitacao em andamento" (so 1 estabelecimento por vez); senao libera a busca. Auto-load `GET /establishment` (lista todos), busca por nome (`GET /establishment?name=X`), solicitar vinculacao (`POST /professional/me/affiliations { establishmentId }`). Nao exige servicos — ordem: afiliar primeiro, servicos depois. Busca por bairro/proximidade ordenada por fila pendente — ver pendencia backend #11
9. ~~**(professional)/profile.tsx**~~ — **REMOVIDO em 2026-07-22 (decisao Andre)**: estava orfao desde o redesign (o menu de opcoes da fila cobre todos os destinos dele). O bloco nome/especialidade/estabelecimento que ele exibia ja vive em Configuracoes
10. ~~**(professional)/attendances.tsx**~~ + ~~**reports.tsx**~~ → **UNIFICADAS em `my-day.tsx` (2026-07-22; aba "Relatorios" desde 2026-07-25)**: a tela = seletor de periodo (Hoje/Semana/Mes) governando o **resumo** (`GET /professional/me/reports`; "Hoje" mostra fila/espera ao vivo + ExpedienteCard) + secao **Historico** com filtros de STATUS (todos/finalizados/cancelados → `GET /attendances`; o endpoint nao aceita datas, entao o periodo NAO filtra o historico — sem fingir filtro). Pull-to-refresh recarrega os dois; erro do historico com "tentar novamente"
11. **(professional)/queue-options.tsx** — **NOVA (nav v2, 2026-07-23)**: tela cheia "Opcoes da fila" (conteudo em `src/components/QueueOptions.tsx`, ver item 4). Dona da fiacao: `updateMyStatus`, `openEstablishment` (SO abrir, com confirmacao), sinal/rotulo de refeicoes, query de cut-requests + **modal Aceitar/Recusar** (migrou da Fila). Voltar → Fila
12. **(professional)/settings.tsx** — **DIVIDIDA (nav v2, 2026-07-23)**: virou **MENU de cards** — identidade (nome · especialidade · estabelecimento) + CompletionCard + cards **Dados cadastrais** → `settings-account.tsx` (nome/apelido/e-mail/senha, a maquina de edicao migrou intacta) · **Meus servicos** → `my-services.tsx` · **Refeicoes** → `meals.tsx` (que HERDOU o liga/desliga do "aviso na hora", reversao do "Nao ver mais") · **Vinculo** → `settings-vinculo.tsx` (convites aceitar/recusar com confirmacao + Buscar/Desafiliar `DELETE /professional/me/establishment`; o card mostra **badge** com a contagem de convites PENDING para o convite nao ficar enterrado) · **Area do dono** (so dual-role, `router.replace` p/ dashboard do owner) · **Sair** (confirmacao → logout) + OtaUpdateButton

### Sequencia de chamadas
```
POST /auth/register { email, password }
POST /auth/login { email, password }
  → armazena tokens no SecureStore
POST /professional/register { name, specialty? }
  → ganha PROFESSIONAL (sem establishment)
POST /auth/refresh { refresh_token }
  → novo token com ROLE_PROFESSIONAL
GET /establishment?name=barbearia
  → lista de establishments
POST /professional/me/affiliations { establishmentId }
  → cria solicitacao PENDING (tipo REQUEST)
  → owner aceita via PATCH /affiliations/{id}/accept
  → profissional vinculado automaticamente ao establishment
```

### Regras de negocio
- Profissional so pode estar vinculado a 1 establishment por vez (MVP)
- Solicitacao de afiliacao cria registro PENDING, requer aprovacao do owner
- Ordem do fluxo: afiliar primeiro → owner aceita → adicionar servicos (solicitar afiliacao nao exige servicos; adicionar servico exige `establishment_id`)
- Ja afiliado → 409 PROFESSIONAL_ALREADY_AFFILIATED
- Ja solicitou → 409 AFFILIATION_ALREADY_PENDING
- Specialty e String livre (max 100 chars), nao e enum no backend

### Responses do backend

**POST /professional/register (201):**
```json
{
  "id": "uuid",
  "name": "Joao Silva",
  "specialty": "BARBER",
  "establishment_id": null,
  "establishment_name": null,
  "is_available": true,
  "message": "Professional created!..."
}
```

**GET /establishment?name=barbearia (200):**
```json
[
  {
    "id": "uuid",
    "services": ["BARBER"],
    "name": "Barbearia do Andre",
    "urlImage": null,
    "ownerId": "uuid",
    "open_status": "OPEN",
    "status": "ACTIVE"
  }
]
```

**POST /professional/me/affiliations (201):**
```json
{
  "id": "uuid",
  "professionalId": "uuid",
  "professionalName": "Joao Silva",
  "establishmentId": "uuid",
  "establishmentName": "Barbearia do Andre",
  "type": "REQUEST",
  "status": "PENDING",
  "createdAt": "2026-05-26T12:00:00",
  "resolvedAt": null
}
```

---

## 5. Stores Implementados

### auth.store.ts
- `login(email, password)` — POST /auth/login → armazena tokens
- `register(email, password)` — POST /auth/register
- `refreshToken()` — POST /auth/refresh → atualiza tokens e roles
- `logout()` — POST /auth/logout → limpa SecureStore → reseta establishmentStore e professionalStore
- `loadStoredTokens()` — carrega tokens salvos ao abrir app

### establishment.store.ts
- `quickCreate(name, serviceType)` — POST /establishment/quick-create
- `updateOpenStatus(id, status)` — PATCH /establishment/{id}/open-status
- `quickCreateProfessional(name, establishmentId, specialty?)` — POST /professional/quick-create
- `addServiceItem(establishmentId, serviceItemType, customName, price)` — POST /establishment/{id}/service-items
- `addAddress(establishmentId, addressData)` — POST /establishments/{id}/addresses (frontend pronto, backend pendente)
- `searchByName(name)` — GET /establishment?name=X
- `removeProfessional(establishmentId, professionalId)` — DELETE /establishment/{id}/professionals/{professionalId} (owner desvincula profissional)
- `fetchMine()` — GET /establishment/mine → carrega establishment do owner autenticado
- `reset()` — limpa estado ao fazer logout

### professional.store.ts
- `register(name, specialty?)` — POST /professional/register (normaliza camelCase/snake_case)
- `affiliate(establishmentId)` — POST /professional/affiliate (vinculacao direta, usado no quick-create 409 fallback)
- `requestAffiliation(establishmentId)` — POST /professional/me/affiliations (solicitacao pendente, requer aprovacao do owner)
- `fetchMyServices()` — GET /professional/{id}/service-items
- `restoreProfessional()` — recupera dados do SecureStore ao reiniciar app (normaliza campos)
- `setProfessional(data)` — salva profissional no estado e SecureStore
- `switchEstablishment(newEstablishmentId)` — DELETE /professional/me/establishment → POST /professional/affiliate (troca de establishment)
- `leaveEstablishment()` — DELETE /professional/me/establishment + limpa myServices + fetchMe (desafiliacao pelas configuracoes)
- `cancelAffiliation(affiliationId)` — DELETE /affiliations/{id} (cancela a solicitacao PENDING; usado no find-establishment)
- `fetchMe()` — GET /professional/me → atualiza estado local e SecureStore
- `addMyServiceItem(serviceItemType, customName, price)` — POST /professional-queue/{profId}/add-service-items
- `reset()` — limpa estado ao fazer logout
- `normalizeProfessional(data)` — funcao helper que aceita tanto camelCase (establishmentId) quanto snake_case (establishment_id) do backend

### attendance.store.ts
- `fetchQueue(establishmentId)` — GET /establishment/id/{id}/professionals-with-queue
- `fetchProfessionalQueue(professionalId, establishmentId)` — GET /client-queue/{profId}/queue
- `addGuestAttendance({ professionalId, establishmentId, serviceItemIds, clientName })` — POST /professional-queue/add-quest-attendance
- `fetchHistory({ establishmentId?, professionalId?, status? })` — GET /attendances (backend pendente)
- `startAttendance(attendanceId)` — PATCH /attendances/{id}/start
- `finishAttendance(attendanceId)` — PATCH /attendances/{id}/finish
- `pauseAttendance(attendanceId)` — PATCH /attendances/{id}/pause
- `resumeAttendance(attendanceId)` — PATCH /attendances/{id}/resume
- `removeFromQueue(attendanceId)` — DELETE /professional-queue/{id}/remove
- `reset()` — limpa estado ao fazer logout

---

## 6. Telas Implementadas

```
app/
  _layout.tsx                    — SafeAreaProvider + GluestackUIProvider + fontes + StatusBar (dark-content, sem translucent)
  index.tsx                      — Root redirect: loadStoredTokens → se autenticado, redireciona por role (getPostLoginRoute); senao, vai para (auth)
  (auth)/
    index.tsx                    — Escolha de papel (Owner vs Professional), passa role como param
    login.tsx                    — Login conectado ao authStore, suporta param ?role= para routing dual-role
    register.tsx                 — Register + auto-login + redirect por role, propaga param role para login
    forgot-password.tsx          — Esqueci minha senha (S7): e-mail -> codigo de 6 digitos + nova senha (POST /auth/forgot-password + /auth/reset-password); envio REAL depende do SMTP (S8)
  (owner)/
    _layout.tsx                  — Stack (root)
    onboarding/
      establishment.tsx          — Quick-create establishment
      also-professional.tsx      — "Voce tambem sera profissional?" com especialidade
      address.tsx                — Endereco conectado ao store
    (tabs)/
      _layout.tsx                — Tabs (dashboard + menu + sub-telas com href: null)
      dashboard.tsx              — Badge ABERTO/FECHADO, toggle, fila em tempo real (WebSocket; polling fallback), pull-to-refresh, lista de profissionais com fila
      menu.tsx                   — Menu: Dados Pessoais, Dados do Estabelecimento, Adicionar Profissional, Solicitacoes, Servico, Filas, Atendimentos, Relatorios, Sair
      add-professional.tsx       — Dois modos: quick-create (se !PROFESSIONAL) ou info afiliacao (se PROFESSIONAL)
      add-service.tsx            — Adicionar servico com filtro por especialidade (25 tipos) + pricing preview
      affiliations.tsx           — Solicitacoes de vinculacao (aceitar/rejeitar)
      queues.tsx                 — Visao de todas as filas: cards por profissional, link para fila detalhada
      professional-queue.tsx     — Fila detalhada de um profissional (GET /client-queue/{profId}/queue)
      attendances.tsx            — Historico de atendimentos do establishment (auto-load, filtros, resumo receita)
  (professional)/
    _layout.tsx                  — NAV v2 (2026-07-23): tabs visiveis Fila · Relatorios · Configuracoes (dot na aba qdo pendencia de cadastro); demais telas href:null
    onboarding.tsx               — 3 steps: profile → busca → solicitacao de afiliacao (PENDING)
    queue.tsx                    — Fila ENXUTA: titulo + banco (navega p/ queue-options; dot = refeicao/solicitacao), chips de metrica, card do cliente clicavel (sem ⋮), card "Atendendo agora" (Pausar/Finalizar/Retomar), "Iniciar proximo" FIXO + faixa da refeicao EM ANDAMENTO. Tempo real (WebSocket; polling fallback), pull-to-refresh
    queue-options.tsx            — "Opcoes da fila" TELA CHEIA (nav v2): Status semaforo (pills largas + affordance; loja derivada, avisa 1o abre/ultimo fecha), Fechar/Reabrir fila (accepting-new), Solicitacoes (modal Aceitar/Recusar), Refeicoes, Adicionar cliente
    add-guest.tsx                — Adicionar cliente: nome + multi-select servicos + total (POST /professional-queue/add-quest-attendance)
    find-establishment.tsx       — Buscar establishment + solicitar afiliacao (POST /professional/me/affiliations)
    my-services.tsx              — Lista + CRUD servicos com pricing preview (absorcao por faixa), pull-to-refresh
    my-day.tsx                   — "Relatorios" (aba renomeada 2026-07-25; arquivo segue my-day): resumo por periodo + historico com filtros de status (unificou reports+attendances em 2026-07-22)
    reports.tsx                  — Stats do dia (fila + tempo), semana/mes aguardando endpoint
    settings.tsx                 — MENU de cards (nav v2): Dados cadastrais / Meus servicos / Refeicoes / Vinculo (badge convites) / Area do dono (dual) / Sair + CompletionCard + OTA
    settings-account.tsx         — Dados cadastrais: nome, apelido, e-mail, senha (edicao inline)
    settings-vinculo.tsx         — Vinculo: convites de vinculacao (aceitar/recusar) + buscar/desafiliar estabelecimento
```

---

## 7. Formato dos Tokens e Refresh

### Login response
```json
{
  "user": { "id": "uuid", "email": "user@test.com" },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "uuid",
    "expires_in": 3600
  }
}
```
Frontend le: `data.tokens.access_token`, `data.tokens.refresh_token`

### Refresh request
```json
{ "refresh_token": "uuid" }
```
Campo em snake_case. Confirmado com backend via @JsonProperty("refresh_token").

### Refresh response
```json
{
  "access_token": "eyJ...",
  "refresh_token": "uuid",
  "expires_in": 3600
}
```
Resposta flat (sem wrapper). Frontend le: `data.access_token`, `data.refresh_token`

### Interceptor Axios
- Request interceptor: adiciona `Authorization: Bearer <access_token>` em todas as requests
- Response interceptor: em 401, tenta refresh automatico e retry da request original
- Refresh no interceptor usa `axios.post` direto (sem interceptor) para evitar loop

### Máscaras de input — src/lib/masks.ts (2026-06-13)
- Funções puras testadas: `maskCEP` (00000-000), `maskPhone` ((00) 00000-0000 / fixo), `maskDate` (DD/MM/AAAA), `unmask` (só dígitos para enviar ao backend)
- Aplicado: CEP em address.tsx (envia via `unmask`). Telefone/data prontos para quando existirem campos (hoje não há tela com esses campos)

### Auto-preenchimento de endereço por CEP — src/lib/cep.ts (2026-06-13)
- `lookupCep(cep)` consulta a **ViaCEP** (API pública, não depende do backend VUPTH); retorna null em CEP inválido/offline (nunca lança)
- address.tsx: ao completar 8 dígitos no CEP, busca e preenche logradouro/bairro/cidade/UF automaticamente (com spinner "Buscando endereco pelo CEP..."); o usuário ainda pode editar os campos

### Mensagens de erro — getApiErrorMessage (api.ts)
- Helper usado nos catches das telas para mostrar mensagens uteis ao usuario (nao apenas "houve um erro")
- Sem `error.response` (rede) → "Sem conexao com o servidor. Verifique sua internet e tente novamente."
- `data.code` conhecido → traducao PT (ERROR_MESSAGES_PT): AFFILIATION_ALREADY_PENDING, PROFESSIONAL_ALREADY_AFFILIATED, USER_ALREADY_PROFESSIONAL, ESTABLISHMENT_NOT_FOUND, PROFESSIONAL_NOT_FOUND, AFFILIATION_NOT_FOUND, ESTABLISHMENT_NOT_READY, VALIDATION_ERROR (backend responde em ingles; traduzimos por codigo — 2026-06-12)
- `data.fieldErrors` → lista campo: mensagem (um por linha)
- `data.message` → mensagem real do backend (fallback quando o codigo nao esta mapeado)
- Caso contrario → fallback especifico da acao (ex: "Nao foi possivel abrir o estabelecimento. Tente novamente.")
- Aplicado em todas as telas com chamada de API (auth, onboardings, afiliacao, servicos, fila, atendimentos, endereco)

### Teclado e botao voltar
- `app.json`: `android.softwareKeyboardLayoutMode = "pan"` para o teclado nao cobrir os campos focados no Android (2026-06-12). Forms longos (ex: address.tsx) usam `paddingBottom` no contentContainer para o ultimo campo (Estado/UF) folgar acima do teclado (2026-06-13)
- Header (`src/components/Header.tsx`): o botao voltar **nunca** desloga. handleBack usa onBack se fornecido, senao `router.back()` se houver historico; sem para onde voltar **nao faz nada** (removido o antigo fallback `router.replace("/(auth)")`)
- Destinos de voltar (2026-06-13): telas de gestao do owner abertas pelo menu voltam para **/(owner)/menu** (antes iam para o dashboard/home); professional-queue volta para dashboard. Telas do professional voltam para **/(professional)/queue** — a Fila e a home da area do profissional desde 2026-07-18 (antes voltavam para `/profile`); **excecao (nav v2, 2026-07-23):** as sub-telas de Configuracoes (`settings-account`, `settings-vinculo`) voltam para **settings**, e `queue-options` volta para a Fila. Onboarding profissional: step "search" volta para step "profile"; step "profile" volta para profile. Onboarding owner (que usa router.replace) volta para dashboard/menu — nunca para /(auth)

---

## 8. Enums da API

### ServiceType (tipo de estabelecimento)
| Valor | Descricao |
|-------|-----------|
| BARBER | Barbearia |
| BEAUTY_SALON | Salao de beleza |
| EYEBROW | Design de sobrancelha |
| NAIL_SALON | Manicure / pedicure |
| SPA | SPA |
| CLINIC | Clinica estetica |

### ServiceItemType (25 valores)
| Valor | ServiceType compativel |
|-------|----------------------|
| CORTE_MAQUINA | BARBER |
| CORTE_TESOURA | BARBER |
| BARBA | BARBER |
| SOBRANCELHA | BARBER, EYEBROW |
| PINTURA | BARBER, BEAUTY_SALON |
| HENNA_SOBRANCELHA | EYEBROW |
| MICROPIGMENTACAO_SOBRANCELHA | EYEBROW |
| BROW_LAMINATION | EYEBROW |
| TINTURA_SOBRANCELHA | EYEBROW |
| RECORTE_PONTAS | BEAUTY_SALON |
| ESCOVA | BEAUTY_SALON |
| HIDRATACAO | BEAUTY_SALON |
| PROGRESSIVA | BEAUTY_SALON |
| MANICURE | NAIL_SALON |
| PEDICURE | NAIL_SALON |
| UNHAS_GEL | NAIL_SALON |
| NAIL_ART | NAIL_SALON |
| MASSAGEM_RELAXANTE | SPA |
| MASSAGEM_MODELADORA | SPA |
| LIMPEZA_PELE | SPA, CLINIC |
| DEPILACAO | SPA |
| DRENAGEM | SPA |
| PEELING | CLINIC |
| BOTOX | CLINIC |
| MICROAGULHAMENTO | CLINIC |

### Specialty (profissional)
String livre, max 100 caracteres. Nao e enum no backend.
Frontend usa: BARBER, HAIRDRESSER, NAIL_TECH, MASSEUSE, ESTHETICIAN.

### OpenStatus
| Valor | Descricao |
|-------|-----------|
| OPEN | Aberto e recebendo clientes |
| CLOSED | Fechado |
| TEMPORARILY_CLOSED | Fechado temporariamente (obra, licenca) |

### AttendanceStatus
| Valor | Descricao |
|-------|-----------|
| SCHEDULED | Na fila, aguardando |
| IN_PROGRESS | Sendo atendido |
| PAUSED | Pausado temporariamente |
| FINISHED | Concluido |
| CANCELLED | Cancelado (duplo L) |

---

## 9. Testes E2E — Maestro

### seed_complete.yaml
Cria 4 establishments com profissionais e servicos, depois 2 profissionais independentes afiliando:

| Owner | Tipo | Servicos |
|-------|------|----------|
| Owner 1 | BARBER | Corte Degrade, Barba Completa, Corte Tesoura Premium |
| Owner 2 | BEAUTY_SALON | Recorte Pontas, Escova Modeladora |
| Owner 3 | NAIL_SALON | Manicure Gel, Pedicure Completa |
| Owner 4 | SPA | Massagem Relaxante, Depilacao Completa |

| Professional | Especialidade | Afilia a |
|-------------|---------------|----------|
| Ricardo | BARBER | Barbearia (Owner 1) |
| Lucia | HAIRDRESSER | Salao (Owner 2) |

Nomes dinamicos com sufixo unico por execucao (ultimos 5 digitos do timestamp).

### Outros testes Maestro
- `mvp_owner_complete.yaml` — fluxo rapido: 1 owner completo (register → establishment → open → professional → service)
- `test_affiliate.yaml` — teste isolado de afiliacao profissional
- `test_professional_screens.yaml` — teste de navegacao profissional (tabs)

### Limitacoes do Maestro
- `inputText` nao suporta Unicode (acentos removidos nos nomes)
- Nao suporta `outputs` em `runScript` (Maestro 2.5.1) — usar `evalScript` com `${output.VAR}`
- Nao suporta `timeout` em `assertVisible` nem `extendedWaitUntil`
- Seletores por `id` (testID) preferidos sobre `text` para evitar ambiguidade
- Spell checker do Android converte palavras sem acento → desabilitar via `adb shell settings put secure spell_checker_enabled 0` (feito no setup.sh)

### Status atual
- Maestro atualizado para estado atual das telas (tabs profissional, testIDs)
- Flows antigos removidos (.maestro/flows/, .maestro/helpers/)
- Pendente: rodar no celular fisico via Expo Go

---

## 9-A. DECISOES PENDENTES DO ANDRE — contexto, pergunta e o que o mercado faz

> 🧭 **Para que serve esta secao (criada em 2026-08-11, a pedido dele).** Ha escolhas que **nao sao tecnicas** — sao de produto, custo ou risco — e que **nenhuma equipe deve tomar sozinha**. Elas ficam aqui, cada uma com **contexto**, **a pergunta**, **o que se costuma fazer no mercado** e **o que muda dependendo da resposta**. O Andre le, pesquisa e responde quando quiser; ate la, **ninguem implementa** o item — o custo de errar e refazer.
>
> **Formato:** `D1..Dn`, numeracao **estavel** (nunca renumerar — igual aos `S`/`C` dos handoffs). Ao decidir, marcar ✅ com a data e a razao, e **manter a linha** — a decisao registrada vale mais que a lista curta.

---

### D8 · Como o testador chega no app — web por URL e/ou lojas ✅ **DECIDIDO (Andre, 2026-08-12): OS DOIS**

**Contexto.** Mandar APK e pedir "instala mesmo assim" e caro: o Play Protect assusta, o arquivo circula por WhatsApp, e cada versao nova repete o ritual. Os testadores agora sao **donos de estabelecimento de verdade**, nao a equipe.

**Decisao dele:** fazer **os dois**, comecando pelo **A (web)**; o **B (lojas)** fica preparado — **Play Store e Apple Store**.

**A · Versao web (`react-native-web`, ja instalado).** Zero instalacao, atualizacao instantanea (o deploy substitui o app; nao ha "verificar atualizacao"). ⚠️ **O que NAO funciona na web:** **push** (`expo-notifications`) — o profissional so recebe solicitacao de corte com a **pagina aberta**, pelo WebSocket; `expo-updates` (irrelevante, o deploy faz o papel); e o **`expo-secure-store`**, usado em **19 arquivos**, que precisa de um adaptador (`SecureStore` no nativo, `localStorage` na web). ⚠️ **Seguranca:** no navegador nao existe Keychain — o token fica legivel por qualquer JS da mesma origem. Aceitavel p/ teste; se a web virar canal de acesso **real**, revisitar (cookie `HttpOnly`, que exige backend e traz dois modos de auth — **e a norma da industria**, nao anomalia; o que barateia e servir front e API **na mesma origem**).

**B · Lojas (Play + Apple).** O testador instala pelo caminho normal, com push e OTA funcionando. **Custos reais:** Play Console **US$ 25 uma vez** (teste interno: ate 100 testadores, **sem revisao**, disponivel em minutos) · Apple Developer **US$ 99/ano** (TestFlight). ⚠️ **Isto REABRE a decisao de iOS**, registrada como adiada em 2026-08-11 justamente por causa dos US$ 99 — ver a nota na secao 14 e a lista "Preparar publicacao nas lojas" na secao 10.

---

### D9 · Recuperacao de senha: qual canal? ⚠️ **"o que tiver de gratis" tem uma resposta desconfortavel**

**Contexto.** Voce pediu recuperacao por **notificacao, celular ou WhatsApp**, "o que tiver de gratis" — depois do teste em que o e-mail **nao chegou** (**S7**) e o fluxo **passou com e-mail inexistente** (**S21**).

**A pergunta.** Trocar o canal de recuperacao, ou consertar o que existe?

**O que cada canal custa de verdade:**
- 🔴 **Push NAO SERVE p/ recuperar senha** — e uma falha de conceito, nao de custo. Conferido no codigo: o `logout` **apaga** o `vupth_push_token` e chama `DELETE /devices`. Quem esqueceu a senha esta **deslogado**, ou esta num **aparelho novo** — nos dois casos nao ha token p/ receber nada. Push serve p/ avisar quem **ja esta logado**, nao p/ readmitir quem ficou de fora.
- 💰 **SMS nao e gratis.** Twilio, AWS SNS, Zenvia: todos cobram por mensagem no Brasil. **Firebase Phone Auth** tem cota gratuita diaria pequena e depois cobra por verificacao — **confirmar os limites atuais antes de contar com ela**.
- 💰 **WhatsApp nao e gratis p/ isso.** Na API oficial da Meta, mensagem de **autenticacao** e categoria **paga** no Brasil (por mensagem), alem de exigir verificacao de negocio. O "gratis" do WhatsApp Business cobre outro tipo de conversa.
- ✅ **E-mail e o unico canal realmente gratis em escala** (Brevo: 300/dia no free) — e e **exatamente o que ja temos e esta quebrado**.

**Leitura honesta:** trocar de canal **nao resolve o problema, troca por outro mais caro**. O que resolve e o **S7** (fazer o e-mail sair) e o **S21** (parar de fingir que enviou). Se a decisao for por celular/WhatsApp mesmo assim, e legitimo — mas entra como **custo recorrente por usuario**, e a conta cresce junto com a base.

**Alternativa gratuita que vale considerar:** o **login social** (Google Sign-In) elimina a senha em vez de recupera-la — quem entra com o Google nunca esquece senha nenhuma. Custo zero, adesao altissima, e resolve o problema pela raiz p/ boa parte dos usuarios.

---

### D1 · Render Free hiberna: pagar, cutucar ou aceitar?

**Contexto.** O backend roda no **Render Free**, que **dorme com ~15min sem trafego**. Medido em 2026-08-11: o readiness respondeu **`200` em 35 segundos**; ja acordado, `/ws/info` responde em **0,5s**. Isso ja custou: o **primeiro cadastro/login falhava por timeout** (resolvido com o `waitForBackend()`, que segura o app numa tela "preparando servidor…") e agora a **"falha no handshake do websocket"** que voce viu no teste — o socket conecta depois do gate e, se a instancia re-hibernou, o handshake morre (**S29**).

**A pergunta.** Manter o Free e conviver com o cold start, ou eliminar a hibernacao?

**O que o mercado faz.**
- **Plano pago do host** (Render Starter ~US$ 7/mes, Railway, Fly.io). E o padrao assim que existe **qualquer** usuario real: instancia sempre quente, sem 1a requisicao de 35s. Resolve na raiz — inclusive o cold start do login, que e a **primeira impressao** do app.
- **Keep-alive** (cron externo pingando a cada 10-14min: UptimeRobot, cron-job.org, GitHub Actions). Custo zero, mas e um contorno do free tier: se o ping falhar ou a politica mudar, volta a dormir; e alguns hosts consideram abuso.
- **Aceitar e mascarar no app.** E o que ja fazemos com o readiness gate. Funciona p/ HTTP; p/ o socket dava p/ adiar a 1a conexao ate o gate passar. **Nao resolve** a re-hibernacao no meio do dia.

⚠️ **Sobre Hostinger / HostGator (levantado pelo Andre, 2026-08-12):** a **hospedagem compartilhada** deles **nao roda Spring Boot** — e ambiente de PHP/WordPress, sem JVM nem container. O que serviria e o **VPS** (~R$ 30-50/mes), e ai voce assume **a administracao da maquina**: Docker, TLS/certificado, firewall, atualizacoes de SO, backup. E o mesmo trade-off do Oracle Free, so que pago. **Nao ha ganho** sobre o Render Starter (US$ 7 gerenciado) a menos que voce queira o controle do VPS por outro motivo.

**O que muda.** Se for pago, o `waitForBackend()` vira rede de seguranca (nao caminho normal) e o S29 fecha. Se ficar Free, vale investir no app: adiar o socket, e talvez avisar "servidor acordando" em vez de "erro".

---

### D2 · Fila ou agenda pura: um modelo, dois, e quem escolhe?

**Contexto.** Voce pediu (2026-08-05) que **o profissional escolha** trabalhar por **fila dinamica** (o modelo que construimos) ou **so por agenda, com horarios fixos** — **P2** das intencoes, **S24** no backend, **C21** no client. Isso convive com outra decisao sua: o **fim da fila hibrido** (o *cliente* escolhe entrar agora ou agendar), que ja tem motor pronto no backend (INTENÇÃO).

**As perguntas.** (a) Os dois regimes convivem **no mesmo estabelecimento** (profissional A por fila, B por agenda)? (b) No modo agenda, o horario e **fixo de verdade** (hora marcada, atraso queima o slot) ou continua **estimado**? (c) Qual e o **default** de quem se cadastra hoje?

**O que o mercado faz.**
- **Agenda pura** (Booksy, Fresha, Trinks, Agendor): dominante em salao/estetica, onde o servico e longo e caro. Slot fixo, no-show com politica (cobranca, bloqueio), lembrete automatico.
- **Fila / walk-in** (Waitwhile, QLess, senha de banco): dominante onde o servico e curto e a demanda e por chegada — barbearia de bairro e o caso classico.
- **Hibrido** (Booksy e Fresha ja fazem): a agenda e a espinha, e o walk-in **entra nos buracos**. E o modelo mais comum nos apps grandes — e o mais caro de construir, porque exige que os dois compartilhem a mesma linha do tempo.

**O que muda.** A tela da Fila do partner assume fila viva em **tudo** (ETA, "Iniciar proximo", "Fechar fila", promover, adiantar, refeicao no ETA). No modo agenda ela vira **grade do dia** e metade desses conceitos perde sentido — inclusive a **abertura derivada da loja**. Por isso o combinado e **comecar por mockup**, nao por codigo.

---

### D3 · Foto de perfil: onde a imagem mora?

**Contexto.** Voce pediu foto de perfil (**P1**, **S22**). Hoje **nao existe upload** em nenhum dos dois apps, e o profissional nem tem campo de imagem. Do nosso lado o custo nao e a tela: `expo-image-picker` e **modulo nativo** — exige `eas build`, bump de versao e reinstalar o APK.

**A pergunta.** O arquivo sobe **pelo backend** ou **direto do app** para um servico de midia?

**O que o mercado faz.**
- **URL pre-assinada** (S3, Cloudflare R2, Supabase Storage, GCS): o backend assina uma URL, o **app sobe direto**. E o padrao. Nao passa banda pelo servidor — o que importa muito num Render Free.
- **Servico de imagem gerenciado** (Cloudinary, imgix, Uploadcare): sobe, e eles **redimensionam, cortam e servem por CDN**. Free tier costuma bastar p/ MVP. Poupa o trabalho de gerar thumbnail.
- **Upload multipart pro proprio backend**: mais simples de comecar, mas o servidor vira gargalo de banda e voce ainda precisa resolver storage e CDN depois.

**O que muda.** Se for pre-assinada ou Cloudinary, o backend expoe so a **URL final** e o app faz o upload — e ai precisamos decidir tambem **quem redimensiona** (mandar 8MP do celular e desperdicio). Em qualquer caso, **junte com outras mudancas nativas** p/ nao gastar um build inteiro so nisso.

---

### D4 · Horario por dia: ate onde modelar?

**Contexto.** Voce pediu horarios especificos por dia (**S27**). Hoje o contrato tem **um** `opening_time`/`closing_time` p/ a semana inteira — nao da p/ ter domingo fechado. E nao e cosmetico: esse horario alimenta o **gate de entrada na fila**, o **auto-fechamento** e a **grade de refeicoes**.

**A pergunta.** Modelar **so a semana** (7 linhas), ou ja incluir **excecoes** (feriado, folga, fechamento pontual)?

**O que o mercado faz.**
- **Semana + excecoes** e o padrao de fato (Google Business Profile, Booksy, Calendly): uma grade semanal recorrente **mais** uma lista de datas especiais que sobrescrevem. Quase todo produto acaba precisando das duas.
- **Duas janelas no mesmo dia** (fecha p/ almoco) e comum no Brasil — mas aqui **talvez o modelo de refeicoes ja resolva**, e vale nao duplicar o conceito.

**O que muda.** So a semana ja destrava o pedido e e bem menor. As excecoes podem vir depois **se** o modelo nascer preparado (uma tabela de datas que sobrescreve a recorrencia). Se nascer sem, incluir depois e migracao.

---

### D5 · Solicitacao de corte: "me encaixa quando der" ou hora marcada?

**Contexto.** Voce pediu que o card mostre **"principalmente o horario"** (**S26**). Hoje o contrato so tem **quando o pedido foi feito** e **quando expira** — nao existe o horario que o cliente quer. E aceitar cria um atendimento **no fim da fila**, entao o profissional decide sem saber se aquilo serve p/ o cliente.

**A pergunta.** O pedido de corte carrega um **horario desejado**, ou continua sendo "me encaixa quando der" e o que falta e mostrar o **ETA da cauda** na hora de decidir?

**O que o mercado faz.**
- **Pedido com horario** (o "solicitar horario" de Booksy/Fresha): o cliente propoe, o profissional aceita ou contrapropoe. Vira quase uma negociacao — e ai o aceite tem de **respeitar o horario**, nao jogar na cauda.
- **Pedido sem horario, com previsao** (delivery, Uber): o app mostra "sera atendido por volta de X" e a pessoa aceita ou nao. Mais simples, e coerente com fila.

**O que muda.** A primeira opcao aproxima o corte da INTENÇÃO (D2) — talvez sejam a mesma feature com nomes diferentes, e vale decidir junto. A segunda e barata: bastaria o backend expor o ETA no response.

---

### D6 · Apagar a conta: anonimizar ou apagar de verdade?

**Contexto.** Voce pediu a opcao de apagar a conta (**S19**). Nao existe endpoint. Alem do seu pedido, **Google Play e App Store exigem** exclusao iniciada pelo usuario dentro do app, e a LGPD da ao titular o direito de eliminacao.

**A pergunta.** Apagar **fisicamente** os dados ou **anonimizar** mantendo o historico? E o que acontece com um **dono que tem loja e profissionais vinculados**?

**O que o mercado faz.**
- **Anonimizacao** e o padrao quando ha historico financeiro: o cliente vira "Usuario removido", o **atendimento e a receita continuam** (a loja nao pode perder o faturamento dela), e os dados pessoais somem. Atende a LGPD, que preve a guarda p/ obrigacao legal/fiscal.
- **Delecao fisica** so costuma valer p/ conta sem historico.
- **Prazo de arrependimento** (7-30 dias antes de efetivar) e comum — evita exclusao por impulso e cobre o suporte.

**O que muda.** Sendo anonimizacao, o backend precisa decidir o que fazer com o **owner com loja ativa** (bloquear? transferir? fechar?) e com **fila viva** (409). Sem essa regra, o front nao tem o que ligar.

---

### D7 · A logo no menu da fila

**Contexto.** Voce pediu o logotipo no lugar do banco e depois disse que **decide pelo lado do client**. O mockup com **4 versoes** esta em `design/queue-menu-logo.html` (logo completa vs so o V; botao branco vs verde), cada uma com lupa 4x.

**A pergunta.** Qual versao — e, se for a logo completa, **da p/ conseguir o SVG original** com o design?

**O que pesa.** As **linhas de velocidade** do V sao a identidade da marca e sao exatamente o que **borra em 22px**. O PNG atual nao escala; a alternativa vetorial que desenhei e **aproximacao**. Com o SVG original, da p/ ter as duas coisas.

---

## 10. Pendente de Implementacao

### Pendencias do partner (priorizado) — ABERTAS

> ✅ **BRANCH UNICA (decisao do Andre, 2026-08-05): `chore/gluestack-update`.** A `dev` chegou a receber sozinha o codigo do badge (`c15526d`) enquanto a documentacao ficava na branch de migracao — o Andre cortou a divisao (*"por que nao deixou tudo na mesma branch? Vamos fazer melhor, testar logo as telas para podermos mergear"*) e a `dev` **foi mergeada para ca** (`6804bf9`; o unico conflito foi o badge do `QueueOptions`, que ficou na versao NativeWind usando o `NotificationBadge`). Agora **tudo** vive aqui: migracao + badge + o fix de WS `59a3b9b`.
> - **QA sai desta branch:** `eas update --branch preview` rodado **de dentro dela** (push nela nao dispara OTA nem CI — o `eas-update.yml`/`ci.yml` so escutam `dev`/`main`). Um canal cabe um bundle, entao **enquanto durar este QA nao pushar a `dev`** — o push dela sobrescreveria o `preview` com o bundle v1.
> - **O que o QA cobre de uma vez:** os 7 batches ja convertidos (grupo `(auth)`, os dois onboardings, a **FILA** e 16 componentes), o **badge numerado** e o **fix de WS**. As 23 telas ainda nao convertidas seguem em gluestack no mesmo app — v1 e v2 convivem por desenho, entao nada quebra por estarem misturadas.
> - **Objetivo declarado:** validado no device, **mergear** (a branch nunca foi vista rodando; era esse o bloqueio).

> Renumeradas 1..N por prioridade; itens concluidos saem da lista (o git history preserva). Dependencias de backend/client ficam na secao 11. Regra de gestao: ao concluir, remover e renumerar.

> 🟢 **DECISAO DE PRODUTO (2026-06-28): servico e capacidade do PROFISSIONAL.** O **owner nao cria servico** enquanto for **so owner** — so se **acumular o papel PROFESSIONAL** (e ai gerencia pelo fluxo de profissional, "Meus Servicos", que ja tem criar/editar/remover completo via `professional-queue/.../service-items`). **Implicacoes (aplicadas):** o item de menu **"Adicionar Servico" do owner some** quando ele nao e profissional (`menu.tsx`, gate `isProfessional`); `add-service.tsx` tem guard que redireciona p/ o menu. **Consequencia nos afazeres:** o antigo "dono editar/remover servicos" **sai** (todo o CRUD de servico vive no fluxo do profissional) e a dependencia de backend `PUT/DELETE /establishment/{id}/service-items/{itemId}` (backend #5) **deixa de ser necessaria p/ o MVP** (rebaixada — ver secao 11). O afiliado adicionar servico (antigo S1) **ja funciona** via "Meus Servicos" (validado 2026-06-28 com prof afiliado).
>
> 🟢 **SELETOR DE PAPEL (2026-06-28, ✅ implementado, aguardando OTA):** o owner **pode ser so administrador** (nem sempre atende). Quem **acumula OWNER + PROFESSIONAL** alterna entre as areas por um botao: no **menu do dono** → "Atender como profissional" (`router.replace("/(professional)/queue")`, so se `isProfessional`); no **Perfil do profissional** → "Area do dono" (`router.replace("/(owner)/dashboard")`, so se papel OWNER). Resolve o gap do roteamento (que priorizava owner e prendia o multi-papel na area do dono) e e por aqui que o dono-que-tambem-atende chega em "Meus Servicos". `getPostLoginRoute` ja tinha o gancho `intent`. Owner-so e profissional-so nao veem botao.

> 🛠️ **DECISAO (2026-06-28): implementar TODO o restante, EXCETO o meio de pagamento** (split/Stripe/Pagar.me fica adiado — ver "Adiado" abaixo). Lista renumerada como backlog de implementacao por prioridade.
> 🔴 **2026-08-24 — esta decisao NUNCA foi revista, e agora e o bloqueio do SaaS.** A Vupth nao tem nenhum endpoint de pagamento/cobranca/assinatura, e a multa de R$ 3,00 que o app ANUNCIA ao cliente nunca chega a ser cobrada. As perguntas que precisam de resposta antes de qualquer codigo estao em [`DECISOES_SAAS.md`](./DECISOES_SAAS.md).
>

1. 🔴 **A solicitacao de corte precisa APARECER na Fila (hoje so ha um ponto de 12px no ☰)** — feedback de device 2026-08-05: *"solicitei corte e nada apareceu na tela do profissional"*. **Diagnostico:** o partner **consome** o fluxo (`GET /attendances/cut-requests` a cada 30s + invalidacao pelo WS `CUT_REQUESTED`), mas o unico sinal na tela da Fila e o **dot vermelho no botao de Opcoes da fila** — compartilhado com refeicao e pendencia de cadastro — e o card com Aceitar/Recusar so existe **dentro** de `queue-options.tsx`. Como o pedido **expira em 5min** (auto-nega server-side), ninguem percebe a tempo. **Decisao do Andre (2026-08-05):** **nao** e banner na Fila — *"pode ser um dot no menu da fila com a numeracao de 1 a 9+ caso sejam mais de 9 notificacoes; dentro dos menus devem existir outros dots para levar o profissional ao local"*. Ou seja: o aviso mora **dentro do menu de Opcoes da fila** (o que e da fila/atendimento fica junto), e o caminho ate ele e uma trilha de sinais. ✅ **IMPLEMENTADO na `dev` (commit `c15526d`), aguardando OTA:** `src/lib/notifications.ts` (`badgeLabel` → "" / "1".."9" / "9+"; `queueMenuCount` = solicitacoes + refeicao) e `src/components/NotificationBadge.tsx` (RN puro **de proposito** — roda em tela v1 e v2 enquanto a migracao durar), ambos com teste. O dot mudo do botao de Opcoes da fila virou **badge numerado**; dentro do menu cada item mantem o proprio sinal (badge nas Solicitacoes com o mesmo "9+", dot na Refeicao). ⚠️ **A pendencia de CADASTRO saiu da conta do badge** — ela ja acende o dot da aba Configuracoes, que e onde se resolve; contar aqui faria o badge apontar p/ um lugar que o menu nao alcanca. ✅ **PORTADO p/ a branch de migracao** no merge `6804bf9` (2026-08-05): a `queue.tsx` casou sozinha e o `QueueOptions` conflitou so no badge — ficou a versao NativeWind consumindo o `NotificationBadge`, que por ser RN puro atravessou sem uma linha de mudanca. ⚠️ **As outras duas hipoteses do sumico (pedido nunca criado / expirado antes de olhar) sao de backend/client** — cobradas no callout de 2026-08-05 do HANDOFF_BACKEND e no **C19** do HANDOFF_CLIENT; **este item vale por si**, porque mesmo com tudo funcionando o aviso de hoje e invisivel.
2. **Readiness gate `waitForBackend()` (cold start do Render) — ✅ IMPLEMENTADO (2026-06-28), ✅ VALIDADO no device (2026-07-25):** `src/lib/readiness.ts` (`waitForBackend`: cutuca `GET {API}/actuator/health/readiness` via `READINESS_URL` da api.ts — raiz do servidor, fora de /api/v1 — com retry+backoff, teto 90s, timeout/tentativa 60s, AbortController; +5 testes jest com relogio injetavel). `src/components/ServerWarmup.tsx` (tela "preparando servidor…" + estado de falha com "Tentar de novo"). `app/index.tsx` segura o roteamento em `phase: warming|failed|ready` — so navega pra `(auth)`/pos-login apos UP (tokens locais carregam em paralelo). *(Andre/backend: Health Check Path = `/actuator/health/readiness` no painel do Render.)*
3. **Animacao de ABERTURA do app** (sec. 12) — ✅ VERSAO BRANDED IMPLEMENTADA (2026-06-28), ✅ VALIDADO no device (2026-07-25): em `ServerWarmup.tsx` (`WarmupAnimation`), sequencia de 4 icones Ionicons verdes (#00B37E) amarrada ao readiness gate (item "Readiness gate", hoje #2): `phone-portrait` (abrir app) → `storefront` (chegar na loja) → `cut` (na cadeira) → `walk` (pronto, sem fila), ~0.8s cada, entrada fade+scale+micro-deslocamento e saida encolhendo (Animated nativo). **Respeita reduce-motion** (troca simples sem movimento). **Futuro:** trocar por **Lottie** quando o design entregar o JSON/icones proprios.
4. 🆕 **Agendados (INTENTION) na cauda da fila** — decisao do modelo **hibrido** (Andre 2026-08-05 parte 2). O backend **ja entrega** o S2 inteiro, mas o partner **nao trata `INTENTION`**: a fila do profissional so mostra quem ja foi promovido, entao ele nao ve o que vem agendado e e pego de surpresa. **A fazer:** exibir os agendados **depois** dos walk-in, visualmente distintos (horario alvo em vez de posicao), sem entrar na contagem da fila viva nem no ETA — a promocao continua sendo do backend, o partner so **reflete**. ⚠️ Antes de codar, confirmar com o backend **em qual read-model** as intencoes aparecem p/ o profissional (o `professionals-with-queue` de hoje traz so a fila viva). Ver **S2** no HANDOFF_BACKEND e **C20** no HANDOFF_CLIENT. ⏳ **Entrou no backlog a pedido do Andre (2026-08-05)** — saiu das intencoes, mas segue **esperando o backend dizer em qual read-model** as intencoes chegam ao profissional.
5. 🆕 **"Abrir meu estabelecimento" (profissional → dono)** — feedback 2026-08-05 parte 2. Hoje **nao ha porta**: o `getPostLoginRoute` so manda ao onboarding do dono quem nao tem papel nenhum. Item em Configuracoes reusando o onboarding que ja existe + `refreshToken`. **Depende das 4 respostas do S23** (pode abrir afiliado? auto-afilia? historico?) — a UI e barata, a regra e que trava. A reputacao ja e portavel (`rating_*` vivem no Professional). ⏳ **Entrou no backlog a pedido do Andre (2026-08-05)** — saiu das intencoes; a UI e barata, o **bloqueio sao as 4 regras do S23**.
6. 📍 **Avisar o dono quando a loja NAO esta geocodificada** — achado ao ler os docs do front-client (2026-08-07): o **GPS foi encerrado no client em 06/08** (backend entregou `?lat&lng&radiusKm` com `distance_km`; a Home do cliente ordena por **distancia pura**). O geocoding roda no **cadastro do estabelecimento**, que e a nossa tela — e o partner **nunca envia coordenadas** (mandamos o endereco; o backend converte). **Se a conversao falhar, a loja some da busca por proximidade e o dono nao fica sabendo.** A fazer: aviso em **Dados do Estabelecimento → Endereco** (*"sua loja ainda nao aparece nas buscas por proximidade; confira o endereco"*). ⛔ **Bloqueado no S25:** hoje o app **nao tem como saber** — falta o backend expor `latitude`/`longitude` (ou um flag) no `EstablishmentResponse`. Enquanto isso, o unico fator sob nosso controle e a **qualidade do endereco** digitado no onboarding (confirmar com eles se numero e CEP sao obrigatorios p/ a geocodificacao acertar).
7. **Maestro E2E** (`/.maestro`): readiness wait (`extendedWaitUntil` 90s) aplicado nos 4 flows; **`test_affiliate` e `test_professional_screens` runnable**. **Pendente:** redesenhar `seed_complete` e `mvp_owner_complete` — criavam servico **pelo owner** (removido na decisao 2026-06-28) e usam o preco antigo (mascara R$ agora = centavos, placeholder "R$ 35,00"). **Plano:** o seed cria um owner que **tambem e profissional**, usa o **seletor de papel** ("Atender como profissional") e cadastra os servicos por "Meus Servicos" (owner-so-admin nao cadastra). Rodar o E2E (nunca rodado).
8. **Migrar Gluestack v1→v2 — 🚧 EM ANDAMENTO (branch `chore/gluestack-update`, desde 2026-07-29), FASEADA.** Escopo medido na decisao de 2026-06-28: **49 arquivos** usam `@gluestack-ui/themed`, **~974 props `$token`**; e **troca de arquitetura** (v2 = NativeWind/`className`), nao bump — por isso **nada de big-bang**: NativeWind roda **ao lado** do v1 e a conversao e tela por tela (o `GluestackUIProvider` fica no `_layout` ate o ultimo arquivo sair).
   - **Toolchain + piloto:** NativeWind v4 instalado, `tailwind.config.js` + `global.css`, tela-piloto isolada.
   - **Primitivas (`src/components/nw/`):** `NwButton` (variantes `primary`/`secondary`/`danger`/`outlineBrand`/`outlineDanger`, sem props de token) e `NwInput` (`label` + `error` string; substitui `Input` + `InputPassword` + `FormControl`). Ambas com teste RNTL.
   - **Batch 1 (in place, mantendo import+API):** `Header`, `ButtonGoBack`, `Loading`, `InputSearch`, `StepsButton` — herdadas por ~todas as telas, sem churn nos calls.
   - **Batch 2 — grupo `(auth)` 100% v2:** login, escolha de papel, cadastro, recuperar senha + `PasswordRules`.
   - **Batch 3 — compartilhados:** `ComingSoon`, `ExpedienteCard`, `Skeleton`, `SelectService`, `ServiceTypeGrid`.
   - ⚠️ **Paleta (armadilha ja corrigida em 2026-07-29):** o `tailwind.config.js` tinha nascido no teal antigo (`#00B37E`) e destoava das telas v1. A escala `brand` do Tailwind **espelha 1:1** a escala `green` do `config/gluestack-ui.config.ts` (**fonte da verdade**, "Verde Marca" `#3b7a3f`). Enquanto a migracao durar, **toda cor nova no `className` sai dessa escala** — v1 e v2 convivem na mesma navegacao e qualquer desvio vira "dois verdes" no app.
   - **Batch 8 (2026-08-07):** `queue-options.tsx` (a tela que hospeda o `QueueOptions`, ja v2) · `settings.tsx` (o menu de cards — o `MenuCard` passou a usar o `NotificationBadge`, entao o badge de convites herdou o **"9+"**, coerente com o padrao pedido p/ o menu da fila) · `add-professional.tsx` (convertida junto da reescrita do fluxo — ver "Feedback 2026-08-07"). **Restam 28 arquivos** (21 telas + os componentes v1 + `_layout` + `renderWithProvider`).
   - **Batch 9 (2026-08-11, apos o QA passar):** `establishment-data.tsx` e `establishment-hours.tsx` (submenu "Dados do Estabelecimento" do dono; os dois campos de horario viraram `NwInput`). **Restam 26 arquivos.** ⚠️ A `establishment-hours` e a tela que o **S27** vai transformar em grade de 7 linhas — converter agora nao atrapalha (o layout muda de qualquer jeito), mas nao vale investir em polimento ali.
   - **Batch 10 (2026-08-11):** `add-guest.tsx` (walk-in — as pilulas de servico e o card de total viraram `className`) e `settings-vinculo.tsx` (convites + desafiliar). **Restam 24 arquivos.**
   - **Batch 11 (2026-08-11):** `settings-account.tsx` — os **quatro cards** (nome, apelido, e-mail, senha) eram blocos identicos copiados e viraram um `FieldCard` no escopo do modulo, que recebe o formulario como `children`. A tela encolheu e os quatro passaram a ter o mesmo comportamento por construcao. 🗑️ **`InputPassWord.tsx` (v1) FOI APAGADO** — esta tela era a ultima que o usava, e o `NwInput secure` cobre o caso. **Primeiro componente v1 a sair da migracao. Restam 22 arquivos.**

### POSSIVEIS IMPLEMENTACOES — intencoes, NAO codar

> ⛔ **REGRA (Andre, 2026-08-05): isto NAO e backlog.** Sao **intencoes de produto** registradas p/ nao se perderem. **Nada aqui vira codigo sem o martelo dele** — nem front, nem cobranca de sprint ao backend. A lista priorizada acima e que e compromisso; esta aqui e mapa do que provavelmente vem.
>
> **Ordem declarada por ele:** a **foto de perfil vem ANTES** do modo agenda (*"foto de perfil acontecera antes, mas nao agora"*).
>
> 📌 **Duas intencoes ja SAIRAM daqui (Andre, 2026-08-05): o hibrido no fim da fila e o "abrir meu estabelecimento" viraram os itens 4 e 5 do backlog priorizado acima.** Restaram as duas abaixo, que continuam sem data.

| Intencao | Quando | O que ja se sabe |
|---|---|---|
| **P1 · Foto de perfil** *(decisao **D3**: onde a imagem mora)* (profissional; avaliar o estabelecimento junto) | **Primeira da fila**, mas **nao agora** | Backend **S22**: o profissional nao tem campo de imagem e nao existe upload em lugar nenhum dos dois apps (so o `url_image` do estabelecimento, que a gente so le). ⚠️ **Custo escondido no front:** `expo-image-picker` e **modulo NATIVO** — **nao sai por OTA**, pede `eas build` + bump de versao + redistribuir o APK. **Juntar com outras mudancas nativas** quando a hora chegar, p/ nao gastar um build so nisso. |
| **P2 · Modo de operacao: fila ou agenda pura** *(decisao **D2**)* (escolha do profissional) | Depois da foto | Backend **S24** · Client **C21**. Sao **dois regimes**, nao uma feature dentro da fila: no modo agenda o horario e **FIXO** (nada empurra). ⚠️ **Nao confundir com P3** (la o horario e estimado e a fila empurra). ⚠️ **Nao "desarquivar" os slots**: descartados em 2026-07-14 **para o modelo de fila** — a decisao segue valendo la. **Impacto:** a tela da Fila assume fila viva em tudo (ETA, "Iniciar proximo", "Fechar fila", promover, adiantar, refeicao no ETA); no modo agenda vira **grade do dia** e ate a abertura derivada da loja precisa de regra propria. **Comeca por mockup**, nao por codigo. |

### 🎨 O DESIGN NOVO (canvas do Figma) — o que existe, o que nao, e o que pedir · 2026-08-12

> ⚠️ **O canvas NAO esta no repositorio.** Andre mostrou prints do Figma com as telas novas (splash, onboarding com fotografia, login social, dashboard do dono com abas, fila do cliente em lima, notificacoes, atendimentos com agendamentos e pedidos de troca). **Conferido:** nenhum desses frames aparece nos docs da branch da marca, e os termos deles (*"Encerrar o dia"*, *"Pausar entrada"*, *"Continuar com Google"*, *"CHEGA DE FILA"*, *"PODE FECHAR O APP"*) tem **zero ocorrencias em todo o historico do repositorio** — e tambem no repo do client. A pasta `design/` so tem os mockups que eu mesmo fiz. **Unica excecao:** *"Chegando na loja"* existe — e o nosso `ServerWarmup.tsx`, ou seja, aquele frame desenha algo **ja implementado**.
>
> **A distancia e de natureza, nao de acabamento.** O commit da marca declara o proprio escopo com honestidade — *"reskin de cor/fonte em 22 telas v1 + 19 NativeWind"*. **Reskin = trocar cor e fonte sem mexer em estrutura.** O canvas mostra **redesenho de produto**: telas novas, navegacao nova, copy novo e **funcionalidade que nao existe** (login social — que e a alternativa registrada no **D9**; "Encerrar o dia"/"Pausar entrada"; abas Inicio/Filas/Menu p/ o dono; barra de progresso do checklist; agendamentos e pedidos de troca, que dependem de **S2** e **S11**; o estado offline da fila, que conversa com o **S29**).
>
> **Documentos de pedido versionados:** `design/PEDIDO_DESIGN.md` (para pessoas) e `design/PEDIDO_PARA_IA_DESIGN.md` (**de IA para IA** — a equipe de design tambem usa Claude). O essencial: **token da API do Figma + file key** (leio os valores exatos por no, muito melhor que PNG) e, sobretudo, **marcar cada frame como `RESKIN` / `RELAYOUT` / `NOVO`** — sem isso o canvas passa a impressao de que falta pouco, e nao falta. ⚠️ **Export de HTML do Figma NAO serve** (div em absoluto, sem traducao p/ React Native, e esconde os valores em CSS gerado).
>
> ✅ **Ja adotado (commit `0a346a0`):** as **telas de entrada** (escolha de papel, login, cadastro, recuperar senha) usam `vupthPrimary`/`vupthOutline` — **o Andre viu no aparelho e aprovou**. O resto do app seguia sem a marca porque `BrandButton` e as variantes `vupth*` estavam em **ZERO telas**: o que mudara ate entao era `bg-brand` (#3b7a3f) → `bg-vupth-forest` (#163300), dois verdes escuros, mais Poppins → Archivo. **A intuicao dele — "os componentes foram criados mas nao implementados" — estava certa, e eu a descartei rapido demais.**
>
> **Proximo passo tecnico, ja medido** (mockup em `design/marca-adocao.html`): trocar o **default do `Button` compartilhado** para o par lima+forest, como o **client** fez (la o remap do componente levou a marca a **24 telas** de uma vez). Risco medido: **apenas 2 chamadas** passam `bg` sem `textColor` e precisam de `textColor="$white"`. ⚠️ **Decisao do Andre:** *"a intencao e que nao haja divergencia, os mesmos componentes, fontes, hierarquia"* — a paridade de **API** so vem quando o client migrar p/ NativeWind (**C15**); ate la igualamos o **resultado visual**.

### 🎨 BRANCH `design/marca-dev` — identidade nova (Pencil), avaliada em 2026-08-12

> **Estado:** **3 commits locais** (nao pushados) sobre `1a42e87`. **Merge so apos a aprovacao visual do Andre.**
>
> **O que a branch faz:** **reskin** — troca **cor e fonte sem mexer em estrutura** (mesmas telas, mesmo fluxo). Tokens `vupth.*` no tailwind e `brandGreen/forest/...` no gluestack, **aditivos**: a escala `green` antiga **nao** foi remapeada de proposito, porque ela ainda e usada como TEXTO e o `#9FE870` e claro demais p/ isso. Fontes **Archivo** (heading/display) + **DM Mono**; Inter segue no corpo. `BrandButton` novo + variantes `vupth*` no `NwButton`. **Medido no codigo:** 22 arquivos usam os tokens novos no NativeWind e 27 no gluestack; sobraram 4 na paleta antiga (`nativewind-pilot`, `CompletionCard`, `nw/Input`, `brand/Button`).
>
> **O que eu acrescentei (3 commits):**
> 1. **Bateria de testes** — a branch mexeu em **57 arquivos e nao tocou em nenhum teste**. Entraram: guarda do **1:1 tailwind × gluestack** (os dois arquivos so tinham COMENTARIO dizendo que precisavam bater — e comentario nao quebra build; "dois verdes" ja custou retrabalho em 29/07), **regra de contraste** (`vupth-green` nunca como cor de texto), **fontes declaradas × carregadas** (fonte sem `useFonts` cai na do sistema e a tela fica "quase certa"), `BrandButton` e as variantes `vupth*`. **Jest verde: 40 suites / 440 testes.**
> 2. **`sessionStorage` no shim + `public/_headers` com CSP** — as duas mitigacoes do **D8**. *(Um **shim** e uma peca de encaixe: finge ser o pacote real p/ o resto do codigo nao perceber a diferenca — aqui, `expo-secure-store` na web.)*
> 3. 🐛 **`expo-notifications` carregado sob demanda** — no **Expo Go** ele **grita no proprio import** desde o SDK 53, e como o hook e importado pelo `_layout`, o erro subia **antes de qualquer tela**. O arquivo ja tinha try/catch em toda chamada, o que **nao adianta quando o problema e o import**. Agora so carrega onde push existe (`pushSupported`, funcao pura +testes) — destrava o Expo Go **e entrega o item A4 do caminho web de brinde**.
>
> ⚠️ **Armadilhas do dia, p/ nao repetir:** (a) **`git pull`** — foi a causa real do "continuo vendo as telas antigas" (a branch local estava atras do origin); (b) quem trocar p/ esta branch precisa de **`npm install`** (Archivo/DM Mono), senao o `tsc` falha no `_layout`; (c) **`npx expo start -c`** — o NativeWind compila o tailwind em build-time e o cache guarda a paleta velha; (d) **nao trocar de branch com o Metro rodando** (eu fiz isso em 12/08 e o bundle saiu da branch errada); (e) o **fundo global** segue no off-white antigo (`#F7FAF8` no `_layout`) enquanto a marca nova define `background #FFFFFF` / `surface #F3F5F1` — ponta solta do reskin.
>
> **Merge:** simulado com `git merge-tree` contra a `chore/gluestack-update` → **ZERO conflitos** (depois de reverter o adaptador de storage). **Ordem combinada:** `design` → `dev` (apos o OK visual) → `dev` → `chore` → seguir a migracao **ja com a marca**, senao as 22 telas restantes nascem na paleta velha e viram repintura.

### 🚀 PREPARAR PUBLICACAO — web (A) e lojas (B) · decisao **D8**

> ✅ **ESTADO EM 2026-08-27 — O ACESSO POR LINK ESTA DE PE (preview).** `https://dev.vupth-partner.pages.dev` abre, carrega e fala com o Render. **A2 e A3 ENTREGUES.** A producao (`vupth-partner.pages.dev`, branch `main`) so fica completa quando o Railway receber a origem no `CORS_ALLOWED_ORIGINS`. **Foram TRES defeitos empilhados, cada um escondendo o proximo** — CORS ausente no backend, fontes descartadas pela Cloudflare, e o portao de fonte que preferia esperar para sempre. Ficha completa no item **A7**.
>
> **Estado anterior:** o **A (web)** comeca agora. O **B (lojas)** fica **preparado** — Andre quer subir na **Play Store E na Apple Store**. ⚠️ Isto **reabre o iOS**, adiado em 2026-08-11 por causa dos US$ 99/ano (nota na secao 14).

**A · Versao web — o que falta**

| # | Item | Quem | Nota |
|---|------|------|------|
| A1 | **Adaptador de storage** (`SecureStore` no nativo, `localStorage` na web) atras de uma interface unica | front | **O bloqueio**: `expo-secure-store` esta em **19 arquivos** e nao existe na web. Mexe em token — entra com teste. |
| A2 | `expo export --platform web` + secao `web` no `app.json` | front | Expo Router funciona na web; `output: "single"` (SPA) ou `"static"`. |
| A3 | **Hospedar** com preview por branch | front + Andre | **Cloudflare Pages / Netlify / Vercel** — free, cada branch com URL propria a cada push. Resolve tambem o **teste do visual do design**. |
| A4 | **Gates de plataforma** onde a web nao tem o recurso | front | Esconder/desabilitar: "Verificar atualizacao" (`expo-updates`), registro de push, e qualquer coisa que assuma aparelho. Sem isso, quebra ou promete o que nao entrega. |
| A6 | 🆕 **Assumir a limitacao na tela e oferecer o app** *(decisao do Andre, 2026-08-12)* | front | Ele fechou o buraco do push pela via honesta: *"pelo navegador nao tem notificacao e logo abaixo oferecer link para baixa-lo"*. **A fazer:** faixa **so na web** (`Platform.OS === "web"`) dizendo em uma linha o que falta — **"no navegador voce nao recebe aviso de cliente novo; a fila atualiza so com esta aba aberta"** — e, embaixo, **"Baixar o app"** apontando p/ a loja (ou p/ o APK ate a Play sair). ⚠️ **Onde ela precisa aparecer:** na **Fila** (e onde a falta de push machuca) e no **login/entrada** (antes de o testador tirar conclusao errada). ⚠️ **Nao repetir em toda tela** — vira ruido e as pessoas param de ler. **Dispensavel guardar** ("nao mostrar de novo") ate a sessao acabar. **Barato:** o gate ja existe (`pushSupported`), entao a faixa so consome o mesmo sinal. |
| A7 | 🔴 **A Cloudflare Pages APAGA `node_modules` do deploy — e isso derrubava o app inteiro** *(medido 2026-08-27)* | front ✅ **RESOLVIDO** | O `expo export --platform web` grava os assets **espelhando o caminho de origem**, entao os TTFs saiam em `dist/assets/node_modules/@expo-google-fonts/...`. A Pages **exclui `node_modules` por design** ([known issues](https://developers.cloudflare.com/pages/platform/known-issues/)) e descartava a pasta **em silencio**. Toda URL de fonte respondia **`200` com `content-type: text/html`** — o fallback de SPA devolvendo o `index.html`. O `useFonts` baixava isso esperando um TTF e **nunca resolvia**. ⚠️ **A licao que generaliza: `200` nao significa que o arquivo existe** — com fallback de SPA tudo responde 200, e quem distingue e o **`content-type`**. **Correcao (1):** os 8 TTFs vivem em `assets/fonts/`, fora de `node_modules` (de brinde, o export caiu de 42 fontes para 8). **Correcao (2), a mais importante:** o portao virou `fontLoaded \|\| fontError` — fonte que nao carrega **degrada para a fonte do sistema, nunca prende o app**. O defeito nao foi a fonte faltar; foi o app **decidir esperar para sempre**. Tres guardas em `brandTokens.test.ts`. |
| A5 | **QA proprio da web** | Andre | O que muda: sem push (so WS com a aba aberta), teclado/scroll diferentes, e as telas ainda em gluestack podem divergir mais (o NativeWind compila p/ CSS de verdade). |

**B · Lojas — o que falta**

| # | Item | Quem | Nota |
|---|------|------|------|
| B1 | **Conta Play Console** (US$ 25, uma vez) | Andre | Teste interno: ate 100 testadores, **sem revisao**, link direto. |
| B2 | **Conta Apple Developer** (US$ 99/ano) | Andre | TestFlight. **Reabre a decisao de iOS**. |
| B3 | **Perfis iOS no `eas.json`** + `eas device:create` + chave **APNs** | front | Hoje os tres perfis sao **so Android**. O `expo-notifications` exige a APNs. |
| B4 | **Assets de loja**: icone (ja existe), **feature graphic**, screenshots por tamanho, descricao curta/longa, categoria | Andre + design | E o que mais atrasa publicacao na pratica. |
| B5 | **Politica de privacidade** (URL publica) + **Data Safety** (Play) e **Privacy Nutrition Labels** (Apple) | Andre | **Obrigatorio nas duas lojas.** Declarar o que coletamos: e-mail, nome, localizacao (GPS do client), token de push. |
| B6 | **Exclusao de conta dentro do app** (**S19**) e **URL publica de exclusao** | backend + front | **Exigencia das duas lojas** desde 2022/2023 — sem isso a submissao e **recusada**. Ja registrado como S19; agora virou bloqueio de publicacao. |
| B7 | `version`/`versionCode` e `autoIncrement` | front | O perfil `production` ja tem `autoIncrement`; conferir a numeracao antes do 1o envio. |
| B8 | **AAB de producao** + subir | front + Andre | O perfil `production` ja gera **app-bundle**, que e o formato da Play. |

> ⚠️ **O B6 e o item que costuma pegar as equipes de surpresa:** as duas lojas **rejeitam** app com login que nao ofereca exclusao de conta pelo proprio app **e** por uma URL publica. Como o backend **nao tem o endpoint** (S19), isso deixou de ser "pedido do Andre" e virou **pre-requisito de publicacao**.

### 🧪 QA EM ANDAMENTO — bundle da migracao no canal `preview` (2026-08-05)

> **Estado em 2026-08-07:** o canal tem o update **`"migracao + badge + diagnostico ws"`** (verificado no `eas update:list`), que junta **quatro** entregas: migracao (7 batches), **badge com contagem**, **"Iniciar proximo"** e o **diagnostico de WS** — mais o heartbeat declarado. Git **0/0 nas duas branches**; gate verde no push (**401 testes**, cobertura 98.39% stmts / 99.48% lines). **Nada disso foi visto rodando ainda.** ⚠️ **Lembrete de mensagem:** o prompt do `eas update` pre-preenche com a mensagem do ultimo commit (multi-linha) — usar `--message "<uma linha>"`, que e a mesma armadilha do `--message` do workflow, de junho.
>
> **Publicado** com `eas update --branch preview` rodado de dentro da `chore/gluestack-update`. O canal tinha antes o bundle da **`dev`** (v1 + badge), subido pelo workflow no push da `dev` — foi **sobrescrito**. ⚠️ **Enquanto este QA durar, nao pushar a `dev`**: o `eas-update.yml` publicaria por cima e devolveria o v1 ao canal.
>
> **Como puxar no aparelho:** Configuracoes (profissional) ou menu do dono → **"Verificar atualizacao"** (`OtaUpdateButton`: `checkForUpdate` → `fetch` → `reload`, sem precisar fechar o app 2x). Logo acima do botao aparecem o **id do OTA e a data/hora da publicacao** — conferir que batem com a publicacao antes de comecar, senao o update nao aplicou.
>
> **E a PRIMEIRA VEZ que os 7 batches rodam em aparelho** (nada da migracao foi visto rodando desde 29/07). Roteiro, por batch:
>
> | Area | O que olhar |
> |---|---|
> | **(auth)** | login · cadastro (checklist de senha ao vivo + "senhas conferem") · escolha de papel · recuperar senha *(o texto "se este e-mail estiver cadastrado" segue o antigo — e o S21, pendente no backend)* |
> | **Onboarding do dono** | dados da loja (pilulas de tipo) · endereco (mascara de CEP, auto-preenchimento, UF maiusculo) · servicos · tambem-profissional |
> | **Onboarding do profissional** | os 3 passos |
> | **A FILA** (mais critica) | card "atendendo agora" com cronometro (pausar/retomar/finalizar) · selos atrasado/aguardando · card inteiro clicavel abrindo o menu de acoes · **"Iniciar proximo" fixo no rodape — a lista nao pode empurrar** |
> | **Badge** | numero no botao de Opcoes da fila · refeicao na janela sozinha = 1 · solicitacoes somam · some ao zerar · dentro do menu: numero nas Solicitacoes, dot na Refeicao |
> | **WS / corte** | o fix `59a3b9b` (token fresco) foi junto neste bundle — pedir um corte pelo app cliente com a fila fechada e ver se o badge acende |
>
> **Duas armadilhas desta migracao, que passam despercebidas:**
> 1. **`autoCapitalize`** — nome e endereco tem de continuar capitalizando sozinhos. E regressao de COMPORTAMENTO, nao de visual.
> 2. **Dois verdes** — 23 telas seguem em gluestack e convivem com as convertidas; desvio de paleta aparece na navegacao entre elas.
>
> **Escape hatch:** se algo quebrar feio, `eas update --branch preview` rodado de dentro da **`dev`** devolve o bundle v1 ao canal na hora.
>
> ✅ **RESULTADO (Andre, 2026-08-11): "nesta versao nao vi nenhuma falha nas telas".** Os 7 batches convertidos passaram no device — **a primeira vez que a migracao roda em aparelho** desde 29/07. O que apareceu no teste **nao era de tela**: falha de handshake do WS (**cold start do Render, S29**), Relatorios com status velho (aba que nao remontava — corrigido), a ultima opcao do action sheet atras da barra de gestos (corrigido) e itens de regra (**S28**). ⇒ **O bloqueio do merge caiu.**
>
> **Resultado (historico):** validado ⇒ **push da branch + merge na `dev`** (o objetivo declarado: a branch nunca foi vista rodando, e era esse o bloqueio do merge).

> **QA no celular (continuo):** validar cada entrega acima via OTA. _(Validado 2026-06-28: criar/editar/remover servico do **profissional** OK; mascara R$ OK; tab bar nova OK; menu do owner-nao-profissional sem "Adicionar Servico".)_
>
> **Adiado (decisao do usuario 2026-06-28):** **meio de pagamento real / split de taxas** (Stripe/Pagar.me; unificar `src/utils/pricing.ts` e `src/lib/pricing.ts`). Fora do escopo atual; retomar pos-MVP.

> **Concluidos** (bugs do teste 2026-06-05 e itens Alta/Media/Baixa prioridade ja entregues) foram **removidos desta lista** para nao acumular — o historico esta no git. Itens que dependem do backend estao na secao 11.

### Teste manual 2026-08-11 (5 itens) — 1 ja estava pronto, 1 feito agora, 3 no backend

> ⚠️ **O item 1 desta lista JA ESTAVA IMPLEMENTADO** desde 2026-08-07 (commit `7c7c78a`) — ele reapareceu no teste porque **o bundle do canal `preview` e de 07/08** e as entregas seguintes **nao foram publicadas** (decisao consciente: nao trocar o bundle no meio do QA). **Licao:** segurar o OTA fez o Andre testar codigo velho e reportar de novo o que ja estava resolvido. **Publicar antes do proximo teste manual.**

| # | Feedback | Dono | Situacao |
|---|----------|------|----------|
| 1 | *"quando o proprietario tiver na pendencia de profissional com servico quero que apareca a opcao de tambem ser um profissional"* | partner | ✅ **JA FEITO em 07/08** (`7c7c78a`): a tela abre com "Quem vai atender?" e tres caminhos nomeados. **So falta chegar no aparelho** — ver o aviso acima. |
| 2 | *"email nao chegou e passou mesmo sem ter cadastro"* | **backend** (S7 + S21) | 🔴 **Dois defeitos ja registrados, agora com prova em device.** O e-mail **nao saiu** (S7 — pior que o "reenvio nao chega" de 07-23: agora **nenhum** e-mail sai, e recuperar senha e o unico caminho que existe) **e** a tela **seguiu para o passo do codigo** com e-mail inexistente, porque o backend responde 200 sempre (S21). Juntos, dao o pior cenario: sem e-mail e sem erro, **todo** teste parece igual. Consertar o S21 sozinho ja resolve metade. |
| 3 | *"Voce tambem sera profissional? Ou voce pretende abrir um novo estabelecimento ou se afiliar a um?"* | **backend** (S23) + partner | ⛔ **Buraco no ONBOARDING do profissional.** Quem escolhe "sou profissional" cria o perfil no 1o passo e cai **direto em "Buscar Estabelecimento"** — a pergunta *"vai abrir a sua propria loja ou se afiliar a uma?"* **nao existe**, entao o dono que se identificou como profissional fica preso no fluxo de afiliacao. E como o perfil **ja foi criado**, isso cai na pergunta do **S23**: o `quick-create` de estabelecimento aceita quem ja e PROFESSIONAL? **A UI e barata (uma bifurcacao no passo de busca); nao codo antes da resposta** porque um caminho que devolve 403 e pior que caminho nenhum. |
| 4 | *"deve haver opcao de trabalhar em dias com horarios especificos"* | **backend** (S27) + partner | ⛔ **O contrato so tem UM `opening_time`/`closing_time` p/ a semana inteira.** Nao da p/ dizer "domingo fechado" nem "sabado ate as 18h". Nao e cosmetico: o horario alimenta o **gate de entrada na fila**, o **auto-fechamento** e a **grade de refeicoes** — com horario unico, a loja "abre" no domingo. Backend precisa modelar a semana; a tela `establishment-hours` vira grade de 7 linhas. |
| 5 | *"tirar a opcao adicionar servicos do proprietario"* | partner | ✅ **FEITO (2026-08-11).** O item "Adicionar Servico" **saiu do menu do dono** e o onboarding `also-professional` passou a mandar p/ **"Meus Servicos"** (area do profissional) em vez da tela de servico do dono. Fecha a decisao de 2026-06-28 (*servico e capacidade do PROFISSIONAL*): antes havia duas portas p/ a mesma coisa, e a do dono sugeria que o servico era da loja. A tela `add-service.tsx` continua no repo (rota `href:null`) mas **nada mais aponta p/ ela**. |

### Feedback 2026-08-07 — a pendencia tem de mostrar a SAIDA · ✅ IMPLEMENTADO

> **Andre:** *"quando o proprietario tiver na pendencia de profissional com servico quero que apareca a opcao de tambem ser um profissional. A intencao e sempre levar o usuario a um caminho, neste caso a solucao."*

**O que estava errado.** A pendencia **"1+ profissional com servico"** (a que impede a loja de aparecer aos clientes) levava a `add-professional`, e la o dono NAO-profissional caia direto num **formulario de nome + especialidade** sob o titulo *"Adicionar Profissional"*. O formulario criava **o perfil dele proprio** — mas nada na tela dizia isso. Quem lia entendia *"cadastrar outra pessoa"*, nao percebia que a saida mais rapida estava ali, e o item continuava pendente.

**Pior:** havia **duas portas divergentes** para a mesma intencao — o **menu** desviava o dono nao-profissional p/ o onboarding `also-professional`, enquanto o **checklist** mandava p/ `add-professional`. Telas diferentes, mesma decisao.

**Como ficou** (`add-professional.tsx`, ja convertida p/ NativeWind no mesmo passo):
- A tela abre com a pergunta **"Quem vai atender?"** e explica a regra em uma linha (*a loja so aparece com 1+ profissional com servico*).
- **Tres caminhos nomeados**, em cards: **"Eu tambem vou atender"** (so p/ quem ainda nao e profissional; diz explicitamente que cria **o SEU** perfil e que voce passa a ter fila propria) · **"Convidar um profissional"** (→ `invite-professional`) · **"Ver solicitacoes"** (→ `affiliations`).
- O **formulario so abre depois** de escolher o primeiro caminho — a escolha e que nomeia o que vai acontecer.
- Ao criar, o alerta **encadeia o proximo passo**: perfil criado ainda **nao** destrava a loja (falta servico), entao ele oferece **"Cadastrar servicos"** em vez de so "OK". Sem isso o dono trocaria uma pendencia por outra sem saber.
- **Porta unica:** o menu passou a apontar p/ a mesma tela (o desvio p/ `also-professional` saiu; a tela de onboarding segue existindo p/ o fluxo de cadastro inicial).

### Feedback 2026-08-05 (parte 2) — 4 decisoes de produto

> Registro; **nada codado**. A logo saiu da mesa: *"vou decidir a logo pelo lado do cliente"* — o mockup `design/queue-menu-logo.html` (4 versoes: logo cheia vs so o V, botao branco vs verde) fica esperando a decisao vir de la, e ate entao o `BenchIcon` continua.

| # | Feedback (palavras do Andre) | Dono | Situacao |
|---|------------------------------|------|----------|
| 6 | *"Para o final da fila quero que o app seja hibrido, podendo ser por fila ou por agenda"* | **client** (UI) + **partner** (exibir) | 🎯 **Confirma o modelo que ja estava especificado** (backend **S2/INTENTION completo**: create/edit/cancel, promocao event-driven, agenda view, availability por profissional). Quem chega no fim da fila escolhe **entrar agora** (walk-in) **ou agendar** (INTENÇÃO promovida quando o fim da fila cruza o horario). **Gargalo: a UI do CLIENT** (C20/C12/C6). 🆕 **Novo p/ o partner:** hoje o app **nao trata `INTENTION`** (grep vazio) — a fila so mostra quem ja foi promovido. Com o hibrido assumido, o profissional precisa **ver os agendados na cauda da fila**, distintos dos walk-in. Virou pendencia nossa (lista priorizada). |
| 7 | *"Adicione tambem a possibilidade de foto de perfil"* | **backend** (S22) + partner | ⛔ **Bloqueado, e o mais caro dos quatro.** O unico campo de imagem no contrato e o `url_image` do **estabelecimento**, e o partner so **le** — nao existe upload em lugar nenhum dos dois apps. O **profissional nao tem foto**, e e a dele que o cliente ve p/ escolher. Backend precisa do campo + caminho de upload (URL pre-assinada e o padrao, poupa banda do Render). ⚠️ **Do nosso lado o custo nao e a tela:** escolher foto exige `expo-image-picker` (+ provavel `expo-image-manipulator`) = **modulo NATIVO**, que **nao sai por OTA** — pede **`eas build` + bump de versao** e redistribuir o APK (ver secao 14). **Juntar com outras mudancas nativas** p/ nao gastar um build inteiro nisso. |
| 8 | *"Deve haver um fluxo para quando o profissional decide abrir o proprio estabelecimento, ja tendo avaliacoes e historico no app"* | **partner** (UI) + **backend** (regra) | 🟡 **A UI e barata; o que trava e a regra de negocio.** **Achado:** o `getPostLoginRoute` ([routing.ts](../lib/routing.ts)) so leva ao onboarding do dono **quem nao tem papel nenhum** — quem **ja e PROFESSIONAL** cai direto na Fila e **nao tem porta** p/ virar dono; o botao "Area do dono" so aparece p/ quem **ja acumula** os dois papeis. Falta o item **"Abrir meu estabelecimento"** em Configuracoes, reusando o onboarding do dono que ja existe inteiro (+ `refreshToken` p/ o papel novo entrar no JWT → cai no seletor de papel existente). ✅ **A reputacao ja acompanha a pessoa:** `rating_average`/`rating_count` vivem no **Professional**, nao no vinculo — nao ha migracao de dados a fazer. ⛔ **Antes de codar, 4 respostas do backend (S23):** o `quick-create` aceita quem ja e PROFESSIONAL? pode abrir a propria loja **estando afiliado a outra** (nossa leitura: desafiliar antes)? o historico da casa antiga segue no relatorio pessoal dele? ao abrir, ele se **auto-afilia** como profissional da propria loja? |
| 10 | *"O profissional podera escolher se usara fila (modelo que estamos criando), ou se apenas agenda onde os horarios sao fixos"* | **backend** (S24) + partner + client | 🕐 **O pedido mais estrutural do dia — sao DOIS REGIMES DE TRABALHO, nao uma feature dentro da fila.** ⚠️ **Nao confundir com o item 6:** ali quem escolhe e o **cliente**, no fim da fila, e o horario e **estimado** (INTENÇÃO, a fila empurra); aqui quem escolhe e o **profissional**, e no modo agenda o horario e **FIXO**. ⚠️ **E nao "desarquivar" os slots por engano:** em 2026-07-14 slots foram **descartados** (`design/availability-options.html`) — mas aquela decisao valia p/ agendar **dentro do modelo de fila**; o modo agenda e outro regime, e as duas decisoes convivem. ⛔ **Partner bloqueado ate o contrato (S24) existir**, e o impacto e grande: a tela da Fila e o menu de Opcoes assumem fila viva em **tudo** — ETA, "Iniciar proximo", "Fechar fila", promover, adiantar, refeicao entrando no ETA. No modo agenda a tela vira **grade do dia** e metade desses conceitos perde sentido; ate a **abertura derivada da loja** (1o "Trabalhando" abre) precisa de regra propria. **Pede mockup e decisao de UI antes de qualquer codigo.** |
| 9 | *"Vou decidir a logo pelo lado do cliente"* | — | ⏸️ **Fora da mesa por ora.** O `BenchIcon` (banco) continua no botao de Opcoes da fila ate a decisao chegar do client. Mockup pronto em `design/queue-menu-logo.html`; a troca e cirurgica (um componente isolado). ⚠️ Se a escolha for a **logo completa**, vale pedir ao design o **SVG original** — o PNG borra as linhas de velocidade em 22px, e a alternativa vetorial que desenhei e aproximacao. |

### Feedback de device 2026-08-05 (5 itens) — 1 e nosso, 4 dependem do backend

> Registro do que o Andre observou no aparelho. **Sem codigo ainda** — o unico item que o front-partner resolve sozinho e o (1); os outros quatro estao **bloqueados por contrato** e foram cobrados no HANDOFF_BACKEND como **S18–S21**.

| # | Feedback (palavras do Andre) | Dono | Situacao |
|---|------------------------------|------|----------|
| 1 | *"Solicitei corte e nada apareceu na tela do profissional, nem confirmacao na tela do cliente"* | **Partner** (a metade do aviso) + **client** + **backend** | 🔴 **Partner: virou o item #1 da lista priorizada acima** (banner na Fila com countdown; hoje so ha o dot de 12px no ☰, e o pedido morre em 5min). **Client: C19** (nenhuma confirmacao ao enviar + estado "aguardando" com contagem). **Backend:** confirmar se o `CutRequest` foi criado e se o `CUT_REQUESTED` foi publicado — callout de 2026-08-05 no HANDOFF_BACKEND, que separa as 3 hipoteses. |
| 2 | *"A receita do profissional deve ser decrescida da porcentagem do app; ele so recebe o acordado no momento da criacao do servico"* | **Backend** (S18) | ⛔ **Bloqueado — o dado nao existe.** Na criacao do servico o front calcula `{clientPrice, proReceives, platformFee}` mas **envia so o `price` = `clientPrice`**: o valor acordado e a **absorcao escolhida** nunca sao persistidos, entao o relatorio so pode somar o bruto e o front **nao tem como derivar** o liquido. Backend precisa guardar `professionalAmount`/`absorptionPercent` e expor `professionalRevenue` nos relatorios. **Depois:** `reports.tsx` e `my-day.tsx` passam a mostrar o liquido como numero principal. |
| 3 | *"Deve haver a opcao de apagar a conta"* | **Backend** (S19) + partner | ⛔ **Bloqueado — nao existe endpoint** de exclusao de conta em lugar nenhum. Alem do pedido, e **exigencia de Google Play/App Store** (exclusao iniciada pelo usuario dentro do app) e de LGPD. Backend precisa decidir anonimizacao vs delecao, o caso do **owner com loja e profissionais vinculados** e o gate de fila viva. **Depois:** item "Apagar minha conta" em Dados cadastrais, em vermelho, com dupla confirmacao + senha. |
| 4 | *"Durante a experiencia de criar um estabelecimento tentei mudar o tipo de servico e vi que nao e possivel"* | **Backend** (S20) + partner | ⛔ **Bloqueado — contrato.** O `serviceType` so entra no `POST /establishment/quick-create`; o `PATCH /establishment/{id}/general-infos` **nao aceita** o campo (so nome/telefone/instagram/horario). O seletor do onboarding funciona (pilulas livres) — o que falta e o **caminho de edicao depois**. **Depois:** campo "Tipo de Loja" em Dados Cadastrais reusando o `SelectService`. |
| 5 | *"Nao quero no esqueci minha senha o popup 'se este e-mail for cadastrado' — quero que o backend verifique antes"* | **Backend** (S21) + partner | ⛔ **Bloqueado — decisao de produto ja tomada pelo Andre.** O texto atual existe porque o backend responde **200 sempre** (anti-enumeracao). Backend passa a responder **`404 EMAIL_NOT_FOUND`**. ⚠️ Trade-off registrado no S21 (resposta diferenciada permite descobrir quem tem conta; mitigar com **rate limit**) — **a decisao do Andre esta mantida**. **Depois:** mensagem afirmativa + erro no proprio campo, sem popup, e `EMAIL_NOT_FOUND` no `ERROR_MESSAGES_PT`. |

### Teste manual 2026-06-28 (12 feedbacks) — status

**✅ Entregue e validado pelo usuario via OTA:** skeleton de Atendimentos nao convive mais com cards antigos; animacao de abertura com 1 ciclo minimo (`WarmupAnimation`/`MIN_SPLASH_MS`); busca de estabelecimento auto-carrega no onboarding; **"Verificar atualizacao"** (OTA) — `OtaUpdateButton.tsx` (checkForUpdate→fetch→reload, espelhado do client) no Config do profissional + menu do dono; adicao de servico OK (o **feedback explicito** no lugar do return silencioso resolveu — preco vazio era a causa); **validacao de cadastro AO VIVO** (`getPasswordRules` + `PasswordRules.tsx`: checklist de senha + "Senhas conferem", espelhado do client).

**✅ Entregue em codigo (commits pos-`5e6ef9e`, pushados, aguardando QA no celular via OTA):**
- **#2 atalho de login/cadastro vira Button** (`7de7afd`): o `<Link>` de texto ("Login"/"Criar Conta") virou **`<Button variant=outline>` estilizado** (= front-client) em login/register/(auth); tambem o "Entrando..." no submit.
- **#3 sugestao de tipo SUBSTITUI o nome** (`9a99fdc`): tocar numa sugestao de tipo agora **sobrescreve** o "Nome personalizado" (antes so preenchia se vazio), em add-service + my-services.
- **#4 tempo corrido do atendimento** (`7833d72`): contagem **100% no front via inicio cacheado localmente** (sem backend), alinhado ao front-client.
- **#7/#11 tela de "tipo de servico" em grade de chips** (`f555c8e`): novo `src/components/ServiceTypeGrid.tsx` (grade de chips com icone) substitui o seletor pobre, em add-service + my-services.
- **#1 read-back do endereco** (`882b368`): a tela **le de volta** o endereco salvo (`fetchEstablishmentById` → `data.address`). ✅ **DESBLOQUEADO** — backend passou a expor `EstablishmentResponse.address` (`a58704f`, 2026-07-09); liga sozinho. Falta QA no celular.
- **Card ATRASADO sem "Voltar a fila"** (`3d18f27`): removido o botao `undo-late` do card (o retorno a fila passa a ser via **promover** — S4 backend).

**#6 profissional abrir/fechar — toggle bruto ENTREGUE, evoluindo p/ S1 (2026-07-09).** O **toggle bruto** (backend `7819914` + front `setOpenStatus`): `PATCH /establishment/{id}/open-status` liberado ao `PROFESSIONAL` afiliado; card **Abrir/Fechar** na "Minha fila". Funciona, mas e um booleano compartilhado. **Modelo acordado (Andre, 2026-07-09) = S1:** o profissional muda o **proprio status** (`trabalhando`/`intervalo`/`indisponivel`) e o `open_status` da loja vira **derivado/read-only** (`aberto ⇔ ∃ profissional trabalhando ou em intervalo`; so fecha quando **todos** ficam `indisponivel`). No status `indisponivel` o **cliente pode agendar** no card do profissional (dias da agenda liberada → liga ao S2/calendario secao 12). **Spec completa em [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) — "Detalhe — S1".** Front-partner depois: trocar o card por seletor de status; `open_status` so exibido.

**⬜ ABERTOS (do teste 2026-06-28):**
1. **Endereco do establishment** — ✅ **DESBLOQUEADO** (backend `a58704f`, 2026-07-09): `EstablishmentResponse.address` embutido; front ja lia o campo (read-back, `882b368`). Falta QA no celular.
2. **Refeicoes — Modelo B (janela flexivel)** — ✅ **spec escrita** (secao 11.2, "Refeicoes — MODELO B"). Usuario escolheu janela flexivel (encaixa sozinho em buracos; so pergunta adiantar/adiar em fila continua; supressao por janela 3h/fechamento). **A fazer:** grosso e **backend** (placement + auto-supressao no ETA meal-aware — ver secao 11 S3); front faz popup adiantar/adiar + lapis + "almoco iniciado as HH:MM" (`actualStartTime` ja exposto). Skip #41 e edicao ja existem.
3. **#10 exibir avaliacoes recebidas (rating)** — 🟢 **DESBLOQUEADO (confirmado pelo backend 2026-07-04): os agregados JA vem prontos.** `POST /attendances/{id}/rating` existe (#6; client envia a nota) **e** `GET /establishment/id/{id}/professionals-with-queue` **ja popula** `rating_average`/`rating_count` **por profissional** (`ProfessionalWithQueueResponse.fromEntity`) **e por service item** (itens aninhados). **Front-partner (da pra fazer agora):** exibir media/contagem no card do profissional (e opcionalmente por servico). **NAO ha pendencia de backend aqui.** (O "nome do cliente clicavel p/ infos" segue dependendo de perfil publico do cliente, que ainda nao existe.)
4. **#12 migrar Gluestack v1→v2** — ⏸️ **ADIADO** (tech-debt pos-MVP, decisao 2026-06-28; ver secao 10 lista principal #4).

**🟢 DESBLOQUEADO pelo backend (alinhamento 2026-07-03) — novos afazeres front-partner:**
- **Notificacoes push** — ✅ backend CONCLUIDO (device token + disparo Expo). **Front-partner:** apos o portao de readiness, pedir permissao, obter Expo Push Token, `POST /devices {token, platform}`; no logout `DELETE /devices/${encodeURIComponent(token)}`; tratar `data.type` (`QUEUE_NEXT_IN_LINE`, `ATTENDANCE_STARTED`, `ATTENDANCE_FINISHED`, `SWAP_*`). WS segue para foreground; push cobre background/fechado. (Mesmo handoff do client.)
- **Marcar no-show do cliente LATE** — ✅ backend CONCLUIDO `PATCH /attendances/{id}/no-show` (#39 escalada; exige o atendimento em `LATE`, senao `400`; sucesso → `CANCELLED` + strike). **Front-partner:** botao "marcar no-show" no card do cliente **ATRASADO** (LATE). Complementa o fluxo LATE (#19) que ja existe.
- **Exibir rating recebido** — ✅ backend COMPLETO (endpoint + agregados ja no `professionals-with-queue`, confirmado 2026-07-04). Front-partner: mostrar media/contagem no card do profissional. Sem dependencia de backend.

**🗂️ ORDEM DE EXECUCAO ACORDADA (Andre 2026-07-04):**
1. ✅ **Push notifications** — feito e pushado (commit `d751529`); falta EAS Build + FCM + teste no aparelho.
2. ✅ **Botao "no-show"** no cliente ATRASADO (LATE) → `PATCH /attendances/{id}/no-show` — **FEITO** (commit `60c5835`, OTA-puro; +teste de store). Botao "Nao compareceu" no card do cliente ATRASADO, com confirmacao.
3. ✅ **Atender fora de ordem** ("Adiantar") via `PATCH /attendances/{id}/start` direto — **FEITO** (commit `2489299`, OTA-puro). Cards fora do 1o lugar ganham botao **"Adiantar"** → confirmacao "tem certeza?" → inicia o atendimento na frente da fila. **Decisao 2026-07-04:** start **direto** (nao reordena os demais) satisfaz o "adiantar"; o **promover-ao-topo/reordenar** (S4) segue como versao futura (item 8), nao bloqueia.
4. **Exibir rating recebido** no card do profissional (agregados ja vem prontos). OTA-puro.
5. ✅ **Read-back do endereco** — **DESBLOQUEADO** (backend `a58704f`, 2026-07-09): `EstablishmentResponse.address` embutido; front ja lia `data.address` → **liga sozinho**. Falta QA no celular.
6. **Fechar loja com confirmacao + gate** — ✅ **gate 409 FEITO** (backend `0b63678` `ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES` + front trata no dashboard e na fila, 2026-07-09). **BUG1 ainda aberto** — e **EVOLUIU (Andre 2026-07-14): a loja NAO pode "dormir aberta".** Supersede o "NAO auto-fechar" de 2026-07-04: agora **HA auto-fechamento**, porem com **prompt + carencia de 15min** (timer **server-side** — o celular dorme). O profissional e chamado a **sinalizar** o fechamento (ao terminar atendimento apos o horario / ao passar do `closing_time`); se **nao sinaliza em 15min → auto-`indisponivel`**. Gate de "solicitar corte" fora do horario ganha **timeout → auto-nega**. Bloquear novas entradas + `is_open` efetivo permanecem. **Front so avisa/prompt**; a garantia (timer + gate) e do backend. **Spec: HANDOFF_BACKEND "Detalhe — BUG1" (nota 2026-07-14).**
7. **Expediente (inicio/fim) nos relatorios** — 🆕 (2026-07-04) exibir "Expediente: HH:MM–HH:MM" nos relatorios do owner e do profissional; espera **S5** (backend registrar/expor abrir-fechar). Ligado ao item 6.
8. **Promover ao topo (botao)** — ✅ **BACKEND ENTREGOU (2026-07-18, S7):** `PATCH /attendances/{id}/promote` (PROFESSIONAL dono) move o atendimento ao indice 0 e empurra os demais, sem inicia-lo (so `SCHEDULED`, no-op se ja for o 1o); a fila ao vivo atualiza via WS. ✅ **FRONT LIGADO (2026-07-18):** `promoteAttendance` no `attendance.store` + acao **"Promover ao topo"** no menu do card (fora do 1o lugar), distinta de "Adiantar" (que inicia via `/start`). · **Refeicoes Modelo B popup** — espera **S3**. · **Abrir/fechar na area do profissional** — ✅ **REFEITO em 2026-07-18 no menu ☰** (`ProfessionalMenu`, topo do menu, com o estado atual no subtitulo e confirmacao; o card antigo de 2026-07-09 nao existia mais na tela apos o redesign do card enxuto), **evoluindo p/ S1** (status do profissional → `open_status` derivado; espera backend — ver HANDOFF_BACKEND "Detalhe — S1").
9. **Maestro E2E** — **POR ULTIMO** (o usuario esta testando manualmente por ora): redesenhar seeds + rodar.
> Itens 5-8 dependem de backend; a ordem e de PRIORIDADE (o front adianta o que der: UI, tratamento de erro, telas). Pagamento/split e Gluestack v2 seguem **adiados** (pos-MVP).

### Feedback 2026-07-18 — redesign da fila + menu ☰ · ✅ IMPLEMENTADO (mockups aprovados)

Sessao de feedback + design (5 opcoes → layout combinado) e implementacao. Mockups: `design/queue-layout-options.html` (5 opcoes), **`design/queue-layout-combined.html` (o aprovado)**, `design/queue-menu-dropdown.html` (dropdown do ⋮ — **descartado**, superado pelo "card inteiro clicavel").

**Pesquisa que embasou as opcoes:** acao primaria no **thumb-zone** (terco inferior; ~49% navegam so com o polegar) → barra fixa ou FAB; **um CTA proeminente** em vez de varios botoes no card; metricas compactas **dividindo um contêiner** em vez de um card com borda cada; padrao **"now serving / next up"** separando o atendimento atual da fila.

**Entregue:**
1. **Textos enxutos** — "Minha fila" → **"Fila"**; "Proximo da vez" → **"Proximo"**; "Remover da fila" → **"Remover"**; "Fechar fila (parar de aceitar novos)" → **"Fechar fila"** (o ⓘ ja explica).
2. **Metricas viram chips** — os 2 cards verdes grandes saem; sobram 2 chips (`N na fila`, `M min`).
3. **Card do cliente INTEIRO clicavel** — abre o menu de acoes por posicao; **kebab ⋮ removido** (era a causa do toque errado ao lado do "Iniciar"). Chevron › como affordance. O 1o card segue destacado com o selo "Proximo".
4. **"Iniciar proximo" FIXO no rodape** — unico start, sempre no indice 0; vira dica *"Finalize para iniciar o proximo"* enquanto ha atendimento em andamento.
5. **Card "Atendendo agora"** no topo — verde, com cronometro, **Pausar** e **Finalizar**; pausado → ambar com selo e **Retomar** (o Finalizar passou a existir tambem no estado pausado).
6. **Tab bar REMOVIDA** do profissional → **menu ☰ no cabecalho** (`ProfessionalMenu`, com testes RNTL): Refeicoes, Meus servicos, Atendimentos, Relatorios, Configuracoes, Area do dono (so dual-role), Sair — **+ Abrir/Fechar estabelecimento** no topo.
7. **Dot no ☰** — vermelho quando ha algo a resolver atras do menu: **refeicao na janela** (`isMealDue`, lib pura nova `src/lib/meals.ts`, fonte unica compartilhada com o popup de nudge) ou **pendencia de cadastro**. Dot tambem no item correspondente.
8. **S4 promover ao topo** ligado (ver item 8 da lista acima) e **camada de store do C2** (`acceptCutRequest`/`refuseCutRequest`).
9. **Fix** — checklist/faixa do dono usavam a store local (que podia nao ter `opening_time`/`closing_time`) e por isso mostravam pendencia fantasma ate abrir "Dados Cadastrais"; agora o **GET fresco (`detail`) manda** assim que chega.

**Pendente (bloqueado no backend):** o **3o gatilho do dot** — solicitacoes de corte com a fila fechada — precisa do `cutRequestId` no WS `CUT_REQUESTED` **ou** de um GET de pendentes. Ver **HANDOFF_BACKEND "Detalhe — C2"** (inclui a **proposta preferida do Andre**: a solicitacao nascer como `Attendance` em `INTENTION`, ganhando id de graca).

### Feedback 2026-07-20 (parte 2) — o menu vira "opcoes da fila" · ✅ IMPLEMENTADO

Correcao de rumo do proprio Andre sobre a v13: *"a ideia do menu era para coisa que ele usará diariamente: aceitar ou não solicitações, ajustar horário de almoço, alterar cliente de fila"*. A v13 tinha enchido o menu de **navegacao rara** (Meus Servicos, Relatorios, Configuracoes). Mockup: `design/queue-menu-icon-options.html`.

1. **Gatilho deixa de ser ☰** — vira o **icone de BANCO** (`src/components/BenchIcon.tsx`), escolhido entre 6 candidatos (busto/RoleIcon, sliders, fila+engrenagem, raio, cadeira, banco). Motivo: banco = sala de espera = a fila. **Provisorio** ("outra hora a gente muda"). Resolve tambem a **redundancia** de ter o `RoleIcon` no header e o ☰ logo abaixo, ambos a direita.
2. **Menu agrupado por quando se usa** — AGORA / HOJE / ACOMPANHAR / Papel + **rodape** (Configuracoes · Sair). Rotulo "Meu status" → **"Status"**.
3. **‹ no topo do menu** — fecha de volta p/ a Fila. Existe porque "Sair" (rodape) e **logout**: sem o ‹, "sair" ficava ambiguo.
4. **A Fila enxugou** — sairam da tela e foram p/ o menu: card **"Meu status"**, secao **"Refeicoes"** e botao **"Adicionar Cliente"**. Permanece so a **faixa da refeicao EM ANDAMENTO** (o "Encerrar" precisa estar a um toque). Sobra: titulo + chips + "Atendendo agora" + lista + botao fixo.
5. **`ProfessionalStatusControl` REMOVIDO** (codigo morto apos a migracao). O modal ⓘ que explicava "fechar fila" virou **hint sempre visivel** no proprio item — melhor que um modal, porque nao exige toque.
6. **"Meus servicos" foi p/ Configuracoes** (e raro). Sem esse link a tela ficaria **orfa**, o mesmo problema do `profile.tsx`.
7. **"alterar cliente de fila" = so reordenar dentro da propria fila** (confirmado pelo Andre) — ja atendido pelo toque no card (Adiantar / Promover ao topo / Remover). Mover cliente **entre profissionais** nao existe e seria feature nova.
8. **Licao tecnica:** `Section`/`Row` definidos DENTRO do componente faziam o tsc **estourar a pilha (segfault)** — a inferencia dos props do gluestack e reavaliada por instanciacao. Movidos p/ o escopo do modulo (que tambem corrige o anti-padrao React de remontar a subarvore a cada render).
9. **Refeicao: aviso SEM intromissao — dot + contagem no menu** (pedido: *"ela poderia aparecer meia hora antes de o almoco iniciar"* e, depois, *"nao quero popup na tela; essa que aparece no horario deve ter a opcao de nao ver mais, assim ficaria apenas o dot, com a contagem, no menu"*).
   - `src/lib/meals.ts` ganhou `MEAL_LEAD_MIN = 30` e **`mealSignal()`** → `{ phase: "proxima" | "agora", minutesUntil }` ou `null`. **`"agora"` tem prioridade** sobre `"proxima"`; entre duas `"proxima"`, vence a **mais perto**. `isMealDue` deriva dele.
   - O item do menu mostra a **CONTAGEM REGRESSIVA** (`"em 25 min — iniciar agora ou adiar"`), que **substitui o popup** como forma de avisar; passado o horario vira `"esta na hora — iniciar, adiar ou pular"`.
   - O **popup ganhou "Nao ver mais"**, que o desliga **de vez** (`src/lib/mealNudge.ts`, preferencia persistida em SecureStore; o efeito checa antes de tudo). **Reversivel em Configuracoes > Refeicoes** — sem isso seria beco sem saida; se a gravacao falhar, a UI volta ao estado anterior em vez de mentir.
   - ⚠️ **Padrao continua LIGADO** (o pedido foi pela *opcao* de desligar, nao pela remocao). Se o Andre quiser o popup desligado de fabrica, e trocar o default de `isMealNudgeDisabled`.
10. **"Solicitacoes" nao navega mais p/ a propria fila** — o `onPress` mandava para `/(professional)/queue`, ou seja, para onde o usuario ja esta. Como a tela de aceitar/recusar dependia do backend (C2), virou aviso de "em breve". *(Nota historica — **superado em 2026-07-22**: o C2 foi desbloqueado e o toque agora abre o **modal real** de Aceitar/Recusar.)*

### Feedback 2026-07-14 (seguranca de fechamento + fila + agendamento)

Sessao de design (mockups em `design/`, abrir com `file:///`; handoffs atualizados). Itens:

**Front-only (da pra fazer sem backend) — mockups prontos:**
1. **Card da fila enxuto** — mockup `design/card-fila-enxuto.html`. Card menor com **nome, corte, preco, status**; botao **"Iniciar" so no 1o da vez** (reforca "atende o indice 0"). O **menu ⋮ fica em TODOS os cards, inclusive no 1o** — se o 1o **faltar**, marca "Nao chegou"/Remover ali mesmo (correcao Andre 2026-07-14: o Iniciar nao pode sumir as opcoes de gestao). **Menu por POSICAO (nao por estado):** 1o da vez → **Nao chegou** (atrasa), **Remover**; demais → **Adiantar**, **Remover**. "Atrasado" e so um **selo** no card. **Sem regra de escalonamento (Andre 2026-07-14):** atrasar e **ilimitado** (quantas vezes quiser) e **Remover nao tem pre-requisito** (pode remover ja no 1o atraso, nao precisa passar por LATE). **Cai o "Nao compareceu"/no-show da UI** — a acao do profissional e so **Remover** (= status REMOVIDO, S10). O 1o card fica em destaque (borda+sombra+Iniciar); os outros viram linhas compactas.
2. **Modal ⓘ "fechar fila"** — icone de info ao lado de "Fechar fila" abre modal explicando que o efeito e **so para o cliente** ("impede novos de entrar; quem ja esta continua; voce segue trabalhando"). Mockup no mesmo arquivo do card enxuto.

**Backend-first (registrado nos handoffs):**
> 📋 **Estado CERTIFICADO contra o PRD_BACKEND (lido 2026-07-25) no [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) — bloco "ESTADO ATUAL"** (fonte unica; nao duplicar aqui). **O backend esta a frente do que o nosso HANDOFF dizia:** ✅ **BUG1/auto-fechamento (= S1 fatia 5) e BUG2/fuso JA ENTREGUES/FECHADOS**; **S2/INTENTION completo**. 🆕 **Isso DESBLOQUEIA trabalho no FRONT-PARTNER:** tratar o **`CLOSING_PROMPT`** (prompt "quer fechar?" + countdown de 15min via `graceUntil`) e o `QUEUE_CLOSING` — o partner ainda NAO trata. **Backend ainda aberto:** S7 SMTP (validar envio) · S11 `/swap-offers` fatia 2 (partner passivo) · S3/S4/S5/S8/S9/S10/S12 · `client_name` no CutRequestResponse. **BUG2 so exige Andre RE-SALVAR** funcionamento+refeicoes pos-OTA (sem migration).
3. **Fechamento seguro (auto-close 15min)** — BUG1 evoluido (ver item 6 da ordem de execucao acima + HANDOFF_BACKEND "Detalhe — BUG1").
4. **Status REMOVIDO** (profissional retira da fila) distinto de CANCELADO (cliente desiste) — HANDOFF_BACKEND S10 (RECUSADO p/ negado fora do horario ainda a decidir). O card enxuto ja preve o rotulo no ⋮ ("Remover da fila").
5. **ETA com buffer de −10min** (regra global; backend calcula, ambos os fronts so exibem) — HANDOFF_BACKEND S11.
6. **Agendamento (INTENÇÃO congelada + barra de encaixe)** — modelo fechado; ver secao 12 "Agenda / Agendamento" (reescrita) + `design/agendamento-barra.html` + HANDOFF_BACKEND "Detalhe — S2".

> Mockups de horas vagas (exploracao): `design/availability-options.html` (comparativo janela/slots/periodos/lista + cenario de dia fragmentado). Conclusao registrada: **slots descartados**, modelo final = barra de encaixe (item 6).

### Feedback 2026-06-28 (parte 2)

- **Fechamento com confirmacao + NAO auto-fechar (BUG1; o gate 409 ao fechar com fila ja foi entregue 2026-07-09).** ❌ **NAO auto-fechar** o estabelecimento no `closing_time`. Fechar e **sempre acao MANUAL com CONFIRMACAO** (owner ou profissional). Modelo desejado: (a) ao chegar o `closing_time` (ou quando o owner/pro decide parar), **bloquear NOVAS entradas na fila** — o cliente **nao entra sozinho**; (b) a **fila existente continua sendo atendida** ate esvaziar (nunca remover clientes silenciosamente); (c) mesmo bloqueado para novos, o cliente **ainda pode "solicitar corte"** (envia um pedido que o profissional aceita/recusa — nao e entrada automatica) — 🟡 **BACKEND ENTREGOU (2026-07-18, C2 fatias 1-2):** chega WS **`CUT_REQUESTED`** ao profissional; o partner mostra o pedido pendente com **Aceitar** (`PATCH /attendances/cut-requests/{id}/accept` → nasce Attendance SCHEDULED na cauda) e **Recusar** (`PATCH .../refuse`); e o **auto-nega por timer de 5min ja foi entregue (fatia 3)** — o C2 esta completo no backend e a **UI do partner foi DESBLOQUEADA em 2026-07-22** (GET de pendentes + `cutRequestId` no envelope; falta so implementar — ver HANDOFF "Detalhe — C2"); (d) o **CLOSED total** so acontece por confirmacao e, se houver fila/`IN_PROGRESS`, o app **avisa** ("ainda ha N na fila; serao atendidos, mas ninguem novo entra"). É **backend** (gate de ENTRADA na fila + fluxo de solicitacao de corte) + **front** (confirmacao no toggle, tratar o gate). Ver secao 11 (BUG1 — o gate 409 ao fechar com fila ja foi entregue).
- **Atender fora de ordem — "Adiantar" (start direto) FEITO; promover/reordenar (S4) segue futuro.** O refinamento 2026-06-28 pedia **promover** o cliente ao 1o lugar (os demais descem). A decisao **2026-07-04** (roadmap #3, confirmada em teste) foi mais simples: o botao **"Adiantar"** (cards fora do 1o lugar) inicia o atendimento **direto** via `PATCH /attendances/{id}/start`, **com confirmacao** — atende o escolhido na frente **sem reordenar** os demais. Isso ja resolve o caso "o da vez nao chegou, atende o 3o". ✅ **Feito** (commit `2489299`). **✅ ENTREGUE (2026-07-18, S7):** `PATCH /attendances/{id}/promote` move ao indice 0 e empurra os demais (a fila reflete a nova ordem apos promover), sem iniciar o atendimento. O front pode agora ter tanto "Adiantar" (start direto) quanto "Promover ao 1o lugar" (reordena).
- **Preco: "cliente paga tudo" (0%) → profissional recebe EXATAMENTE o digitado — ✅ FEITO (2026-06-28).** `calculatePricing` reescrito: `proReceives = round2(digitado − absorvido)` (piso desacoplado do arredondamento) — em **0% absorcao `proReceives === digitado`** (antes recebia centavos a menos, ex.: R$100→R$99,55). A **absorcao continua** (recebe menos so por escolha). `clientPrice` em X,90 (com `ceilTo90` de seguranca p/ nao ficar abaixo do piso em precos baixos); taxa = `clientPrice − proReceives`. Testes reescritos (garantia `0% => digitado`). **Unificado:** `src/utils/pricing.ts` (morto, so o teste usava) **removido**; fonte unica = `src/lib/pricing.ts`.

### Feedback 2026-07-09 — Checklists de prontidao (2 "completes") · ✅ IMPLEMENTADO (mockup aprovado)

Motivacao: o usuario **se perdeu no teste** — nao sabia o que faltava p/ o estabelecimento/profissional aparecer ao cliente. Solucao: **dois medidores** por perfil (dono e profissional), calculados **no front** (dados que ja temos; nao depende de backend).

- **A) "Pronto para atender" (o basico)** — portao FUNCIONAL (bate com os gates do backend #31). 100% aqui = **ja da pra atender / aparece ao cliente**.
  - **Dono:** nome · tipo de servico · endereco/bairro · horario de funcionamento · ≥1 profissional com servico. **NAO inclui "abrir a loja"** — abrir/fechar e cotidiano, nao cadastro (ver nota 2026-07-12).
  - **Profissional:** vinculado a um estabelecimento · ≥1 servico cadastrado. **NAO inclui "loja aberta"** (cotidiano do dono).
- **B) "Perfil completo" (100%)** — regra MACIA (nao bloqueia atender; melhora a apresentacao/confianca). Inclui o basico **+** extras.
  - **Dono:** + telefone · Instagram · foto do estabelecimento (`url_image`).
  - **Profissional:** + apelido (nickname) · especialidade · (foto de perfil — quando o backend expuser, roadmap #7).

**UI:** card com **2 barras** — "Pronto para atender" em destaque (verde + banner "Cadastro completo — ja pode abrir/atender 🎉" ao fechar) e "Perfil completo" discreta abaixo. Cada item pendente e **clicavel** → tela de completar. **(Posicao atualizada 2026-07-11:** o card vive nas **Configuracoes**; a **Home** mostra so a faixa ambar — ver evolucao abaixo.)**

**Dado que falta (registrado como backend S9):** p/ distinguir "tem profissional SEM servico" de "nao tem profissional", o front precisa da **lista completa de profissionais** do estabelecimento (o `professionals-with-queue` esconde os sem servico, #31). Enquanto nao vem, o MVP **colapsa** os dois itens num so. Ver HANDOFF_BACKEND **S9**.

**Processo:** mockup (`design/readiness-checklists.html`) **aprovado** pelo usuario antes de codar. Front-computavel, nao bloqueado por backend.

**✅ Estado do codigo (commit `02e8449`) — o que foi entregue vs. o design acima:** `src/lib/completion.ts` (logica pura `ownerCompletion`/`professionalCompletion` +testes), `src/components/CompletionCard.tsx` (2 barras + itens clicaveis + banner verde), ligado no dashboard do dono (busca detalhe endereco/telefone/instagram) e na fila do profissional (`fetchMyServices`). **Deltas do MVP** vs. a lista acima:
- **Dono, basico:** os itens "≥1 vinculado" e "≥1 com servico" **colapsaram em UM** ("1+ profissional com servico") — sem a lista completa de profissionais nao da p/ distinguir (ver nota abaixo).
- **Perfil (B):** **foto ficou de fora** (dono e profissional) — nao ha tela de upload de imagem ainda. Dono B = telefone + instagram; profissional B = apelido + especialidade.

> 🐛 **FIX 2026-07-12 — "abrir estabelecimento" NAO e pendencia (commit `138c14d`).** O item "abrir estabelecimento" (dono) e "estabelecimento aberto" (profissional) **sairam** do checklist basico. Era circular (nao dava p/ concluir sem abrir) e re-disparava a faixa **toda vez que a loja fechasse** — mas abrir/fechar e **cotidiano**, nao etapa de cadastro. Agora o basico so mede o **setup unico**: **dono = 5 itens** (nome, tipo, endereco, horario, 1+ profissional com servico); **profissional = 2 itens** (vinculado, 1+ servico). Ao fechar em 100%, o banner **notifica** "Cadastro completo — ja pode abrir/atender". O gate real de abertura segue no backend (422 `ESTABLISHMENT_NOT_READY`, tratado no dashboard).

> 🔄 **EVOLUCAO 2026-07-11 — o card virou faixa + dot (mockup `design/readiness-faixa.html` aprovado; commit `08216c0`).** A Home nao tem mais o cartao-checklist fixo. No lugar:
> - **`ReadinessFaixa.tsx`** (faixa **ambar** dispensavel, mesma forma da faixa "Em fila" do client): aparece **a cada abertura do app** enquanto houver pendencia de **"Pronto para atender"** (`hasBasicPending`); o **✕** fecha na sessao (dismissal em memoria, `ui.store.ts`, reseta no launch); tocar encaminha para as **Configuracoes** (dono → Dados do Estabelecimento; profissional → settings). Pendencia **so de perfil NAO gera faixa**.
> - **`CompletionCard.tsx` migrou para as Configuracoes** — dono em `establishment-data.tsx` (+ campo "Profissionais vinculados"); profissional em `settings.tsx`. Passo a passo completo (2 barras) vive la.
> - **`PendingDot.tsx`** (dot ambar) no item de Configuracoes (menu do dono / perfil do profissional) enquanto houver **qualquer** pendencia (`hasAnyPending`).
> - Fonte unica da completude: hooks `useOwnerCompletion` / `useProfessionalCompletion` (query sem socket p/ nao abrir 2o STOMP). +testes de `hasBasicPending`/`hasAnyPending` e `ui.store`.

---

## 11. Handoffs + alinhamento com o backend

> **Handoffs consolidados em arquivos dedicados** (padrao do front-client — nao espalhar pelo corpo do PRD):
> - 📄 **[`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md)** — tudo que o front-partner precisa do **backend** (BUG1–BUG2, S1–S9; numeracao dinamica por prioridade, chave = NOME), em tabela consolidada + detalhes.
> - 📄 **[`HANDOFF_CLIENT.md`](./HANDOFF_CLIENT.md)** — itens cujo frontend pertence ao **app cliente** (C1–C9).
>
> Esta secao guarda so o **resumo de alinhamento** (o que o backend ja entregou e desbloqueou o partner). A lista de afazeres do proprio partner esta na **secao 10**. A referencia S2 (rebaixada) e a 11.2 (contrato de refeicoes ja entregue) seguem abaixo.

### ✅ Alinhamento 2026-07-03/04 (reconciliado com PRD_BACKEND e PRD_FRONT-CLIENT)

> Auditoria cruzada com **PRD_BACKEND** (fonte da verdade do backend) e **PRD_FRONT-CLIENT**, ambos atualizados em 2026-07-03. Resumo do que mudou para o partner:
>
> **Entregue pelo backend (desbloqueia ou vira afazer front-partner — ver secao 10, bloco "DESBLOQUEADO"):**
> - ✅ **Rating (#6)** — COMPLETO no backend (confirmado 2026-07-04): `POST /attendances/{id}/rating` (client envia) **e** os agregados `rating_average`/`rating_count` **ja vem** no `professionals-with-queue` (por profissional e por service item). **Sem pendencia de backend** — front-partner so exibe.
> - ✅ **Notificacoes push** — device token (`POST`/`DELETE /devices`) + disparo Expo. Front-partner registra token + trata `data.type`.
> - ✅ **Escalada de no-show (#39)** — `PATCH /attendances/{id}/no-show` (exige LATE). Front-partner: botao "no-show" no cliente ATRASADO.
> - ✅ **Troca de posicao por consentimento mutuo (#42, DIRECIONADA)** — `POST /swap-requests` etc. **É cliente↔cliente (o profissional nao participa)** → afazer do **front-client**, nao do partner. O modelo desejado (intencao→promocao, S2) ainda nao existe no backend — ver [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) (S2) e client 10b.
>
> ✅ **Entregues/resolvidos 2026-07-09 (sairam da lista; BUGs e S renumerados de 1):** address no `EstablishmentResponse` (`a58704f`), open-status ao profissional afiliado — toggle bruto (`7819914`), gate 409 ao fechar com fila (`0b63678`), `GET /attendances` que nao carregava, cliente na fila invisivel, remover-da-fila nao refletia pro cliente. **Adicionar servico pelo owner** = nao-bug (so o profissional salva). Front ja consumiu os itens de contrato; falta QA no celular. **O toggle bruto sera substituido pelo S1** (status do profissional → `open_status` derivado).
>
> **Ainda abertas no backend, MAS AINDA NAO na lista oficial de pendencias do backend** (PRD_BACKEND secao "Pendencias abertas do BACKEND — FONTE UNICA"): **BUG1** (NAO auto-fechar + bloquear novas entradas ✅ + `is_open` efetivo ✅ + **solicitar corte** — ✅ **C2 COMPLETO (fatias 1-3): fatia 3 entregue 2026-07-20** (auto-nega por timer de 5min server-side); `POST /attendances/cut-requests` + `PATCH .../{id}/accept|refuse`. ✅ **UI do partner IMPLEMENTADA (2026-07-22):** GET de pendentes consumido (refetch 30s), item "Solicitacoes" com badge + dot, modal Aceitar/Recusar com countdown local pelo `expires_at`; ver HANDOFF "Detalhe — C2". Auto-fechamento 15min segue aberto), **BUG2** (pausar torna o atendimento orfao — 🧪 sera testado); ~~**BUG3** (apelido nao volta no `/me`)~~ ✅ **RESOLVIDO 2026-07-20** — o `/professional/me` projeta o `nickname`; o front **removeu a mitigacao local**; **S1** (status do profissional → `open_status` derivado), **S2** (intencao→promocao/agendar), **S3** (refeicoes Modelo B), ~~**S4** (promover ao 1o lugar)~~ ✅ **ENTREGUE 2026-07-18** (`PATCH /attendances/{id}/promote`), **S5** (expediente nos relatorios), **S6** (cliente adiciona servico em atendimento na fila), **S7/S8** (esqueci senha + SMTP) — 🟡 **fatia 1 do "esqueci a senha" ENTREGUE 2026-07-20**; o resto depende do SMTP (S8). *(O backend chama este par de **S5/S6** — alias registrado; chavear por NOME.)* ⚠️ **Estes handoffs precisam ser incorporados pelo backend na lista dele** — hoje so vivem aqui. **O backend confirmou-os como gaps reais** e se ofereceu p/ reconciliar na FONTE UNICA dele — **combinado: reconciliar.** ✅ **Rating (#6) NAO e mais gap** — agregados ja vem no `professionals-with-queue` (confirmado pelo backend, ver acima).

> 🔁 **Numeracao S renumerada em 2026-07-22** (regra: resolvido sai e renumera; chave = NOME): "promover ao 1o lugar" saiu (entregue+ligado); S5-S11 viraram S4-S10; entraram **S11 troca `/swap-offers`** e **S12 filtro de periodo no historico**. Os numeros citados em notas datadas acima sao os da epoca.
>
> 📄 **Detalhe e acoes de cada item de backend: [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md).** Cross-project (client): [`HANDOFF_CLIENT.md`](./HANDOFF_CLIENT.md).

---

**DevOps — ✅ COMPLETO (backend, 2026-06-26):** o APK de demo (`--profile preview`) aponta
para o **backend de staging no Render** (dev), nao prod (Railway). O backend tem o
auto-rollback no `ci.yml` (tags `homolog-last-good`/`prod-last-good`; se o Newman pos-deploy
falha, redeploy automatico do ultimo commit bom — Render via API, Railway via `railway up`) +
`rollback.yml` manual. Os secrets `RENDER_API_KEY` e `RENDER_SERVICE_ID` **ja foram adicionados**
no GitHub Actions do backend → o rollback de **homolog** (o que protege o APK de demo) agora
roda sozinho. **Rede de seguranca ponta a ponta da demo fechada** (frontend OTA/auto-rollback +
backend auto-rollback homolog/prod).

> **Alinhado com PRD_BACKEND de 2026-06-25.** Os 2 itens que faltavam foram **ENTREGUES** no backend e **saem desta lista** (desbloqueiam o partner — ver secao 10):
> - ✅ **#16 apelido** — `PATCH /profile/general-infos { nickname }` (max 50; vazio limpa; null ignora); nickname projetado nos GETs de papel e em `GET /profile/me`. Testes `ProfileNicknameIntegrationTest`. → **desbloqueia partner #3.**
> - ✅ **#19 LATE + #38 encaixe** — `PATCH /attendances/{id}/late` (no-show cai 1 posicao, fica na fila), `/undo-late`, `/fit-in?aheadCount=N`, `/undo-fit`. → **desbloqueia partner #2** (o "swap" = `/late`).
>
> Numeracao preservada (cross-project). Confirmar deploy no **staging** de #3/#4/#6/#12/#13.

**Abertas (relevantes ao partner):** → **BUG1–BUG3, S1–S8 movidos para [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md)** (tabela consolidada + detalhe do fechamento pelo horario e do status do profissional). Aqui ficam so as notas historicas:

> ✅ **Saidos da lista (alinhado com PRD_BACKEND 2026-06-26):** **S1** (afiliado adiciona servico ao establishment) — backend **CONCLUIDO** (`POST service-items` aceita owner OU afiliado) → virou afazer de FRONT (secao 10). **B1** (`GET /establishment/{id}/affiliations` → 500) — **RESOLVIDO / nao reproduz** (JOIN FETCH desde 2026-05-23; coberto por integracao Order 13 + Postman 03e + Newman).
>
> ⬇️ **S2 (rebaixado — nao necessario p/ MVP):** editar/deletar ServiceItem do **establishment** (`PUT/DELETE /establishment/{id}/service-items/{itemId}`, backend #5). Apos a decisao 2026-06-28 (servico = capacidade do profissional; todo o CRUD vive no fluxo do profissional), so voltaria se o owner-nao-profissional gerenciar o catalogo da loja — fora do escopo atual.

### 11.2 Refeicoes/intervalos + horario de funcionamento — ✅ BACKEND ENTREGUE (handoff 2026-06-16)

> A versao anterior desta secao era a SPEC que o front escreveu pro backend. **O backend entregou tudo (#14 COMPLETO, handoff 2026-06-16).** Abaixo o **contrato real** (fonte da verdade: PRD_BACKEND secoes 18 e general-infos) e o **plano de implementacao do front**. Obs do backend: refs antigas a `AttendanceWaitTimeCalculator.advanceAfterInterval` e "janta 45min" estao OBSOLETAS (agora `QueueUtils`, janta 60min); seed/edicao/iniciar JA existem.

**Endpoints de intervalo** (base `/api/v1/professionals/{professionalId}/intervals`, acesso PROFESSIONAL):
- `GET .../intervals?date=YYYY-MM-DD` → `IntervalResponse[]` (previstas SCHEDULED + iniciadas ACTIVE; exclui recorrentes ja encerradas no dia e UNEXPECTED inativas).
- `POST .../intervals/recurring` `{ durationMinutes, fixedStartTime, recurrencePattern, description }` → 201.
- `POST .../intervals/unexpected` `{ durationMinutes, startTime, description }` → 201.
- `PATCH .../intervals/{id}` `{ durationMinutes?, fixedStartTime?, description? }` → editar refeicao / ajustar previsao (null preserva).
- `PATCH .../intervals/{id}/start` (sem body) → inicia manual; vira ACTIVE; 409 `INTERVAL_CONFLICT` se ja iniciada/encerrada hoje.
- `PATCH .../intervals/{id}/finish` (sem body) → encerra manual (so se ativa); 409 se nao ativa.
- `DELETE .../intervals/{id}` → 204 (hard delete; pra ter de volta, POST recurring).

**Contrato de serializacao do `IntervalResponse` (alinhar o front por aqui):**
- `type`: `RECURRENT` (refeicao) ou `UNEXPECTED` (pausa avulsa) — **nao** "RECURRING".
- `status`: so `ACTIVE` (isActive) ou `SCHEDULED` (previsto/encerrado). FINISHED/CANCELLED nao sao emitidos.
- `startTime` (OffsetDateTime): so para UNEXPECTED; **null** para RECURRENT (use `fixedStartTime`).
- `endTime` (OffsetDateTime): = `plannedEndTime`; **null** ate a recorrente ser iniciada; preenchido apos start.
- `fixedStartTime` (OffsetTime): horario previsto da recorrente; **segundos omitidos quando zero** → `"12:00Z"`, `"11:30Z"`. **Parsear segundos como opcionais.**
- ⚠️ Gap: `actualStartTime` NAO e exposto; apos start o front so tem `endTime` (= inicio + duracao). Se precisar "almoco iniciado as HH:MM", pedir pra expor.
- Validacoes: `recurrencePattern ∈ {WEEKDAYS, DAILY, WEEKENDS}`, `durationMinutes ≤ 240` (`@Max`), `@Positive`.

**Horario de funcionamento** (no `PATCH /establishment/{id}/general-infos`, acesso OWNER):
- Campos `opening_time` / `closing_time` (OffsetTime, JSON `"HH:mmZ"`; null preserva). Tambem no response e na busca publica.
- **Gate de abertura:** `PATCH /establishment/{id}/open-status {openStatus:"OPEN"}` retorna `422 ESTABLISHMENT_HOURS_REQUIRED` se nao houver horario definido (apos o gate #31 `ESTABLISHMENT_NOT_READY`). O front usa esse 422 pra **rotear pra tela de horario**.
- **Janela das refeicoes:** criar/editar refeicao fora de `[opening_time, closing_time]` → `400 INTERVAL_INVALID_TIME` (so valida quando ha horario). Refeicoes seed nascem antes do horario e nao sao revalidadas — **o front avisa se ficarem fora**.

**Regras de fluxo (produto):** refeicoes nascem com o profissional (almoco 12:00 + janta 18:00, 60min, WEEKDAYS); editaveis; **inicio MANUAL** (horario e so previsao; so comeca no clique; atender um cliente desloca a previsao; iniciar um atendimento encerra a refeicao ativa automaticamente — `reason=ATTEND_NEXT_CLIENT`); contam na estimativa de espera.

**Popup/nudge de inicio (decisao 2026-06-16, computavel com `GET intervals` + fila, sem backend novo):** no horario previsto, mostrar aviso ao profissional ("N clientes na fila; iniciar agora adia o proximo em ~Xmin") com **2 acoes**: (1) **"Iniciar almoco"** → `PATCH .../start`; (2) **"Nao almocar"** → pular explicito (derruba a refeicao do calculo na hora). Detalhes (timing, nao interromper atendimento ativo, anti-nag) ficam neste PRD. Popup com app em background depende de push (#3).
> ⚠️ A definir com o backend: "Nao almocar" precisa de qual acao? (DELETE da refeicao do dia? endpoint de "skip"? ou so o lock local do front?). O start tem endpoint; o "skip" nao esta explicito no contrato.

### Refeicoes — MODELO B (janela flexivel) — SPEC 2026-06-28 (decisao do usuario)

> **Atualizacao de estado:** o **skip "Nao almocar" JA EXISTE** no backend (**#41**) e o front **ja chama** `skipInterval` na fila — a "decisao provisoria" da Fase C abaixo esta **superada**. E o **`actualStartTime` agora E exposto** pelo backend (`PATCH .../start` marca) — da pra mostrar "almoco iniciado as HH:MM" (o "Gap" citado na serializacao acima esta desatualizado).

**Decisao (2026-06-28):** modelar cada refeicao como **JANELA FLEXIVEL**, nao horario cravado. Menos popup (so pergunta quando a fila e continua) e supressao/placement principistas. Padrao de sistemas de fila (Waitwhile/Qless).

**Modelo:** refeicao = `{ alvo (fixedStartTime, ex. 12:00), duracao (60min), janela [inicioMin, inicioMax] }`.
- `inicioMin = alvo − adiantamentoMax` (permite comecar um pouco antes p/ evitar cruzamento; sugestao: 1 atendimento ou 15min).
- `inicioMax = min(proximaRefeicao.alvo − folgaMin, fechamento − duracao)`. **folgaMin = 3h** (derivavel: `max(duracao + buffer, 3h)`). Ex.: almoco com janta 18:00 → `inicioMax = 15:00`; e ≤ `fechamento − 60min`.

**Placement (projetando a fila a partir de agora, cada atendimento +duracao):**
1. Ha **buraco natural** ≥ duracao dentro de `[inicioMin, inicioMax]` → **encaixa sozinho, sem popup**.
2. Fila **continua** (sem buraco) e um atendimento cruzaria o alvo → **popup adiantar/adiar**: **adiantar** = refeicao antes desse atendimento (se ≥ inicioMin); **adiar** = depois dele (se ≤ inicioMax). Ex.: fila ate 11:45, proximo 11:45–12:15 cruza 12:00 → adiantar (11:45–12:45) ou adiar (12:15–13:15).
3. Nem adiantar nem adiar cabem na janela → **suprime**.

**Supressao (unifica 3h + fechamento):** passou de `inicioMax` sem iniciar → refeicao **some no dia** (sai do ETA). Como `inicioMax ≤ fechamento − duracao`, uma refeicao que bateria no fechamento **e naturalmente suprimida** (decisao do usuario 2026-06-28: bate no fechamento → suprime, atende normal; sem popup de "estender horario"). **"Iniciar refeicao"** inicia sempre a **proxima refeicao NAO suprimida** (almoco suprimido + toca iniciar 17:30 → comeca a **janta**).

**Anti-sobreposicao (na edicao):** ao editar horario/duracao, exigir **≥ folgaMin (3h)** da outra refeicao e dentro de `[abertura, fechamento]`; senao rejeitar (reusa `409 INTERVAL_CONFLICT` do backend + checagem de 3h no front).

**Split de responsabilidade:**
- 🔵 **Backend (fonte da verdade do ETA):** projecao + **auto-placement da refeicao no ETA meal-aware**, **supressao por janela (3h/fechamento)**, e **"iniciar = proxima nao suprimida"**. Hoje o backend tem `skip` (#41) e meal-aware, mas **o placement por janela + auto-supressao provavelmente sao NOVOS** → **pendencia backend** (registrar handoff). Sem isso no backend, o ETA do cliente diverge do que o partner mostra.
- 🟢 **Front-partner:** **popup adiantar/adiar** (detecta o cruzamento pela fila+refeicao, chama `start` ou deixa empurrar), **lapis de edicao** no card, **"almoco iniciado as HH:MM"** (`actualStartTime`), nudge. O placement automatico do front e so **espelho visual** do que o backend calcula.
- ⏭️ **v2:** o Modelo A (horario cravado + popup sempre) foi descartado; se o placement por janela do backend demorar, o front pode rodar um espelho do Modelo A como fallback visual.

**Itens pos-MVP (spec, NAO implementar agora):** #37 lock da estimativa (estabilizar ETA travada por cliente), #38 encaixe com equalizacao de tempo, #39 multa/aviso de cancelamento tardio.

**Plano do front (integrar contra STAGING ja — backend confirmou que nao precisa esperar a main):**
- **Fase A — Horario de funcionamento:** add `opening_time`/`closing_time` ao Establishment + store; tela/secao de horario (em Dados Cadastrais ou tela propria) via PATCH general-infos; no "Abrir" do dashboard, tratar `422 ESTABLISHMENT_HOURS_REQUIRED` → rotear pra tela de horario; add o codigo ao `ERROR_MESSAGES_PT`.
- **Fase B — Editar refeicoes (settings do profissional):** modulo/store de intervalos (GET/PATCH/DELETE/POST recurring); listar almoco/janta, editar horario+duracao, remover, recriar; tratar `400 INTERVAL_INVALID_TIME` e `409 INTERVAL_CONFLICT`; avisar refeicao fora da janela.
- **Fase C — Fila (queue.tsx):** ✅ **FEITO (2026-06-17).** ⚠️ **Atualizado em 2026-07-20:** a **secao saiu da fila** e virou item do **menu** (iniciar/adiar/pular/editar); na tela ficou so a **faixa da refeicao EM ANDAMENTO** com "Encerrar". O **dot + contagem do menu acendem 30min ANTES** do horario (`mealSignal`), e o **popup** abaixo (que segue disparando **no** horario) ganhou **"Nao ver mais"** — desligado, o aviso vive so no menu. Liga/desliga em Configuracoes > Refeicoes (`src/lib/mealNudge.ts`). Descricao original: secao "Refeicoes" na fila: botao "Iniciar" (`PATCH .../start`) e, quando ACTIVE, "Encerrar" (`PATCH .../finish`); iniciar um atendimento ja encerra a refeicao ativa no backend (refetch reflete). Popup de nudge no horario previsto (`now >= fixedStartTime` e status SCHEDULED), uma vez por refeicao/sessao (anti-nag via ref), com contagem da fila: acoes **"Iniciar agora"** (start) e **"Agora nao"**. ⚠️ **DECISAO PROVISORIA:** "Agora nao" hoje so **dispensa o popup** (a refeicao prevista segue sendo empurrada pelos atendimentos, regra "some na proxima"). O **"Nao almocar (pular hoje, derrubando do ETA de TODOS na hora)"** do spec precisa de um **endpoint de skip por dia no backend** (nao existe; `finish` so encerra refeicao ATIVA, `delete` e permanente) — pendencia backend a definir.
- Tests-first em toda logica de store/parse (ex.: parser do `fixedStartTime` com segundos opcionais).

### 11.1 Pendencias que pertencem ao FRONT-CLIENT

> **Movidas para [`HANDOFF_CLIENT.md`](./HANDOFF_CLIENT.md)** (C1–C7, tabela consolidada). Sao itens descobertos no front-partner cujo frontend pertence ao **app cliente** (repo `vupth/`, fora do escopo de edicao deste projeto) — registrados la para alinhamento cross-project.

---

## 12. Features Futuras (Planejamento)

### Skeleton loading (R4, pedido 2026-06-17)
Substituir os `Spinner` de carregamento por **skeletons** (placeholders animados com a forma do conteudo) nas telas com lista/dados: fila (queue/dashboard), relatorios, meus servicos, refeicoes, buscar estabelecimento/profissional, atendimentos. Melhora a percepcao de velocidade (NN/g: feedback reduz a espera percebida). Implementar um componente `Skeleton`/`SkeletonCard` reutilizavel (gluestack tem `Skeleton` na v2; na v1 dar para fazer com um VStack animado/`react-native` Animated ou `moti`). **Combinar com o redesign.** Mockup aprovado (2026-06-26): `design/redesign-form-tabbar-skeleton.html`.

**Animacao de ABERTURA do app (futuro, pedido 2026-06-26) — distinta do skeleton de lista.** Ao abrir o app, no lugar do spinner de "preparando servidor" (gate `waitForBackend()` do cold start do Render ~50s), uma **sequencia de icones que remete a RAPIDEZ** (vs. espera monotona na fila): (1) boneco no celular (abrindo o app) → (2) entrando na porta (estabelecimento) → (3) sentando na cadeira (barbeiro/salao/manicure) → (4) levantando e saindo. **Transicao item-a-item = encolhe+some, troca, aparece+cresce** (scale+fade); icone **pequeno, centralizado**. **Melhorias sugeridas (a validar):** amarrar ao cold start real (a animacao roda enquanto o readiness nao volta UP, com texto curto "preparando..."), **loop suave** (~0.5-0.7s/icone), **linha unica verde** (#00B37E) pra bater com a marca, **micro-deslocamento horizontal** reforcando "avancar", e **respeitar reduce-motion** (fallback fade simples). Implementacao leve (Animated/Reanimated ou Lottie se o design entregar o JSON). **Pos-MVP / quando o design dos icones existir.**

### Encaixe (Premium Walk-in)

Popup solicitado pelo profissional quando um cliente quer atendimento sem estar na fila. Calculo de tempo:

**Formula:** `T_encaixe = (T_cliente_atual_restante + soma(T_clientes_fila)) + T_servico_encaixe`

- Se nao houver ninguem na fila → encaixe = `T_servico_encaixe` (atendimento imediato)
- Se houver fila → encaixe = tempo restante do atual + todos na frente + servico solicitado
- Valor do encaixe: `preco_servico * multiplicador_encaixe` (ex: 1.5x, configuravel pelo profissional)
- Popup mostra: tempo estimado de espera, preco com acrescimo, confirmacao

**Backend necessario:**
- `POST /professional-queue/add-encaixe-attendance` com campos: professionalId, establishmentId, serviceItemIds, clientName, encaixeMultiplier
- Calculo do tempo estimado pode ser feito no frontend usando dados do QueueResponse

### Agenda / Agendamento — MODELO FECHADO 2026-07-14 (INTENÇÃO congelada + barra de encaixe)

> Modelo fechado num vai-e-vem de design com o Andre (evoluiu de "janela unica" → "mapa de cinema" → **barra de encaixe estilo particao de disco**). **Substitui** o esboco antigo de check-in. Spec completa (contrato backend) em [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) — "Detalhe — S2 · Encaixe de agendamento". A UI de agendar em si e do **front-client** (ver HANDOFF_CLIENT C12); o partner so **reflete** a intencao quando ela promove e entra em `professionals-with-queue`.

**Agendar = criar uma INTENÇÃO estimada** (o cliente confirma ciente de que pode oscilar). Ciclo de vida:
1. **Congela num estimado REALISTA no ato de criar** — o horario ja encaixa a **duracao do serviço escolhido** na linha do tempo das intencoes/agendados **que ja existem**. Ex.: cliente quer 17:00 mas ha um corte de 1h15 na frente → o estimado ja nasce 18:05.
2. **Protegida por ORDEM DE CRIACAO** — quem congelou **primeiro** segura o horario; intencao criada depois **nao empurra** as anteriores (encaixa em volta ou depois). Ex.: o de 17:00 (entrou 1o) nao se mexe; o de 16:50 e que muda. **Isto capa o drift** e impede "17:00 virar 20:00".
3. **Piso no horario escolhido** — nunca chamado antes do horario pedido, mesmo com fila vazia (`desiredTime >= projectedQueueEnd`).
4. **Promocao → fila viva** — quando o **fim da fila cruza o horario**, vira `SCHEDULED`, entra na fila e passa a **oscilar de leve** (a fila viva tem preferencia; corte em andamento nunca e interrompido). **Sem notificacao de atraso** (o cliente ja consentiu na estimativa).

**A UI (front-client) = barra de encaixe (particao de disco).** Mockup de referencia: `design/agendamento-barra.html`.
- A barra mostra **so a faixa agendavel**: do **fim da fila viva** ao **`closing_time`** (nao da pra agendar dentro da fila que ja roda).
- Agendamentos ja congelados = **blocos travados** (nao-clicaveis).
- O cliente arrasta uma **"sombra" do tamanho do seu serviço** (soma das duracoes) e a solta num vao livre, **sem cruzar** ninguem — e o "ultimo inicio = proximo agendado − duracao" feito visualmente.

**Backend necessario** (ver handoff S2):
- Expor `projectedQueueEnd` + `closing_time` + a **lista de blocos ocupados** (`{start, duracaoEstimada}` por agendado — pode haver varios blocos/varios vaos).
- `POST/PATCH /attendances/intentions` valida o **encaixe** (nao cruza bloco congelado, `desiredTime >= projectedQueueEnd`) e congela em **ordem de criacao** (nao desloca os anteriores). Erro dedicado se cruzar (ex.: `422 INTENTION_OVERLAP`).
- Promocao **event-driven** quando o fim da fila alcanca o horario. **Slots fixos foram descartados** (quebram num modelo de fila).

> **⚠️ Agendar (INTENÇÃO) ≠ Trocar (Adiantar/Atrasar) — alinhado c/ PRD-Client 2026-07-15.** Sao **duas features distintas**: (1) **Agendar = INTENÇÃO** (esta secao / S2, `/attendances/intentions`) = horario que a fila **ainda nao alcancou**; (2) **Trocar de posicao = TROCA na fila viva** (`/swap-offers`, backend NOVO) = furar/ceder **dentro** da fila, troca 1-por-1 bidirecional, **nunca multa**, o **profissional nao participa** (o partner so **reflete** a fila pos-troca — nao marca LATE, nenhuma acao nova). A troca **nao e S2 nem S4** (S4 = o profissional promover ao topo). Spec da troca: PRD-Client + HANDOFF_CLIENT **C13**.

### Horario de Funcionamento do Estabelecimento

Owner define o horario de funcionamento do estabelecimento, incluindo rotinas especiais:

- Horario padrao por dia da semana (ex: seg-sex 9h-19h)
- Rotinas para finais de semana (ex: sab 9h-13h, dom fechado)
- Rotinas para feriados (fechado, horario reduzido ou horario especifico)
- Excecoes pontuais (ex: fechado dia X por motivo Y)

**Backend necessario:**
- `POST /establishment/{id}/business-hours` — definir horario padrao e rotinas (semana, fim de semana, feriado)
- `GET /establishment/{id}/business-hours` — consultar horarios
- Possivel integracao com calendario de feriados nacionais/municipais

### Calendario

Tela de calendario para owner e profissional:

- Visualizacao mensal/semanal/diaria
- Exibe horario de funcionamento do estabelecimento, disponibilidade do profissional e atendimentos agendados/intencionados
- Feriados e excecoes destacados (vindos do horario de funcionamento)
- Base visual para as features de Agenda/Agendamento e Solicitacao de corte dia X

### Solicitacao de Corte Dia X

Cliente solicita atendimento para um dia especifico (ex: "quero cortar dia 20"):

**Fluxo:**
1. Cliente abre o calendario do profissional e escolhe o dia X
2. Cliente envia solicitacao de corte para aquele dia (intencao, nao reserva fixa)
3. Profissional ve as solicitacoes pendentes do dia e aceita/recusa
4. Solicitacao aceita entra como intencao do dia (vira fila apos check-in, mesmo modelo da Agenda)

**Backend necessario:**
- `POST /professional-queue/day-request` — cliente solicita corte para o dia X
- `GET /professional/{id}/day-requests?date=X` — profissional lista solicitacoes do dia
- `PATCH /professional-queue/day-request/{id}` — aceitar/recusar solicitacao

### Ajuste de Fila Antes de Exibir Calendario

O profissional podera revisar e ajustar a fila do dia antes de "mostrar" o calendario aos clientes:

- Profissional organiza a ordem da fila (intencoes, solicitacoes aceitas, encaixes) em modo rascunho
- Enquanto em rascunho, o calendario/fila do dia nao fica visivel para os clientes
- Ao publicar, clientes passam a ver o calendario com os horarios consolidados
- Permite ao profissional resolver conflitos (sobreposicao de horarios, prioridades) antes da exibicao publica

**Backend necessario:**
- Estado de visibilidade do calendario do dia (DRAFT → PUBLISHED)
- `PATCH /professional-queue/reorder` — reordenar posicoes da fila em rascunho
- `POST /professional/{id}/calendar/publish` — publicar calendario do dia

### Menu de Pendencias

No menu do usuario (profile), adicionar icone/link para tela de pendencias:
- Profissional: servicos sem preco, dados incompletos, afiliacao pendente
- Owner: establishment sem endereco, sem profissional, sem servicos

### Relatorios Expandidos

Adicionar ao relatorio do profissional e do owner:
- Recebiveis por multa (cancelamento tardio)
- Recebiveis por encaixe (acrescimo pago pelo cliente)
- Breakdown por tipo de servico
- Comparativo semanal/mensal

### Contagem de tempo offline / interpolacao local do ETA (BAIXA PRIORIDADE, pedido 2026-06-17)

**Ideia:** em vez de exibir o tempo estimado de espera como um numero estatico (que congela quando cai a internet), o app pega o ultimo `estimated_wait_minutes` conhecido e **conta para baixo localmente** usando o relogio do celular. Enquanto offline o usuario continua vendo o tempo "andando" (nao fica cego); quando a conexao volta, o valor do servidor reconcilia e a aferição melhora.

**Por que vale (boas praticas):** e o padrao de **ETA otimista/interpolado** de Uber/99/iFood/Rappi e de sistemas de fila (Qmatic/Waitwhile) — o numero raramente fica congelado; conta no cliente entre updates do servidor. Reduz a incerteza percebida (NN/g; J. Service Research 2025), que e o que mais faz desistir da fila. O app ja tem a semente: `useElapsedTime` (cronometro local do atendimento em andamento).

**Beneficiario principal:** o **app cliente** (quem espera). No partner e secundario, mas o mesmo hook serve.

**Implementacao sugerida (client-side, sem bloquear no backend):**
1. A cada snapshot da fila (WebSocket/poll) guardar `{ estimateMinutes, receivedAt: Date.now() }`.
2. Timer local (~30s) calcula `restante = max(0, estimateMinutes - minutosDesde(receivedAt))` e exibe o valor andando.
3. Snapshot novo do servidor = fonte da verdade: substitui e **suaviza o salto** (damping/rate-limit — mesma familia do Item 38).
4. Offline: segue contando do ultimo snapshot + selo discreto "sem conexao • atualizado ha Xmin".
5. Cuidados: nao contar abaixo de 0; usar **tempo decorrido (delta)**, nao hora absoluta (relogio do celular pode estar errado); evitar salto brusco ao reconectar.

**Backend (opcional, melhora precisao):** incluir um `computed_at`/timestamp no snapshot da fila para o cliente saber exatamente quanto descontar (sem isso usa-se a hora de recebimento — funciona, so um pouco menos preciso). Sem isso, **da para fazer 100% no front**.

### Solicitacao antecipada (fila de uma abertura FUTURA) + curadoria "playlist" (pedido 2026-06-17, refinado)

**Semantica exata (definida pelo usuario):**
- **So vale para aberturas que ainda VAO acontecer.** Se o estabelecimento **ja esta aberto**, nao existe "solicitacao" — o cliente **entra direto na fila**.
- **Solicitacao antecipada:** ex.: e domingo e o cliente quer cortar segunda → ele **deixa uma solicitacao** para a proxima abertura; recebe **confirmacao** e a solicitacao **fica registrada** (nao e atendimento na fila ainda).
- **No dia, ANTES de abrir a fila / iniciar atendimentos:** o profissional ve as solicitacoes **em ordem de chegada do PEDIDO**, e pode **reorganizar** arrastando os cards (playlist).
- **A reorganizacao o cliente NAO ve.** O cliente so passa a ver a fila (e sua posicao) **depois que o profissional disponibiliza/publica**. Antes disso, e rascunho privado do profissional.

→ Modelo: **fila DRAFT (solicitacoes antecipadas, ordenavel pelo profissional) → PUBLISHED (vira a fila real, visivel ao cliente)**. Conecta com o que ja estava no PRD secao 12 (calendario / "solicitacao de corte dia X" / DRAFT→PUBLISHED).

**Dependencias (backend-first):**
1. **Solicitacao antecipada com a loja fechada:** entidade/estado de "pedido para a proxima abertura" (distinto de attendance na fila), com confirmacao ao cliente; vinculado a um dia/abertura futura.
2. **Ordem explicita + DRAFT/PUBLISHED:** a ordem inicial = chegada do pedido, mas o profissional regrava a ordem; visivel ao cliente so apos publicar. Exige **posicao explicita** na fila + endpoint de reordenar (ex.: `PATCH /professional-queue/{profId}/order { attendanceIds: [...] }`) e um flag de publicacao. **Mesmo pre-requisito de ordem explicita do Item 38 (encaixe)** — alinhar.

**Front (quando o backend suportar):** tela de "Solicitacoes da proxima abertura" (so do profissional) com lista **arrastavel** (drag-and-drop: `react-native-draggable-flatlist` ou reanimated+gesture-handler, que ja temos); botao **"Abrir fila / Publicar"** persiste a ordem e torna visivel ao cliente. Enquanto rascunho, reordenacao e local/privada.

**Obs de produto:** como a reordenacao e privada e feita ANTES de publicar (ninguem ainda "estava na fila"), nao gera o problema de "furar fila" do Item 38 (que e reordenar com a fila ja publica/rodando). Sao casos diferentes.

### Relacao abertura do estabelecimento x presenca/atendimento do profissional (pedido 2026-06-17)

**Como esta hoje (verificado no codigo 2026-06-17):**
- Abertura e **manual e exclusiva do dono** (`PATCH /establishment/{id}/open-status` OPEN/CLOSED/TEMPORARILY_CLOSED). Gates: **#31** (existir ≥1 profissional com ≥1 servico **cadastrado**, nao presente) + **#11g2** (horario definido). **Nao** ha relacao com presenca/atendimento.
- `Professional.isAvailable` existe (default `true`) mas **nao ha endpoint** para o profissional alternar (o `PATCH /professional/me` so muda nome/especialidade). Na pratica fica sempre `true`.
- "Atendendo" e implicito: ter um atendimento `IN_PROGRESS`. Nao existe status de **presenca** que o profissional declare.
- Resultado: um estabelecimento pode estar OPEN sem ninguem presente, e ter 3 clientes na fila sem nenhum profissional de fato la — exatamente o problema levantado.

**Proposta (ideia do usuario: primeiro a chegar abre / ultimo a sair fecha):**
1. **Status de presenca do profissional** — novo enum (ex.: `AVAILABLE` / `ATTENDING` / `AWAY`/`OFF`). `ATTENDING` deriva de ter `IN_PROGRESS`; `AVAILABLE`/`AWAY` o profissional declara (check-in/check-out, "Cheguei"/"Sai"). Backend: endpoint `PATCH /professional/me/availability { isAvailable }` (ou `/status`) — **nao existe hoje**.
2. **Abertura dirigida por presenca:** quando o **primeiro** profissional faz check-in (fica AVAILABLE) e os gates passam, o estabelecimento **auto-abre**; quando o **ultimo** sai (todos AWAY/OFF), **auto-fecha** (ou vai para TEMPORARILY_CLOSED). Manter o toggle manual do dono como override.
3. **Gate adicional opcional:** abrir exige ≥1 profissional **presente** (nao so cadastrado) — fortalece o #31.

**Boas praticas:** softwares de salao/POS usam **clock-in/clock-out** de equipe; a loja conta como "aberta" quando ha staff logado, e status busy/available/away por profissional e padrao. A ideia "primeiro abre / ultimo fecha" e exatamente isso.

**Faseamento sugerido:** (Fase 1) endpoint de disponibilidade + toggle "Estou disponivel/ausente" no app do profissional + badge de status na lista do dono; (Fase 2) auto-open/close dirigido por presenca. Tudo **backend-first**.

> ✅ **DECISAO FECHADA (Andre, 2026-07-09) = S1.** Esta proposta virou o modelo definitivo. Enum do profissional: **`trabalhando` / `intervalo` / `indisponivel`**. **`intervalo` conta como aberto** (loja nao fecha no almoco); so fecha quando **todos** ficam `indisponivel`. `open_status` da loja e **derivado/read-only** (`aberto ⇔ ∃ profissional trabalhando ou em intervalo`). No `indisponivel` o **cliente pode agendar** no card do profissional (dias da agenda liberada → S2/calendario). Substitui o toggle bruto entregue. **Spec completa em [`HANDOFF_BACKEND.md`](./HANDOFF_BACKEND.md) — "Detalhe — S1".**

## 13. Redesign — EM IMPLEMENTACAO na `dev` (consolidado 2026-06-17)

> ✅ **STATUS (2026-06-17):** direcao escolhida e em implementacao **direto na `dev`** (a branch `new-design` foi consolidada via merge e **deletada** — trabalhamos so na `dev`). **Direcao A "Verde Imersivo" refinada** (validada pelo usuario em SVG + no celular): cabecalho clean (VUPTH + titulo da tela abaixo + figurinha do papel; sem barra escura), **fundo off-white global** #F7FAF8, **botoes pilula** com sombra (Poppins), **cards verdes** de metrica (sem "~"), **cards brancos com sombra** ($2xl), **faixa de almoco amarela compacta** com ✎ editar. Mockups de referencia em `design/` (SVG/HTML). **Processo combinado: mostrar mockup (SVG/HTML) ANTES de codar; so implementar apos o usuario escolher.**
> **Tokens (config/gluestack-ui.config.ts):** escala `green`→marca, amber500=#FFB703, red500=#E63946; fontes Poppins (titulos) + Inter (texto). `lib/styles.ts` exporta `cardShadow` reutilizavel.
> **Aplicado:** componentes compartilhados (Header/Button/Input/_layout/TabBarIcon) + fila + dashboard + menu + relatorios + meus servicos + atendimentos + perfil + queues. **Skeleton R4** (2026-06-26): `src/components/Skeleton.tsx` (SkeletonCard/List) no lugar dos spinners em 9 telas. **Tab bar** (2026-06-26 → revisada 2026-06-28): `TabBarIcon` com icones Ionicons outline (inativo) / preenchido verde (ativo) — **sem pilula** (o preenchimento e o indicador da aba) — + sombra superior, nos 2 layouts. _(A 1a versao usava `TabPill` com pilula verde; substituido e o arquivo removido.)_ **Formularios** (2026-06-26): `Input` arredondado ($xl) com borda cinza/foco verde; `Button` ja pilula+sombra. **Redesign de telas restantes concluido.**
> Abaixo: a avaliacao original dos mockups (mantida como referencia).

> Mockups recebidos da equipe de design (13 PNGs do app cliente + parceiro) + PDF "Guia de Design" (paleta/fontes/acessibilidade — ver 13.1). Avaliacao de usabilidade feita com pesquisa (NN/g, Material, Apple HIG, Journal of Service Research 2025).

### Ressalva critica (metodologia)
Os mockups sao **gerados por IA**: todo o texto esta truncado/sem sentido ("Enterer na fila", "QUONB", "Reponts", "Notioffications"), os dados sao falsos e ha **4+ variacoes diferentes da mesma tela de fila** (rings, cores e layouts inconsistentes). → Servem como **mood board / direcao visual**, **nao como spec**. Implementar pixel-a-pixel cravaria os erros. O caminho e **extrair um design system** (tokens, card, botao, tab, componente de fila) e validar caso a caso.

### O que MELHORA a usabilidade (vale levar)
1. **Identidade visual on-palette** — headers verde-escuro + fundo creme + acento verde batem com as 4 cores-ancora do PRD (#1B4332/#52B788/#00B37E/#F7FAF8). Mais polido que a UI atual.
2. **Cards com foto (cliente)** — para beleza/barbearia, mostrar trabalho/fotos cria confianca e segue lideres do setor (Booksy/Fresha). Exige bom placeholder/empty state (a maioria nao tera foto no inicio) e atencao a performance da lista.
3. **Tela de acompanhamento da fila em tempo real** (posicao + ETA + quem esta na frente) — **alinhada a pesquisa**: a incerteza, nao a espera, e o que faz desistir; updates em tempo real fazem a espera parecer ~35% menor (J. Service Research 2025). **Ja temos o WebSocket que alimenta isso.**
4. **Notificacoes "voce e o proximo / 3 na frente"** — bate com NN/g (avisar a 1-2 posicoes do fim, sem spam). Pareia com push (#3).
5. **Relatorios com graficos** (owner) — picos de horario, taxa de cancelamento, atendimentos/dia: mais uteis que as listas de texto atuais.
6. **Onboarding ("Track in real time")** — define expectativa no primeiro uso.

### O que QUESTIONAR (risco de usabilidade)
1. **Ring circular para a fila** — pesquisa: nem circular nem linear e superior por si; o que importa e **clareza + precisao**. Para *posicao na fila* o anel e **ambiguo** (o preenchimento representa o que? quanto falta? tempo decorrido?), e "30" pode ser lido como posicao OU total. **O texto explicito "voce e o Nº X de Y - ~Z min" e que informa**; o anel e ornamento. Recomendo manter o texto explicito e tratar o ring como decorativo/opcional.
2. **Foto em tudo** — custo de banda + dependencia de upload; precisa de empty state forte e lazy-load.
3. **Inconsistencia entre telas** — escolher UMA linguagem (as 4 telas de fila divergem).
4. **Contraste/acessibilidade** — verde-escuro com texto claro e telas de relatorio densas: checar WCAG.
5. **Navegacao mais pesada** — 5 tabs + FAB + sub-tabs "Dashboard/Services": validar a arquitetura de informacao antes (mais tabs = mais carga cognitiva).
6. **Scope creep** — os mockups introduzem **features novas** (pontos/fidelidade "earned 50 points", cupons "20% off", avaliacoes/rating, analitico de pico): isso e **produto novo**, nao "redesign". Separar do esforco visual.

### Recomendacao
Direcao visual e um **upgrade real** e coerente com o que ja construimos (tempo real, relatorios). Caminho sugerido (branch `new-design`): (1) destilar **design tokens + componentes** dos mockups; (2) **derrubar/validar o ring** da fila com o texto explicito de posicao/ETA; (3) aplicar incrementalmente, tela a tela, comecando pela **fila em tempo real** (maior impacto) e **notificacoes**; (4) tratar fidelidade/cupons/rating como features de produto a parte. **Validar com teste de usabilidade real** (o usuario ja faz QA manual) antes de adotar de vez.

**Fontes da pesquisa:** [NN/g — Virtual Queue Best Practices](https://www.nngroup.com/articles/virtual-queue-best-practices/) · [NN/g — Progress Indicators](https://www.nngroup.com/articles/progress-indicators/) · [Material Design — Progress indicators](https://m3.material.io/components/progress-indicators/guidelines) · [Apple HIG — Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)

### 13.1 Guia de Design (PDF) — design system implementavel (fonte da verdade do redesign)

> Recebido o PDF "Guia de Design e Prototipo..." (5 paginas). **Diferente dos PNGs (renderizacoes por IA, texto embaralhado, so referencia visual solta), o PDF e um guia real e implementavel.** Use o PDF como **fonte da verdade dos tokens** no branch `new-design`; os PNGs so como inspiracao.

> 🎨 **ATUALIZACAO 2026-07-09 — paleta alinhada ao front-client ("Verde Marca / folha vivo").** A escala `green` do partner foi **re-ancorada no `#3B7A3F`** (mesma do client, ver PRD_FRONT-CLIENT "Verde Marca"), substituindo o teal `#00B37E`. Novos valores em `config/gluestack-ui.config.ts` (**fonte da verdade**): 50 `#eef5ee` / 100 `#d9ead9` / 200 `#b5d5b6` / 300 `#8bbd8d` / 400 `#5c9c60` / **500 `#3b7a3f`** / 600 `#316635` / 700 `#26522a` / 800 `#1c3d1f` / 900 `#142c17`. Sombra dos cards/botoes = `#1A281A` (do client). amber `#FFB703` e red `#E63946` **mantidos**. Fundo claro **mantido**. Hexes hardcoded nos componentes (Tab bar, RoleIcon, ServiceTypeGrid, CompletionCard, etc.) migrados junto. A tabela abaixo e **historica** (paleta antiga teal).

**Paleta completa (estende as 4 ancoras do PRD — resolve o "COM O DESIGN" da escala de cores):**
| Cor | Hex | Uso |
|-----|-----|-----|
| Verde Escuro | `#1B4332` | Titulos, botoes principais, icones de navegacao |
| Verde Medio | `#52B788` | Botoes secundarios, destaques, graficos |
| Verde Vibrante | `#00B37E` | CTAs, confirmacoes |
| Off-white | `#F7FAF8` | Fundo principal, areas de respiro |
| Cinza Neutro | `#E5E5E5` | Bordas, divisores, placeholders |
| Laranja Suave | `#FFB703` | Alertas moderados |
| Vermelho Suave | `#E63946` | Erros, cancelamentos |
- Hover/pressed: 10% mais escuro. Confirmacoes: gradiente sutil `#52B788 → #00B37E`. Contraste minimo 4.5:1.
- Modo escuro (opcional): fundo `#121212`, verdes saturados `#00C48C` / `#007A5E`.

**Tipografia (resolve o "COM O DESIGN" das fontes — substitui o placeholder DM Sans):**
- **Poppins** (Bold/SemiBold/Medium) — titulos e botoes; **Inter** (Regular) — textos/descricoes; **Roboto** — alternativa universal.
- Hierarquia: H1/H2 Poppins Bold 24–32px · H3/H4 Poppins SemiBold 18–22px · texto Inter Regular 14–16px · botoes Poppins Medium 16px UPPERCASE.

**Acessibilidade (concreto, adotar):** toque minimo **48x48px**; contraste **4.5:1**; feedback visual + sonoro (vibracao leve, animacoes sutis); modo escuro automatico conforme sistema.

**Estrutura de telas do guia:** Cliente (inicial com busca+cards nome/tempo de espera/avaliacao/distancia; status da fila com posicao+tempo+progresso+pausar/cancelar; detalhes do salao; notificacoes; onboarding 3 telas). Profissional (dashboard fila + tempo medio + total do dia + "Iniciar atendimento"; analytics picos/servicos/cancelamento/feedback).

**⚠️ Discrepancias a decidir antes de implementar:**
1. **"Agendar agora" (PDF) vs "Entrar na fila" (nosso modelo).** O guia usa linguagem de **agendamento**; nosso produto e **fila walk-in** (sem horario marcado). Manter a semantica de FILA nos CTAs ("Entrar na fila", "Chamar proximo") e nao adotar "Agendar" — ou decidir se vamos introduzir agendamento (feature nova, fora do MVP).
2. **Card verde (#52B788) no code sample do PDF vs cards claros nos PNGs.** Inconsistencia interna do material; escolher (provavelmente card claro com acento verde, como nos mockups).
3. **Card do cliente cita "distancia" e "avaliacao"** — dependem de geolocalizacao (#11/#2) e rating (roadmap #6 backend): features novas, nao so visual.

**Acao (branch new-design, NAO agora):** (1) aplicar paleta+tipografia no `config/gluestack-ui.config.ts` (escala `green` + fontes Poppins/Inter via expo-font); (2) extrair componentes (card, botao, tab, tracker de fila com texto explicito de posicao/ETA — sem depender do ring); (3) aplicar tela a tela comecando pela fila em tempo real. Resolve as pendencias antigas do PRD "paleta/fontes COM O DESIGN".

---

## 14. Build, Distribuicao e Anti-quebra (DevOps) — configurado 2026-06-23

> Como o app vira binario instalavel, como e distribuido, e a rede de protecao
> que impede codigo quebrado de "subir" (e como reverter se subir).

### 14.1 Workflow nativo: CNG (Continuous Native Generation)

O projeto **nao versiona** as pastas `android/` e `ios/` — elas estao no `.gitignore`
(`/android`, `/ios`). O `expo prebuild` **gera os projetos nativos do zero** a cada
build, a partir do `app.json` + config plugins, sempre coerentes com a SDK 54.

- **Fonte da verdade** das configuracoes nativas = `app.json` (package, bundleId,
  plugins, permissoes, status bar). Nada de editar `android/ios` na mao.
- **Historico:** ate 2026-06-23 o projeto tinha `android/ios` commitados (saida stock
  do primeiro `prebuild`, em SDK antiga). Isso quebrava o EAS Build na SDK 54 com
  erro de compilacao Kotlin (`:expo-module-gradle-plugin:compileKotlin` / "Could not
  receive a message from the daemon"). Migrar para CNG (remover as pastas) resolveu.
- Para dev local nativo (`expo run:android`), o prebuild roda on-demand; o dia a dia
  e via Expo Go + `expo start`.

### 14.2 EAS Build — perfis e identificadores

- Conta EAS: **andrericao**; projeto `@andrericao/vupth-partner`
  (`extra.eas.projectId` em `app.json`, gravado por `eas init`).
- Identificadores (em `app.json`): `android.package` e `ios.bundleIdentifier` =
  **`com.vupth.partner`** (permanente apos publicar na loja).
> 🍎 **iOS REABERTO em 2026-08-12** (ver **D8**: o Andre quer publicar nas **duas** lojas; o que segue abaixo era a decisao anterior, de 11/08, e continua valendo como registro do custo). **iOS ADIADO (decisao do Andre, 2026-08-11).** Os tres perfis do `eas.json` seguem **so com Android** — nenhuma configuracao de iOS foi adicionada. **Motivo:** instalar num iPhone real exige a **Apple Developer Program (US$ 99/ano)**; nao ha equivalente gratuito ao "instalar mesmo assim" do Android (ad hoc e TestFlight exigem conta paga, e o build de **simulador**, que e gratis, so roda em **macOS**). O que **ja esta pronto** para quando a decisao mudar: `ios.bundleIdentifier` = `com.vupth.partner` no `app.json`, e o build compila nas maquinas macOS da EAS (**nao precisa de Mac** para compilar, so para o simulador). O que faltara: perfis `ios` no `eas.json`, registrar aparelhos (`eas device:create`) e a **chave APNs** — que o `expo-notifications`, ja nos plugins, vai exigir. Os updates OTA ja sao publicados para **android e ios**, entao o canal atende as duas plataformas sem mudanca.

- `eas.json` (perfis):

| Perfil | Formato | Distribuicao | Uso |
|--------|---------|--------------|-----|
| `development` | apk (dev client) | internal | debug com dev client |
| `preview` | **apk** | internal | teste fora da loja (instala direto no celular) |
| `production` | **aab** + autoIncrement | store | publicacao na Play Store |

### 14.3 Fluxo de build e instalacao (APK preview)

Setup inicial (1x, exige login interativo do usuario):
```bash
eas login          # sessao fica salva; login tambem via "Continue with GitHub"
eas init           # cria o projeto na conta + grava projectId no app.json
```
Gerar o APK de teste:
```bash
eas build --platform android --profile preview
```
- Roda **na nuvem da Expo** (pode fechar o terminal); ~10-20 min; consome 1 build da
  cota grátis mensal (sem cobranca por memoria; so `resourceClass: large` seria pago).
- No fim, abrir a **URL do build no navegador do celular** -> Install -> instala o APK.
- **Google Play Protect bloqueia APK fora da loja** (normal, nao e virus):
  toque "Mais detalhes" -> "Instalar mesmo assim"; se nao aparecer, desligar
  temporariamente Play Store -> Play Protect -> Configuracoes -> "Verificar apps".

### 14.4 Rede anti-quebra (gate antes de subir)

Defesa em profundidade: o codigo so "sobe" se passar nos checks
**lint -> typecheck -> jest -> expo-doctor** (esse ultimo pega quebras de config/nativo
que o jest nao pega — foi a classe de erro do CNG).

- **Lint (ESLint, 2026-07-04)** — `eslint` + `eslint-config-expo` (flat config,
  identico ao front-client); script `npm run lint` = `eslint . --max-warnings 0`.
  Baseline zerado (Animated.Value via `useState`, disables pontuais das regras do
  React Compiler nos fetch-on-mount intencionais, imports mortos removidos).
- **Local — pre-push hook** (`.githooks/pre-push`): roda antes de cada `git push` e
  **aborta** se algo falhar. Ordem: **lint -> typecheck -> jest -> expo-doctor**.
  Ativado por `core.hooksPath=.githooks`, religado automaticamente no `npm install`
  (script `prepare` no `package.json`). Bypass de emergencia: `git push --no-verify`.
- **Servidor — CI** (`.github/workflows/ci.yml`): **lint** + typecheck + jest + cobertura
  (gate de threshold) + **expo-doctor**, em push (`dev`/`main`) e PR para `main`.
- **Branch protection no `main`** (acao manual no GitHub -> Settings -> Branches):
  *Require status checks to pass* -> **CI / lint-and-test**. Assim codigo quebrado
  nao consegue ser mergeado no `main`. `main` = linha de producao sempre verde.

- **Auto-rollback** (`.github/workflows/auto-rollback.yml`) — ✅ portado do front-client
  (2026-06-24). Cobre o caso que o pre-push nao pega: se um push entrar com `--no-verify`
  ou de outra maquina e o **CI ficar vermelho**, este workflow (`on: workflow_run` do CI
  concluido) **reverte automaticamente** o commit que quebrou, voltando ao ultimo estado
  verde. Guards: so age em push (nao PR), so se o commit ruim ainda for o HEAD, e nao
  reverte um revert nem `[skip-rollback]` (evita loop). Complementa o rollback manual (14.5).

### 14.5 Rollback

- **Tag de fallback** `last-ci-green` aponta para o ultimo commit verde (mover para
  frente a cada release verde): `git tag -f last-ci-green <commit> && git push -f origin last-ci-green`.
- **Desfazer commit ruim** mantendo historico (preferido): `git revert --no-edit <commit>`.
- **Voltar a branch** para o ultimo verde: `git reset --hard last-ci-green`.
- **App ja publicado** (quando EAS Update/OTA estiver ligado): `eas update:rollback`
  reverte os usuarios na hora.
- Procedimento detalhado tambem em [`docs/ROLLBACK.md`](../../docs/ROLLBACK.md).

### 14.6 CD — EAS Update (OTA) — CONFIGURADO E FUNCIONANDO (2026-06-23)

Atualiza a camada **JavaScript** (telas/logica/fixes) pela internet, sem rebuild de loja.
**Nao** atualiza camada nativa: lib nativa nova / permissao / icone / bump de SDK mudam o
`runtimeVersion` e exigem um **build novo**.

**Configuracao (feita):**
- `expo-updates` instalado; `eas update:configure` gravou no `app.json`:
  `updates.url = https://u.expo.dev/<projectId>` e `runtimeVersion {policy: appVersion}`.
- `eas.json`: cada perfil de build amarrado a um canal (`development`/`preview`/`production`).
- Workflow `.github/workflows/eas-update.yml`: a cada push publica OTA — push `dev` ->
  `eas update --branch preview`; push `main` -> `eas update --branch production` — via
  `expo/expo-github-action@v8` + secret `EXPO_TOKEN`. Runner em **Node 22**.
- `EXPO_TOKEN` = **Personal Access Token da conta dona do projeto** (`andrericao`), criado em
  expo.dev/settings/access-tokens e guardado como **secret do GitHub no repo** (nao e env do
  EAS). Um token por repo e boa pratica (revoga/rotaciona isolado).
- **Validado 2026-06-23:** push na `dev` -> workflow publicou OTA no canal `preview`
  (branch `preview` no EAS, runtime 1.0.0). CD vivo: editar JS + push = OTA automatico.

**⚠️ Licao critica — o APK precisa ter o `expo-updates` embutido:**
um APK so recebe OTA se foi buildado **depois** de o `expo-updates` entrar no projeto. O
primeiro APK do partner (build de um commit anterior ao `expo-updates`) NAO recebia OTA; foi
preciso **rebuildar** (`eas build -p android --profile preview`) e reinstalar. Conferir com
`eas build:list`: o build tem que ser do commit em que o `expo-updates` ja existe.

**⚠️ Licao critica — modulo NATIVO novo ⇒ OTA nao entrega, e um OTA novo pode "reverter" um APK velho (2026-07-04):**
o push notifications (`d751529`) adicionou `expo-notifications` + `expo-device` (**modulos nativos**) + plugin no `app.json`. **OTA so entrega JavaScript, nao codigo nativo.** Como o `runtimeVersion` e `policy: appVersion` e o `version` nao mudou (1.0.0), o OTA novo (que ja tem o codigo de push) foi publicado para o **mesmo** runtime do APK antigo — que **nao tem** os modulos nativos. Ao carregar o bundle novo, a chamada nativa lancava e o app fazia **rollback pro bundle embutido velho** → parecia que apelido/botao-OTA/pilula/adiantar tinham "sumido" (estavam no codigo, mas o aparelho rodava a versao velha). **Dois aprendizados + fix:**
1. **Resiliencia (feito):** todo toque em modulo nativo opcional deve ser **guardado com try/catch** para o bundle JS **rodar mesmo sem o modulo** (degradando a feature, nao derrubando o app). Aplicado em `src/hooks/usePushRegistration.ts` (`setNotificationHandler` no topo, `setNotificationChannelAsync`, `addNotificationResponseReceivedListener`). Assim o OTA volta a entregar as features JS mesmo num APK sem push.
2. **Build (acao do usuario):** para o push notifications **funcionar** (e para o runtime ficar coerente), e preciso **rebuildar** o APK com os modulos nativos: `eas build -p android --profile preview` + reinstalar.

### 14.7 Esquema de versionamento (decidido 2026-07-04) — CORRIGE a raiz do problema de OTA

**Diagnostico:** o `version` ficou travado em **1.0.0** e o `runtimeVersion` e `policy: appVersion` → **todo build e todo OTA sao runtime "1.0.0"**. Quando entrou lib nativa (push), o runtime **nao mudou**, entao o OTA "com push" caiu nos APKs 1.0.0 **sem** push → crash + rollback. **A falta de numeracao E a causa-raiz.** (Alem disso, com `appVersionSource: remote` o `version` do `app.json` era ignorado — parte da confusao.)

**Regra (Andre 2026-07-04) — numeracao MANUAL, semver:**
- `eas.json`: **`appVersionSource: "local"`** (o `app.json` passa a ser a fonte da versao).
- **Bump de `version`** (`app.json`) a cada release significativo **e — OBRIGATORIO — sempre que entra/muda algo NATIVO** (lib nativa, permissao, plugin, bump de SDK). Como `runtimeVersion` e `policy: appVersion`, bumpar `version` **muda o runtime junto** → OTAs da versao nova **nao** caem nos builds antigos (sem crash).
- `android.versionCode` incrementa junto (build novo tem que ter code maior).

**Config-alvo (aplicar NO PROXIMO BUILD — nao retroativo):**
- `eas.json` → `cli.appVersionSource: "local"`.
- `app.json` → `version: "1.1.0"` (adicionamos push = feature nativa nova), `android.versionCode: 2`, mantendo `runtimeVersion { policy: "appVersion" }` (vira **1.1.0**, numero legivel).
- Buildar 1.1.0: `eas build -p android --profile preview` — esse APK ja embute TUDO do dev atual e fica no trilho **1.1.0** (separado dos builds 1.0.0 quebrados).

**Sequencia (importante):** o bump **nao** vai junto com o push do OTA de teste (senao o OTA sairia em 1.1.0 e o build 1.0.0 nao pegaria). Primeiro confirma o OTA no trilho 1.0.0 (build `57d9299f`); a numeracao entra quando for buildar a proxima versao.

**Alternativa futura (se cansar de lembrar do bump):** `runtimeVersion { policy: "fingerprint" }` — o runtime vira um hash do nativo e muda **sozinho** quando o nativo muda (separa builds automaticamente). Custo: o runtime deixa de ser um numero legivel (mostrar o `version` nas Config em vez do runtime).

**⚠️ Ferramentas exigem Node >= 20.19.4** (SDK 54): em Node mais antigo o `expo-doctor`
crasha (`util.parseEnv is not a function`) e o gate do pre-push deixa de validar de verdade.
Usar Node 22 (nvm) e **reinstalar o `eas-cli` global apos trocar de Node** (`npm i -g eas-cli`,
porque os globais sao por versao do nvm).

**⚠️ Licao — mensagem do commit por env var (bug corrigido 2026-06-24):** no step do
`eas update`, passar a mensagem via `env: { MSG: ${{ github.event.head_commit.message }} }`
+ `--message "$MSG"`. **Nunca** interpolar `--message "${{ github.event.head_commit.message }}"`
direto no `run:` — mensagem de commit **multi-linha ou com aspas** quebra o comando
(`Unexpected arguments: ...`). O front-client provavelmente tem o mesmo bug e deve aplicar o
mesmo fix.

**Front-client deve seguir esta mesma referencia (secao 14 inteira).** Ele ja tem EAS
Build/Update + anti-quebra configurados, mas **falta o workflow de auto-publish** — ver
pendencia **C5** na secao 11.1 (com o detalhe critico do `EXPO_PUBLIC_API_ENV` por branch).
