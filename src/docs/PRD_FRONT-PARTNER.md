# VUPTH Front Partner — PRD (Product Requirements Document)

> Documento de comunicacao entre frontend partner e backend.
> Descreve os fluxos implementados, endpoints consumidos, formato dos requests/responses,
> e o que esta pendente no frontend.
>
> **App:** React Native 0.81 + Expo SDK 54, Gluestack UI v1, Expo Router v6
> **State:** Zustand v5 + Axios + Expo SecureStore
> **Testes:** Jest 29 + axios-mock-adapter
>
> **Ultima atualizacao:** 2026-06-05

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
| `/professional/affiliate` | POST | Professional | Implementado | 2 |
| `/establishment/id/{id}/professionals-with-queue` | GET | Owner | Implementado | 2 |
| `/attendances/{id}/start` | PATCH | Professional | Implementado | 2 |
| `/attendances/{id}/finish` | PATCH | Professional | Implementado | 2 |
| `/attendances/{id}/pause` | PATCH | Professional | Implementado | 1 |
| `/attendances/{id}/resume` | PATCH | Professional | Implementado | 2 |
| `/professional-queue/{id}/remove` | DELETE | Professional | Implementado | 1 |
| `/professional/{id}/service-items` | GET | Professional | Implementado | — |
| `/client-queue/{profId}/queue` | GET | Publico | Implementado | 2 |
| `/professional-queue/add-quest-attendance` | POST | Professional | Implementado | 2 |
| `/attendances` | GET | Ambos | Implementado (frontend) | 3 |
| `/establishment/{id}/professionals` | POST | Owner | **FUTURO** | — |
| `/attendances/{id}/cancel` | PUT | Client | **FUTURO** | — |
| `/profile/general-infos` | PATCH | Client | **FUTURO** | — |
| `/establishments/{id}/addresses` | POST | Owner | **FUTURO** (frontend pronto) | — |
| `/users/me/addresses` | POST | Client | **FUTURO** | — |

---

## 3. Fluxo 1 — Owner Solo Shop

### Telas
1. **(auth)/index.tsx** — Escolha de papel: "Sou dono" vs "Sou profissional"
2. **(auth)/register.tsx** — Email + senha → `POST /auth/register` → auto-login
3. **(owner)/onboarding/establishment.tsx** — Nome + tipo → `POST /establishment/quick-create`
4. **(owner)/dashboard.tsx** — Badge ABERTO/FECHADO, toggle, polling fila 30s, botoes: add prof/servico/filas/endereco/sair
5. **(owner)/add-professional.tsx** — Nome + especialidade → `POST /professional/quick-create`
6. **(owner)/add-service.tsx** — Especialidade → tipo de servico → nome + preco + pricing preview → `POST /establishment/{id}/service-items`
7. **(owner)/queues.tsx** — Visao de todas as filas por profissional (cards expansiveis), total na fila, profissionais disponiveis, link para fila detalhada
8. **(owner)/professional-queue.tsx** — Fila detalhada de um profissional via `GET /client-queue/{profId}/queue` — atendimento atual + lista de espera + tempo estimado
9. **(owner)/attendances.tsx** — Historico de atendimentos do establishment: filtros (todos/finalizados/cancelados), resumo de receita
10. **(owner)/onboarding/address.tsx** — Endereco do establishment (frontend pronto, backend pendente)

### Sequencia de chamadas
```
POST /auth/register { email, password }
POST /auth/login { email, password }
  → armazena tokens no SecureStore
POST /establishment/quick-create { name, serviceType }
  → ganha OWNER
POST /auth/refresh { refresh_token }
  → novo token com ROLE_OWNER
POST /professional/quick-create { name, establishmentId, specialty? }
  → ganha PROFESSIONAL
POST /auth/refresh { refresh_token }
  → novo token com ROLE_PROFESSIONAL
POST /establishment/{id}/service-items { serviceItemType, customName, price }
PATCH /establishment/{id}/open-status { openStatus: "OPEN" }
```

### Regras de negocio
- Owner so pode criar UM perfil profissional (o dele mesmo)
- Service items sao vinculados ao profissional (JWT userId), nao ao establishment
- Owner PRECISA ter perfil profissional antes de adicionar services
- `estimatedMinutes` nao e enviado — backend tem default 30 via @PrePersist, atualizado semanalmente pela media dos atendimentos

---

## 4. Fluxo 2 — Professional

### Telas
1. **(auth)/index.tsx** — Escolha "Sou profissional" (compartilhada)
2. **(auth)/register.tsx** — Email + senha (compartilhada)
3. **(professional)/onboarding.tsx** — 3 steps:
   - Step 1: Nome + especialidade → `POST /professional/register`
   - Step 2: Buscar establishment → `GET /establishment?name=X`
   - Step 3: Selecionar da lista → `POST /professional/affiliate { establishmentId }`
4. **(professional)/_layout.tsx** — Tab navigation: Fila | Servicos | Perfil
5. **(professional)/queue.tsx** — Gerenciamento de fila: atendimento atual + lista de espera, start/pause/resume/finish/remove, polling 30s, pull-to-refresh, botao "Adicionar Walk-in"
6. **(professional)/add-guest.tsx** — Adicionar cliente walk-in: nome + selecao multipla de servicos + total → `POST /professional-queue/add-quest-attendance`
7. **(professional)/my-services.tsx** — Lista servicos + formulario com filtro por especialidade + pricing preview com absorcao
8. **(professional)/profile.tsx** — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
9. **(professional)/attendances.tsx** — Historico de atendimentos: filtros (todos/finalizados/cancelados) → `GET /attendances` (backend pendente)
9. **(professional)/reports.tsx** — Stats do dia (fila, tempo estimado), semana/mes aguardando endpoint
10. **(professional)/settings.tsx** — Dados do profissional (nome, email, senha, establishment) — edicao em breve

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
POST /professional/affiliate { establishmentId }
  → profissional vinculado ao establishment
```

### Regras de negocio
- Profissional so pode estar vinculado a 1 establishment por vez (MVP)
- affiliate requer establishment_id == null (nao pode estar afiliado a outro)
- Ja afiliado → 409 PROFESSIONAL_ALREADY_AFFILIATED
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

**POST /professional/affiliate (200):**
```json
{
  "id": "uuid",
  "name": "Joao Silva",
  "specialty": "BARBER",
  "establishment_id": "uuid",
  "establishment_name": "Barbearia do Andre",
  "is_available": true,
  "message": "..."
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
- `reset()` — limpa estado ao fazer logout

### professional.store.ts
- `register(name, specialty?)` — POST /professional/register
- `affiliate(establishmentId)` — POST /professional/affiliate
- `fetchMyServices()` — GET /professional/{id}/service-items
- `restoreProfessional()` — recupera dados do SecureStore ao reiniciar app
- `reset()` — limpa estado ao fazer logout

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
  _layout.tsx                    — GluestackUIProvider + fontes + LogBox suppress
  (auth)/
    index.tsx                    — Escolha de papel (Owner vs Professional)
    login.tsx                    — Login conectado ao authStore
    register.tsx                 — Register + auto-login + redirect por role
  (owner)/
    onboarding/
      establishment.tsx          — Quick-create establishment
      address.tsx                — Endereco conectado ao store (backend pendente)
      services.tsx               — Servicos (visual, sem API)
    dashboard.tsx                — Badge ABERTO/FECHADO, toggle, polling fila, botoes: add prof/servico/filas/atendimentos/endereco/sair
    add-professional.tsx         — Criar profissional (quick-create) com especialidade
    add-service.tsx              — Adicionar servico com filtro por especialidade (21 tipos) + pricing preview
    queues.tsx                   — Visao de todas as filas: cards por profissional (expansiveis), link para fila detalhada
    professional-queue.tsx       — Fila detalhada de um profissional (GET /client-queue/{profId}/queue)
    attendances.tsx              — Historico de atendimentos do establishment (filtros, resumo receita)
  (professional)/
    _layout.tsx                  — Tab navigation: Fila | Servicos | Perfil
    onboarding.tsx               — 3 steps: profile → busca → afiliacao
    queue.tsx                    — Gerenciamento de fila + botao "Adicionar Walk-in", polling 30s
    add-guest.tsx                — Adicionar walk-in: nome + multi-select servicos + total (POST /professional-queue/add-quest-attendance)
    my-services.tsx              — Lista + CRUD servicos com pricing preview (absorcao por faixa)
    profile.tsx                  — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
    attendances.tsx              — Historico de atendimentos (filtros, GET /attendances — backend pendente)
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

---

## 8. Enums da API

### ServiceType (tipo de estabelecimento)
| Valor | Descricao |
|-------|-----------|
| BARBER | Barbearia |
| BEAUTY_SALON | Salao de beleza |
| NAIL_SALON | Manicure / pedicure |
| SPA | SPA |
| CLINIC | Clinica estetica |

### ServiceItemType (21 valores)
| Valor | ServiceType compativel |
|-------|----------------------|
| CORTE_MAQUINA | BARBER |
| CORTE_TESOURA | BARBER |
| BARBA | BARBER |
| SOBRANCELHA | BARBER |
| PINTURA | BARBER, BEAUTY_SALON |
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

### Alta prioridade (MVP)
| Item | Descricao |
|------|-----------|
| ~~Fila completa (visao do owner)~~ | ~~`queues.tsx` + `professional-queue.tsx`~~ ✅ Implementado |
| ~~Fila publica por profissional~~ | ~~`GET /client-queue/{profId}/queue` — hook `useProfessionalQueue`, tela `professional-queue.tsx`~~ ✅ Implementado |
| ~~Adicionar client GUEST na fila~~ | ~~`add-guest.tsx` + botao Walk-in na fila — `POST /professional-queue/add-quest-attendance`~~ ✅ Implementado |
| ~~Historico de atendimentos por role~~ | ~~Owner `attendances.tsx` (por establishment) + Professional `attendances.tsx` (pessoal) — filtros por status~~ ✅ Frontend implementado, **backend GET /attendances pendente** |
| Testar manualmente no celular | Validar todos os fluxos (owner e professional) com backend local via Expo Go |
| Rodar Maestro seed_complete.yaml | Seed E2E: 4 establishments + profissionais + servicos |

### Media prioridade
| Item | Descricao |
|------|-----------|
| Completar dados do establishment | Frontend pronto (address.tsx conectado + addAddress no store). **Aguardando endpoint backend `POST /establishments/{id}/addresses`** |
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
| 1 | **PRIORIDADE — Endpoint de historico de atendimentos** | `GET /attendances?establishmentId=X&professionalId=Y&status=FINISHED` — listar atendimentos por establishment, profissional e status. | ❌ **NAO EXISTE NO BACKEND** (verificado 2026-06-05). Nenhum `@GetMapping` em `AttendanceController`. Frontend partner ja implementou as telas (`attendances.tsx` owner e professional) e o store method `fetchHistory()` — aguardando backend. Response esperado: `AttendanceInQueueResponse[]` ou similar com clientId, clientName, services, totalValue, scheduledTime, startTime, endTime, durationInMinutes. |
| 2 | **`GET /professional/me`** | Retorna dados do profissional logado (id, name, specialty, establishment_id) | O frontend precisa recuperar o establishment_id apos reiniciar o app. Hoje usa SecureStore como fallback, mas o ideal e ter um endpoint |
| 3 | **Precificacao inteligente no ServiceItem** | Adicionar campos `uses_platform_pricing: boolean` e `client_price: number` ao ServiceItem | Hoje o calculo (4% intermediador + 2% plataforma + arredondamento estetico para R$X,90) e feito no frontend. O backend deve ser a fonte da verdade para que o app cliente exiba o preco correto |
| 4 | **Endpoint de relatorios agregados** | `GET /establishment/{id}/reports?period=day\|week\|month` retornando total_attendances, total_revenue, avg_duration, top_professional, top_service | Evita que o frontend faca agregacao client-side de centenas de atendimentos. Melhor performance e consistencia |
| 5 | **Endpoint de historico de receita por profissional** | `GET /professional/{id}/revenue?dateFrom=Y&dateTo=Z` | Para o owner ver quanto cada profissional faturou no periodo e calcular comissoes |
