# VUPTH Front Partner — PRD (Product Requirements Document)

> Documento de comunicacao entre frontend partner e backend.
> Descreve os fluxos implementados, endpoints consumidos, formato dos requests/responses,
> e o que esta pendente no frontend.
>
> **App:** React Native 0.81 + Expo SDK 54, Gluestack UI v1, Expo Router v6
> **State:** Zustand v5 + Axios + Expo SecureStore
> **Testes:** Jest 29 + axios-mock-adapter
>
> **Ultima atualizacao:** 2026-06-26 (v9 — alinhado com PRD_BACKEND 2026-06-25: #16 apelido e #19 LATE/encaixe ENTREGUES → desbloqueiam partner #2 e #3; auto-rollback do backend ja existe, falta so secrets do Render)

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
11. [Pendencias futuras para o Backend](#11-pendencias-futuras-para-o-backend-escrito-pelo-front-partner)
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
4. **(professional)/_layout.tsx** — Tab navigation: Fila | Servicos | Perfil
5. **(professional)/queue.tsx** — Gerenciamento de fila: atendimento atual + lista de espera, start/pause/resume/finish/remove, **fila em tempo real via WebSocket (`useQueueSocket`); polling 30s fallback** (#15), pull-to-refresh, botao "Adicionar Cliente". **Atende-primeiro / LATE (2026-06-26):** so o 1o da fila (indice 0) tem "Iniciar"; no da vez ha tambem "Nao chegou" → `PATCH /attendances/{id}/late` (ele vira **ATRASADO** e cai 1 posicao, **continua na fila**) e o proximo vira o da vez; item LATE tem badge "Atrasado" + "Voltar a fila" (`/undo-late`). **Regra:** o **LATE so e aplicado quando o PROFISSIONAL pula o da vez (mecanismo #1)** — recai sempre sobre o **indice 0**. A **troca entre clientes (mecanismo #3, S2/C6) NAO marca LATE** (e consensual). Encaixe (#2) e outra coisa (cliente→pro, `/fit-in`). **Secao "Refeicoes" (#14 Fase C):** Iniciar/Encerrar refeicao + popup de nudge no horario previsto (ver 11.2). Botao "Buscar Estabelecimento" quando nao afiliado
6. **(professional)/add-guest.tsx** — Adicionar cliente walk-in: nome + selecao multipla de servicos + total → `POST /professional-queue/add-quest-attendance`
7. **(professional)/my-services.tsx** — Lista servicos + formulario com filtro por especialidade + pricing preview com absorcao. Guard: se profissional nao tem `establishment_id`, exibe aviso e botao para buscar estabelecimento (bloqueia adicao de servico); nesse estado faz `fetchMe()` no mount e no pull-to-refresh para detectar afiliacao aceita pelo owner (queue.tsx faz o mesmo no mount). Quando afiliado, mostra so o nome do estabelecimento (`establishment_name`, sem o prefixo "Vinculado a" — feedback 2026-06-22). Usa `POST /professional-queue/{profId}/add-service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice`: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12). Lista mostra o tipo de servico humanizado (humanizeServiceType, sem underline). ✅ **Editar/remover servico (2026-06-15):** cada item tem acoes "Editar" (nome+preco inline, dentro de FormControl) via `updateMyServiceItem` → `PATCH /professional-queue/{profId}/service-items/{itemId}` e "Remover" (com confirmacao) via `removeMyServiceItem` → `DELETE ...` (backend #10/#15 concluido)
8. **(professional)/find-establishment.tsx** — Gate no mount via `fetchMe` + `GET /professional/me/affiliations`: se ja afiliado mostra "Voce ja esta vinculado" (link Configuracoes); se tem solicitacao PENDING mostra "Solicitacao em andamento" (so 1 estabelecimento por vez); senao libera a busca. Auto-load `GET /establishment` (lista todos), busca por nome (`GET /establishment?name=X`), solicitar vinculacao (`POST /professional/me/affiliations { establishmentId }`). Nao exige servicos — ordem: afiliar primeiro, servicos depois. Busca por bairro/proximidade ordenada por fila pendente — ver pendencia backend #11
9. **(professional)/profile.tsx** — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
10. **(professional)/attendances.tsx** — Historico de atendimentos: auto-load no mount, filtros (todos/finalizados/cancelados) → `GET /attendances`, erro real do backend + "tentar novamente"
11. **(professional)/reports.tsx** — Seletor de periodo (Hoje/Semana/Mes) → `GET /professional/me/reports?dateFrom=&dateTo=` (`fetchMyReport` + `periodRange`): atendimentos, receita, duracao media, servico mais feito. "Hoje" tambem mostra fila/espera ao vivo (WebSocket). (#4 — substituiu a agregacao client-side via /attendances)
12. **(professional)/settings.tsx** — Dados do profissional (nome, email, senha, establishment). Botao "Buscar Estabelecimento" quando nao afiliado; quando afiliado, botao "Desafiliar do Estabelecimento" (confirmacao → `DELETE /professional/me/establishment`, limpa myServices e atualiza via fetchMe)

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
    _layout.tsx                  — Tab navigation: Fila | Servicos | Perfil (safe area bottom insets)
    onboarding.tsx               — 3 steps: profile → busca → solicitacao de afiliacao (PENDING)
    queue.tsx                    — Gerenciamento de fila + botao "Adicionar Cliente" + secao Refeicoes (iniciar/encerrar/nudge), fila em tempo real (WebSocket; polling fallback), pull-to-refresh
    add-guest.tsx                — Adicionar cliente: nome + multi-select servicos + total (POST /professional-queue/add-quest-attendance)
    find-establishment.tsx       — Buscar establishment + solicitar afiliacao (POST /professional/me/affiliations)
    my-services.tsx              — Lista + CRUD servicos com pricing preview (absorcao por faixa), pull-to-refresh
    profile.tsx                  — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
    attendances.tsx              — Historico de atendimentos (filtros, GET /attendances)
    reports.tsx                  — Stats do dia (fila + tempo), semana/mes aguardando endpoint
    settings.tsx                 — Dados do profissional (edicao em breve)
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
- Destinos de voltar (2026-06-13): telas de gestao do owner abertas pelo menu voltam para **/(owner)/menu** (antes iam para o dashboard/home); professional-queue volta para dashboard. Telas do professional voltam para **/(professional)/profile** (ou queue, no add-guest). Onboarding profissional: step "search" volta para step "profile"; step "profile" volta para profile. Onboarding owner (que usa router.replace) volta para dashboard/menu — nunca para /(auth)

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

## 10. Pendente de Implementacao

### Pendencias do partner (priorizado) — ABERTAS

> Renumeradas 1..N por prioridade; itens concluidos saem da lista (o git history preserva). Dependencias de backend/client ficam na secao 11. Regra de gestao: ao concluir, remover e renumerar.

1. **QA no celular:** validar via OTA as features entregues — **#4** (card → tela de detalhe), **atende-primeiro/LATE** (Iniciar so no indice 0; "Nao chegou" derruba; badge "Atrasado"), **apelido** (editar nas Config + aparece na busca do owner) e o **redesign** (Skeleton no lugar dos spinners; tab bar com icones outline/preenchido verde na aba ativa; inputs arredondados/foco verde; mascara R$ no preco do servico) — + rodar **Maestro E2E** (`seed_complete.yaml`, nunca rodado).
2. **Dono editar/remover servicos:** hoje o owner so **adiciona** ServiceItem (tela `add-service`, `POST /establishment/{id}/service-items`); nao ha lista pra **editar** (nome/preco) nem **remover** os servicos que ele criou. O profissional ja tem essa edicao inline em "Meus Servicos" (`PATCH`/`DELETE /professional-queue/{profId}/service-items/{itemId}`); falta o equivalente no lado do dono. **A fazer (front):** tela/lista de servicos do estabelecimento com editar+remover; metodos `updateServiceItem`/`removeServiceItem` no `establishment.store` (hoje so existe `addServiceItem`). **Dependencia (backend):** confirmar endpoints `PATCH`/`DELETE /establishment/{id}/service-items/{itemId}` (se nao existirem, registrar em S-novo na secao 11).
3. **Pos-MVP:** pagamento real / split de taxas (Stripe/Pagar.me; unificar `src/utils/pricing.ts` e `src/lib/pricing.ts`); migrar Gluestack v1→v2 (tech debt, warnings React 19). Animacao de ABERTURA do app (sequencia de icones, ver secao 12 / Skeleton).

> **Concluidos** (bugs do teste 2026-06-05 e itens Alta/Media/Baixa prioridade ja entregues) foram **removidos desta lista** para nao acumular — o historico esta no git. Itens que dependem do backend estao na secao 11.

---

## 11. Pendencias futuras para o Backend (escrito pelo front-partner)

> Itens que o frontend partner precisa do backend.
> Marcados com **PRIORIDADE** os que serao implementados em breve.

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

**Abertas (relevantes ao partner):**

| # | Item | Descricao |
|---|------|-----------|
| S1 | **Profissional afiliado adiciona servico ao establishment** | Hoje so o owner adiciona ServiceItem (`POST /establishment/{id}/service-items`). PRD_BACKEND lista como pendencia Media (permissao p/ funcionario da mesma loja). Quando liberado: permitir o profissional adicionar servico na loja onde trabalha. |
| B1 | **`GET /establishment/{id}/affiliations` → 500** | Bug reportado pelo front-partner (PRD_BACKEND, "Bugs 2026-06-09", ALTA: SecurityContext nulo). Confirmar se ainda ocorre no staging atual. |
| S2 | **Solicitacao de troca de posicao ENTRE CLIENTES (marketplace)** | Mecanismo **cliente↔cliente** — o profissional **nao participa nem precisa saber**. Um cliente manifesta **intencao de troca**: (a) vai se atrasar → quer ir para **mais tarde**; ou (b) esta muito para o fim → quer **adiantar**. A solicitacao fica **ABERTA** (igual a de afiliacao) e aparece **apenas para os clientes dentro da janela de horario** alvo, calculada pelo **tempo estimado de atendimento de cada um** — quem esta fora da janela nao ve. **Primeiro que aceitar** → troca efetivada e a solicitacao **some**; se ninguem aceita, **nada acontece**. Regra-chave: **sem mudanca brusca de tempo na fila** (so troca entre janelas compativeis). Backend a fazer: entidade de solicitacao de troca (open + horario desejado), calculo da janela por ETA, endpoints criar-intencao + aceitar, broadcast WS so para os clientes na janela. **Distinto do encaixe** (C5/`/fit-in`, que e cliente→profissional). |

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

**Itens pos-MVP (spec, NAO implementar agora):** #37 lock da estimativa (estabilizar ETA travada por cliente), #38 encaixe com equalizacao de tempo, #39 multa/aviso de cancelamento tardio.

**Plano do front (integrar contra STAGING ja — backend confirmou que nao precisa esperar a main):**
- **Fase A — Horario de funcionamento:** add `opening_time`/`closing_time` ao Establishment + store; tela/secao de horario (em Dados Cadastrais ou tela propria) via PATCH general-infos; no "Abrir" do dashboard, tratar `422 ESTABLISHMENT_HOURS_REQUIRED` → rotear pra tela de horario; add o codigo ao `ERROR_MESSAGES_PT`.
- **Fase B — Editar refeicoes (settings do profissional):** modulo/store de intervalos (GET/PATCH/DELETE/POST recurring); listar almoco/janta, editar horario+duracao, remover, recriar; tratar `400 INTERVAL_INVALID_TIME` e `409 INTERVAL_CONFLICT`; avisar refeicao fora da janela.
- **Fase C — Fila (queue.tsx):** ✅ **FEITO (2026-06-17).** Secao "Refeicoes" na fila: botao "Iniciar" (`PATCH .../start`) e, quando ACTIVE, "Encerrar" (`PATCH .../finish`); iniciar um atendimento ja encerra a refeicao ativa no backend (refetch reflete). Popup de nudge no horario previsto (`now >= fixedStartTime` e status SCHEDULED), uma vez por refeicao/sessao (anti-nag via ref), com contagem da fila: acoes **"Iniciar agora"** (start) e **"Agora nao"**. ⚠️ **DECISAO PROVISORIA:** "Agora nao" hoje so **dispensa o popup** (a refeicao prevista segue sendo empurrada pelos atendimentos, regra "some na proxima"). O **"Nao almocar (pular hoje, derrubando do ETA de TODOS na hora)"** do spec precisa de um **endpoint de skip por dia no backend** (nao existe; `finish` so encerra refeicao ATIVA, `delete` e permanente) — pendencia backend a definir.
- Tests-first em toda logica de store/parse (ex.: parser do `fixedStartTime` com segundos opcionais).

### 11.1 Pendencias que pertencem ao FRONT-CLIENT (registradas aqui pelo front-partner)

> Itens descobertos no front-partner mas cujo **frontend pertence ao app cliente** (repo `vupth/`, fora do escopo de edicao deste projeto). Registrados aqui para alinhamento: quando o usuario precisar, ele manda o front-client ler estas pendencias e implementar.

| # | Item | Descricao | Justificativa |
|---|------|-----------|---------------|
| C1 | **Busca de estabelecimento por bairro ordenada por menor fila** | A busca em que o **cliente** escolhe a barbearia pelo bairro (e depois por GPS, fase 2) **ordenada pela menor fila** e uma feature do **app cliente**, nao do partner. O partner so tem busca de afiliacao (profissional procura establishment para se vincular, sem ordenacao por fila). Depende do mesmo endpoint backend #2 (`GET /establishment?neighborhood=X` + tempo de espera agregado + ordenacao). | Esclarecimento do usuario (2026-06-14): o #2 (bairro/menor fila) e do front-client. Implementar no repo `vupth/` quando o backend #2 entregar. |
| C2 | **Atualizar o Gluestack no front-client** | Assim como foi feito no front-partner (2026-06-14: `@gluestack-ui/themed` 1.1.54 → 1.1.73, ultima da linha v1), o app cliente (`vupth/`) deve atualizar o Gluestack para a ultima v1 e, depois, avaliar a migracao v1 → v2 (refactor grande, base nativewind). Manter as duas bases alinhadas na mesma versao. **Atencao:** o bump 1.1.73 passa a puxar `@gluestack-ui/tooltip → react-aria → react-dom`; foi preciso adicionar `react-dom` (mesma versao do React, ex.: 19.1.0) so para o Metro resolver o import, e reiniciar o bundler com cache limpo (`expo start -c`). | Pedido do usuario (2026-06-14). O front-client esta atras no `package.json` (ex.: `@gluestack-ui/themed` ^1.1.34, `@gluestack-ui/config` ^1.1.19). Implementar no repo `vupth/` quando o usuario autorizar. |
| C3 | **Tempo real via WebSocket (STOMP) — fila + notificacoes pessoais** | O backend entregou o tempo real (2026-06-14, commit 9bf858f; contrato em PRD_BACKEND secao 18b). O **front-client** deve: **(1)** instalar `@stomp/stompjs`; **(2)** derivar a URL do socket do BASE_URL (`http→ws`, `https→wss`, sufixo `/ws`); **(3)** conectar com `connectHeaders: { Authorization: "Bearer <access_token>" }` no frame CONNECT (necessario para receber notificacoes pessoais; sem token recebe so topicos publicos); **(4)** SUBSCRIBE `/topic/establishment/{id}/queue` — snapshot COMPLETO da fila (igual ao `GET /establishment/id/{id}/professionals-with-queue`), reenviado a cada mudanca → usar para atualizar a tela de fila do cliente em tempo real e **substituir o polling**, mantendo um refetch como fallback; **(5)** SUBSCRIBE `/user/queue/notifications` (autenticado) — notificacao pessoal do cliente: `ATTENDANCE_STARTED` (mensagem "E a sua vez! ...") e `ATTENDANCE_FINISHED` ("Seu atendimento foi concluido."). Payload: `{ type, attendanceId, establishmentId, message, timestamp }`. Exibir como alerta/toast in-app no minimo; push real (app em background) depende do backend #3 (device token) — fora deste escopo. **Modelo de referencia:** o front-partner ja implementou o lado do `/topic/.../queue` em `src/hooks/useQueueSocket.ts` (embutido em `useQueuePolling`/`useProfessionalQueue`); o client pode espelhar o mesmo padrao e adicionar a subscription de `/user/queue/notifications`. | Backend concluido (roadmap #1). O cliente e o maior beneficiario das notificacoes pessoais ("e a sua vez"). Implementar no repo `vupth/` quando o usuario autorizar. |
| C4 | **Nao exibir profissional sem servico** | O backend (2026-06-14, commit d2ea594, #31) ja filtra profissionais sem servico em `GET /establishment/id/{id}/professionals-with-queue` e so abre a loja com >=1 profissional com >=1 servico. **Acao do client:** majoritariamente automatico (o backend nao retorna esses profissionais); apenas garantir que a UI nao assume profissionais "fantasma" e que listas vazias sao tratadas. | Backend concluido (#31). So validar no front-client. |
| C5 | **Encaixe — cliente pede atendimento antecipado (cliente→profissional)** | Mecanismo em que o **cliente pede ao profissional** para ser atendido antes; o **profissional decide**. Backend ja tem `PATCH /attendances/{id}/fit-in?aheadCount=N` (+ `/undo-fit`) — porem `/fit-in` e endpoint do **PROFESSIONAL**, entao o fluxo real e: cliente solicita (front-client) → o profissional ve/aprova e ai o app chama o `/fit-in`. **A definir:** se a aprovacao do pro entra no front-partner (provavel pequena peca partner) ou se o backend cria um endpoint de "pedido de encaixe" que o pro confirma. **Distinto da troca entre clientes (C6).** | Backend (fit-in) pronto. UI do pedido no `vupth/`; confirmar o lado da aprovacao. |
| C6 | **Troca de posicao entre clientes (marketplace) — UI do cliente** | Lado client da pendencia backend **S2**. UI: (1) o cliente **manifesta intencao de troca** (adiantar OU atrasar) escolhendo o **horario desejado**; (2) a solicitacao **aberta** aparece **so para os clientes dentro daquela janela** (pelo ETA de cada um) — modelo igual ao da solicitacao de afiliacao (open, mutua); (3) **primeiro que aceita** efetiva a troca e a solicitacao **some**; ninguem aceita → nada. **Sem solavanco de tempo.** O profissional **nao participa**. Depende do backend **S2** (entidade + janela + aceite + broadcast). | Feature nova. Implementar no `vupth/` quando o backend S2 entregar. |
| C7 | **Alinhamento de design "Verde Imersivo" com o front-partner** | Aplicar no front-client a mesma linguagem que o partner fechou (2026-06-26). **Tokens** (`gluestack-ui.config.ts`): off-white **#F7FAF8**; verde 400 #52B788 / 500 #00B37E (CTA) / 600 #009E6F / 700 #1B4332; amber 500 #FFB703; red 500 #E63946; fontes **Poppins** (titulos/botoes) + **Inter** (texto). **Componentes a espelhar** (1:1 com o partner): `cardShadow` (`src/lib/styles.ts`) em cards cantos $2xl sem borda; **Button** pilula (`rounded $full`)+sombra+Poppins; **Input** `borderRadius $xl`, fundo branco, borda cinza ($coolGray300)→verde no foco ($green500, borda 2); **Skeleton** (`Skeleton.tsx`: SkeletonCard/List, shimmer pulso 0.45↔1 base #E2E9E5, forma dos cards reais) no lugar dos Spinner; **Tab bar** `TabBarIcon` (icone outline quando inativo / preenchido verde quando ativo — **sem pilula**, o preenchimento e o indicador da aba; sombra superior offset {0,-4}; active #00B37E, inactive #9CA3AF). **Fonte da verdade da paleta/fontes:** PRD secao **13.1** (Guia de Design PDF). **Referencias no repo partner:** `design/redesign-form-tabbar-skeleton.html` (mockup aprovado), `src/components/{Button,Input,Skeleton,TabBarIcon}.tsx`, `src/lib/styles.ts`. | Pedido do usuario (2026-06-26): consistencia visual entre os apps. Implementar no `vupth/`; facilita se atualizar o Gluestack antes (ver **C2**). |

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

### Agenda / Agendamento

Sistema de intencoes semanais para clientes reservarem horario na fila:

**Fluxo:**
1. Profissional define horarios disponiveis por dia da semana (ex: seg-sex 9h-18h, sab 9h-13h)
2. Cliente visualiza horarios e registra intencao de atendimento (nao e reserva fixa)
3. No dia, cliente faz check-in para confirmar presenca → entra na fila
4. Ordem da fila: check-in do dia ordena por horario agendado, depois por ordem de chegada

**Backend necessario:**
- `POST /professional/{id}/schedule` — definir disponibilidade semanal
- `GET /professional/{id}/schedule` — consultar disponibilidade
- `POST /professional-queue/schedule-intention` — cliente registra intencao
- `POST /professional-queue/check-in` — cliente confirma presenca no dia
- Novo status: INTENDED (antes do check-in), depois vira SCHEDULED

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
**typecheck -> jest -> expo-doctor** (esse ultimo pega quebras de config/nativo que
o jest nao pega — foi a classe de erro do CNG).

- **Local — pre-push hook** (`.githooks/pre-push`): roda antes de cada `git push` e
  **aborta** se algo falhar. Ativado por `core.hooksPath=.githooks`, religado
  automaticamente no `npm install` (script `prepare` no `package.json`).
  Bypass de emergencia: `git push --no-verify`.
- **Servidor — CI** (`.github/workflows/ci.yml`): typecheck + jest + cobertura (gate
  de threshold) + **expo-doctor**, em push (`dev`/`main`) e PR para `main`.
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
