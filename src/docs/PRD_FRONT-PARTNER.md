# VUPTH Front Partner — PRD (Product Requirements Document)

> Documento de comunicacao entre frontend partner e backend.
> Descreve os fluxos implementados, endpoints consumidos, formato dos requests/responses,
> e o que esta pendente no frontend.
>
> **App:** React Native 0.81 + Expo SDK 54, Gluestack UI v1, Expo Router v6
> **State:** Zustand v5 + Axios + Expo SecureStore
> **Testes:** Jest 29 + axios-mock-adapter
>
> **Ultima atualizacao:** 2026-06-12 (v4 — fluxo afiliar-primeiro, autoCapitalize nos inputs)

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
| `/establishment/{id}/professionals` | POST | Owner | **FUTURO** | — |
| `/attendances/{id}/cancel` | PUT | Client | **FUTURO** | — |
| `/profile/general-infos` | PATCH | Client | **FUTURO** | — |
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
6. **(owner)/(tabs)/dashboard.tsx** — Badge ABERTO/FECHADO, toggle, polling fila 30s, cards (fila, profissionais com nome/especialidade/fila/disponibilidade). useIsFocused para BackHandler. Se establishment null → botao "Criar Estabelecimento". Guard de abertura: bloqueia "Abrir Estabelecimento" se nao ha profissional vinculado (alerta com acao "Adicionar Profissional"); validacao completa (profissional com servico) depende do backend — ver pendencia #7
7. **(owner)/(tabs)/menu.tsx** — Menu: Dados Pessoais (→ coming-soon "falta implementar"), Dados do Estabelecimento (→ address), Relatorios (→ coming-soon). Secao de gestao: Adicionar Profissional (se owner ja e PROFESSIONAL → add-professional info afiliacao; senao → also-professional quick-create), Solicitacoes, Servico, Filas, Atendimentos. Secao inferior: "Sair do Estabelecimento" (amber) e "Sair da Conta" (vermelho)

   - **coming-soon.tsx** (owner) — tela placeholder reutilizavel (`src/components/ComingSoon.tsx`) com titulo via param e mensagem "Em desenvolvimento / falta implementar". Usada por Dados Pessoais e Relatorios (owner). No professional o item "Dados Pessoais" foi ocultado (sem sentido por enquanto — decisao 2026-06-13)
8. **(owner)/(tabs)/add-professional.tsx** — Dois modos: (a) Se !PROFESSIONAL: formulario quick-create com tratamento 409 (tenta affiliate); (b) Se PROFESSIONAL: info afiliacao + "Ver Solicitacoes"
9. **(owner)/(tabs)/affiliations.tsx** — Solicitacoes de vinculacao: pendentes (aceitar/rejeitar) + historico. `GET /establishment/{id}/affiliations`, `PATCH /affiliations/{id}/accept|reject`
10. **(owner)/(tabs)/add-service.tsx** — Especialidade → tipo de servico → nome + preco + pricing preview → `POST /establishment/{id}/service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice` do calculatePricing: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12)
11. **(owner)/(tabs)/queues.tsx** — Visao de todas as filas por profissional (cards expansiveis), total na fila, profissionais disponiveis
12. **(owner)/(tabs)/professional-queue.tsx** — Fila detalhada de um profissional via `GET /client-queue/{profId}/queue`
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
5. **(professional)/queue.tsx** — Gerenciamento de fila: atendimento atual + lista de espera, start/pause/resume/finish/remove, polling 30s, pull-to-refresh, botao "Adicionar Walk-in". Botao "Buscar Estabelecimento" quando nao afiliado
6. **(professional)/add-guest.tsx** — Adicionar cliente walk-in: nome + selecao multipla de servicos + total → `POST /professional-queue/add-quest-attendance`
7. **(professional)/my-services.tsx** — Lista servicos + formulario com filtro por especialidade + pricing preview com absorcao. Guard: se profissional nao tem `establishment_id`, exibe aviso e botao para buscar estabelecimento (bloqueia adicao de servico); nesse estado faz `fetchMe()` no mount e no pull-to-refresh para detectar afiliacao aceita pelo owner (queue.tsx faz o mesmo no mount). Quando afiliado, mostra "Vinculado a {establishment_name}". Usa `POST /professional-queue/{profId}/add-service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice`: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12). Lista mostra o tipo de servico humanizado (humanizeServiceType, sem underline). Falta editar/remover servico — ver pendencia backend #10
8. **(professional)/find-establishment.tsx** — Gate no mount via `fetchMe` + `GET /professional/me/affiliations`: se ja afiliado mostra "Voce ja esta vinculado" (link Configuracoes); se tem solicitacao PENDING mostra "Solicitacao em andamento" (so 1 estabelecimento por vez); senao libera a busca. Auto-load `GET /establishment` (lista todos), busca por nome (`GET /establishment?name=X`), solicitar vinculacao (`POST /professional/me/affiliations { establishmentId }`). Nao exige servicos — ordem: afiliar primeiro, servicos depois. Busca por bairro/proximidade ordenada por fila pendente — ver pendencia backend #11
9. **(professional)/profile.tsx** — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
10. **(professional)/attendances.tsx** — Historico de atendimentos: auto-load no mount, filtros (todos/finalizados/cancelados) → `GET /attendances`, erro real do backend + "tentar novamente"
11. **(professional)/reports.tsx** — Stats do dia (fila, tempo estimado), semana/mes aguardando endpoint
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
      dashboard.tsx              — Badge ABERTO/FECHADO, toggle, polling fila, pull-to-refresh, lista de profissionais com fila
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
    queue.tsx                    — Gerenciamento de fila + botao "Adicionar Cliente", polling 30s, pull-to-refresh
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

### Bugs reportados — Teste manual (2026-06-05)

| # | Bug | Status | Detalhe |
|---|-----|--------|---------|
| 1 | "Walk-in" → "Adicionar Cliente" | ✅ Corrigido | Renomeado em queue.tsx e add-guest.tsx |
| 2 | Entrar/sair do establishment nas configs do profissional | ✅ Implementado (2026-06-12) | settings.tsx: "Desafiliar do Estabelecimento" com confirmacao quando afiliado; "Buscar Estabelecimento" quando nao afiliado. Falta o lado do owner — ver pendencia backend #9 |
| 3 | Tela toda branca, status bar invisivel | ✅ Corrigido | SafeAreaProvider + StatusBar sem translucent + Header com useSafeAreaInsets |
| 4 | Tab bar atras dos botoes de navegacao Android | ✅ Corrigido | useSafeAreaInsets().bottom no paddingBottom do tabBarStyle |
| 5/10/11 | Erro ao adicionar servico no fluxo de afiliacao | FIX PARCIAL | Adicionada normalizacao camelCase/snake_case em professional.store (normalizeProfessional). Se persistir, e bug no backend GET /professional/{id}/service-items |
| 6 | Cliente entra na fila sem servicos existentes | BACKEND | Validacao deve estar no backend — negar attendance se profissional nao tem service items |
| 7 | "checking for new update..." no rodape | EXPO GO | Mensagem do Expo Go dev client, nao aparece em build de producao. Pode ser suprimida com `expo-updates` configurado |
| 8 | Validacao de senha segura (letra, numero, especial, confirmar) | PENDENTE | Adicionar validacao Zod no register.tsx: min 8 chars, 1 letra, 1 numero, 1 especial + campo confirmar senha |
| 9 | Politica de Precos: renomear "Taxas Vupth" | PENDENTE | Renomear labels de pricing para "Taxas Vupth" conforme identidade da marca |
| 12 | Teclado cobre formularios | ✅ Corrigido | KeyboardAvoidingView adicionado em todas as 10 telas de formulario |
| 13 | Icone de lupa na aba de pesquisa | PENDENTE | Nao existe aba de pesquisa ainda — precisa criar tela + tab |
| 14 | Profissionais sem servicos nao devem aparecer para clientes | BACKEND/FRONTEND | Regra (2026-06-12): mesmo com a loja ABERTA, profissional sem nenhum servico cadastrado nao pode aparecer para os clientes (app client e filas publicas). Filtrar no backend (with-queue e busca de establishments) — frontend client nao tem como saber os servicos de cada profissional. Relacionado a pendencia backend #7 (status ATIVA) |
| 15 | Pull-to-refresh em telas de dados | ✅ Implementado | RefreshControl em my-services.tsx, dashboard.tsx. queue.tsx ja tinha |

### Alta prioridade (MVP)
| Item | Descricao |
|------|-----------|
| Estado de solicitacao de afiliacao pendente | ✅ Parcial (2026-06-13): find-establishment.tsx ja bloqueia a lista quando o profissional ja esta afiliado ou tem solicitacao PENDING (card explicativo, sem permitir nova solicitacao). **Falta**: botao "Cancelar solicitacao" (depende de endpoint backend #8) e validacao de pendencia unica global no backend. Usa `GET /professional/me/affiliations` (filtrar PENDING) |
| Editar e remover servicos do profissional | my-services.tsx so permite adicionar. Adicionar acao de editar (nome/preco/absorcao) e remover cada servico da lista. Depende de endpoints no backend — ver pendencia backend #10 |
| Busca de estabelecimento por proximidade/bairro ordenada por fila | find-establishment.tsx: (1) primeiro listar por proximidade de GPS do profissional; (2) se sem GPS, buscar por bairro; (3) ordenar o resultado por tempo de espera (menor → maior). Hoje so lista todos + busca por nome. Depende do backend — ver pendencia backend #11 |
| ~~Fila completa (visao do owner)~~ | ✅ Implementado |
| ~~Fila publica por profissional~~ | ✅ Implementado |
| ~~Adicionar client GUEST na fila~~ | ✅ Implementado |
| ~~Historico de atendimentos por role~~ | ✅ Implementado (frontend + backend) |
| Testar manualmente no celular | Validar todos os fluxos (owner e professional) com backend local via Expo Go |
| Rodar Maestro seed_complete.yaml | Seed E2E: 4 establishments + profissionais + servicos |

### Media prioridade
| Item | Descricao |
|------|-----------|
| Completar dados do establishment | Frontend pronto (address.tsx conectado + addAddress no store). Backend `POST /establishments/{id}/addresses` implementado |
| React Hook Form + Zod | Validacao nos formularios |
| Tratar TEMPORARILY_CLOSED | Terceiro estado no toggle do dashboard |
| Paleta PRD | #1B4332, #52B788, #00B37E, #F7FAF8 |
| Fontes DM Sans + DM Mono | — |
| Implementar intermediador de pagamento | Integrar Stripe/Pagar.me, ativar split real de taxas (6% = 4% intermediador + 2% plataforma). Unificar `src/utils/pricing.ts` e `src/lib/pricing.ts` neste momento |

### Baixa prioridade
| Item | Descricao |
|------|-----------|
| Owner gerencia profissionais externos | `POST /establishment/{id}/professionals` — owner vincula profissional existente |
| Profile do usuario | `PATCH /profile/general-infos` |
| Migrar Gluestack v1 → v2 | Resolver warnings React 19 |

---

## 11. Pendencias futuras para o Backend (escrito pelo front-partner)

> Itens que o frontend partner precisa do backend.
> Marcados com **PRIORIDADE** os que serao implementados em breve.

| # | Item | Descricao | Justificativa |
|---|------|-----------|---------------|
| 1 | ~~**Endpoint de historico de atendimentos**~~ | `GET /attendances?establishmentId=X&professionalId=Y&status=FINISHED` | ✅ **IMPLEMENTADO** no backend (2026-06-09). Acesso: OWNER ou PROFESSIONAL. Query params: establishmentId, professionalId, dateFrom, dateTo, status. Bugs de SecurityConfig e ownership corrigidos |
| 2 | ~~**`GET /professional/me`**~~ | ~~Retorna dados do profissional logado~~ | ✅ **IMPLEMENTADO** no backend (2026-06-07). Auth: ROLE_PROFESSIONAL |
| 2b | ~~**`GET /establishment/mine`**~~ | ~~Lista establishments do owner logado~~ | ✅ **IMPLEMENTADO** no backend (2026-06-07). Auth: ROLE_OWNER. Retorna `EstablishmentResponse[]` |
| 3 | **Precificacao inteligente no ServiceItem** | Adicionar campos `uses_platform_pricing: boolean` e `client_price: number` ao ServiceItem | Hoje o calculo (4% intermediador + 2% plataforma + arredondamento estetico para R$X,90) e feito no frontend. O backend deve ser a fonte da verdade para que o app cliente exiba o preco correto |
| 4 | **Endpoint de relatorios agregados** | `GET /establishment/{id}/reports?period=day\|week\|month` retornando total_attendances, total_revenue, avg_duration, top_professional, top_service | Evita que o frontend faca agregacao client-side de centenas de atendimentos. Melhor performance e consistencia |
| 5 | **Endpoint de historico de receita por profissional** | `GET /professional/{id}/revenue?dateFrom=Y&dateTo=Z` | Para o owner ver quanto cada profissional faturou no periodo e calcular comissoes |
| 6 | **PRIORIDADE — Busca de profissionais** | `GET /professional?name=X&specialty=Y` — listar profissionais por nome e/ou especialidade (publico ou OWNER). | ❌ **NAO EXISTE NO BACKEND** (verificado 2026-06-08). O owner precisa buscar profissionais para enviar convite de afiliacao via `POST /establishment/{id}/affiliations { "professionalId": "uuid" }`. Sem este endpoint, o owner so pode aceitar solicitacoes vindas dos profissionais, nao pode convidar proativamente. Response esperado: `[{ id, name, specialty, isAvailable }]`. **Roadmap backend: #32 (entrada 2026-06-13, nao priorizado)** |
| 7 | **Status ATIVA do estabelecimento** | Estabelecimento so pode ser aberto (`open_status=OPEN`) se estiver "ativo": ter pelo menos 1 profissional vinculado com pelo menos 1 servico cadastrado. Backend deve validar no endpoint de open-status e retornar 422 com codigo claro (ex: `ESTABLISHMENT_NOT_READY`) e mensagem explicando o que falta (sem profissional / profissional sem servico). Complemento: profissional sem servico nao deve aparecer para clientes mesmo com a loja aberta (filtrar no with-queue e na busca publica) | O frontend ja bloqueia abertura quando nao ha profissional vinculado (check parcial no dashboard, 2026-06-12), mas nao consegue verificar se cada profissional tem servico — o `GET /establishment/{id}/with-queue` nao retorna servicos por profissional. Backend e a fonte da verdade. Alternativa: incluir `services_count` por profissional no response da fila. **Roadmap backend: #31 (entrada 2026-06-13, nao priorizado)** |
| 8 | **Cancelamento e pendencia unica de afiliacao** | (a) Endpoint para o profissional cancelar a propria solicitacao PENDING (ex: `PATCH /affiliations/{id}/cancel`, status CANCELLED ja existe no modelo); (b) validar pendencia unica global: profissional com solicitacao PENDING nao pode criar outra para nenhum estabelecimento (hoje o 409 AFFILIATION_ALREADY_PENDING so cobre o mesmo estabelecimento) — retornar 409 com codigo claro (ex: `AFFILIATION_PENDING_ELSEWHERE`) | Regra de produto (2026-06-12): o profissional aguarda o retorno do estabelecimento antes de poder solicitar a outro — ou desiste (cancela) ou recebe aceite/recusa. Sem o endpoint de cancelamento o profissional fica preso aguardando indefinidamente. **Roadmap backend: #29 (entrada 2026-06-13, nao priorizado)** |
| 9 | **Owner desafiliar profissional** | Endpoint para o owner remover um profissional do estabelecimento (ex: `DELETE /establishment/{id}/professionals/{profId}`). Regras: nao permitir se o profissional tem atendimento em andamento; fila pendente do profissional deve ser cancelada ou realocada | Regra de produto (2026-06-12): a desafiliacao deve ser possivel dos dois lados. O lado do profissional ja existe (`DELETE /professional/me/establishment`, implementado no settings em 2026-06-12); falta o lado do owner. UI prevista: acao "Desvincular" na lista de profissionais do dashboard ou na tela professional-queue do owner. **Roadmap backend: #30 (entrada 2026-06-13, nao priorizado)** |
| 10 | **Editar e remover ServiceItem do profissional** | Endpoints para o profissional editar e remover seus servicos: ex. `PATCH /professional-queue/{profId}/service-items/{itemId}` (nome, preco) e `DELETE /professional-queue/{profId}/service-items/{itemId}`. Hoje so existe o POST de adicionar | Pedido do usuario (2026-06-12): my-services.tsx precisa permitir editar e remover servicos, nao so adicionar. **Roadmap backend: #15 (MEDIA PRIORIDADE / v2; consolidado com edicao/delecao no establishment — PUT/DELETE /establishment/{id}/service-items/{itemId} e PATCH/DELETE /professional-queue/{profId}/service-items/{itemId})** |
| 11 | **Busca de estabelecimento por bairro (PRIORIDADE) e por proximidade, ordenada por fila** | **Fazer primeiro a busca por bairro** (decisao 2026-06-13): `GET /establishment?neighborhood=X` — depende de cadastrar e expor o bairro no endereco do establishment; o response deve incluir tempo de espera agregado por establishment para ordenar (menor → maior). Depois (fase 2): busca por proximidade de GPS `GET /establishment?lat=X&lng=Y&radiusKm=Z` ordenando do mais perto, exigindo captura de localizacao no app | Pedido do usuario: fluxo de busca deve priorizar bairro primeiro; GPS vem depois; resultado sempre ordenado pela menor fila. Hoje o front so faz `GET /establishment` (todos) e `GET /establishment?name=X`. Bloqueado: o EstablishmentResponse atual nao traz bairro nem tempo de espera agregado. **Roadmap backend: #2 (TOPO / proximo; Fase 1 = bairro: `GET /establishment?neighborhood=X` + campo neighborhood no endereco + tempo de espera agregado + ordenacao menor→maior; Fase 2 = GPS lat/lng/radiusKm) — quando entregue, implementar o frontend da busca por bairro** |

---

## 12. Features Futuras (Planejamento)

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
