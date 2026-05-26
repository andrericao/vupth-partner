# VUPTH Front Partner — PRD (Product Requirements Document)

> Documento de comunicacao entre frontend partner e backend.
> Descreve os fluxos implementados, endpoints consumidos, formato dos requests/responses,
> e o que esta pendente no frontend.
>
> **App:** React Native 0.81 + Expo SDK 54, Gluestack UI v1, Expo Router v6
> **State:** Zustand v5 + Axios + Expo SecureStore
> **Testes:** Jest 29 + axios-mock-adapter
>
> **Ultima atualizacao:** 2026-05-26

---

## Indice

1. [Visao Geral dos Fluxos](#1-visao-geral-dos-fluxos)
2. [Endpoints Consumidos — Status](#2-endpoints-consumidos--status)
3. [Fluxo 1 — Owner Solo Shop](#3-fluxo-1--owner-solo-shop)
4. [Fluxo 2 — Professional (novo)](#4-fluxo-2--professional-novo)
5. [Stores Implementados](#5-stores-implementados)
6. [Telas Implementadas](#6-telas-implementadas)
7. [Formato dos Tokens e Refresh](#7-formato-dos-tokens-e-refresh)
8. [Testes E2E — Maestro](#8-testes-e2e--maestro)
9. [Pendente de Implementacao](#9-pendente-de-implementacao)
10. [Duvidas para o Backend](#10-duvidas-para-o-backend)

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
→ Tela de fila/espera
```

---

## 2. Endpoints Consumidos — Status

| Endpoint | Fluxo | Status Frontend | Testes |
|----------|-------|-----------------|--------|
| `POST /auth/register` | Ambos | Implementado | 14 testes |
| `POST /auth/login` | Ambos | Implementado | 14 testes |
| `POST /auth/refresh` | Ambos | Implementado | 14 testes |
| `POST /auth/logout` | Ambos | Implementado | - |
| `POST /establishment/quick-create` | Owner | Implementado | 2 testes |
| `PATCH /establishment/{id}/open-status` | Owner | Implementado | 2 testes |
| `POST /professional/quick-create` | Owner | Implementado | 2 testes |
| `POST /establishment/{id}/service-items` | Owner | Implementado | 1 teste |
| `GET /establishment` | Professional | **PENDENTE** | - |
| `GET /establishment?name=X` | Professional | **PENDENTE** | - |
| `POST /professional/register` | Professional | **PENDENTE** | - |
| `POST /professional/affiliate` | Professional | **PENDENTE** | - |
| `POST /establishment/{id}/professionals` | Owner | **FUTURO** | - |
| `DELETE /establishment/{id}/professionals/{pid}` | Owner | **FUTURO** | - |
| `PATCH /establishment/{id}/owner` | Owner | **FUTURO** | - |
| `POST /professional/me/affiliations` | Professional | **FUTURO** | - |
| `PATCH /affiliations/{id}/accept` | Owner | **FUTURO** | - |

---

## 3. Fluxo 1 — Owner Solo Shop

### Telas
1. **(auth)/index.tsx** — Escolha de papel: "Sou dono" vs "Sou profissional"
2. **(auth)/register.tsx** — Email + senha → `POST /auth/register` → auto-login
3. **(owner)/onboarding/establishment.tsx** — Nome + tipo → `POST /establishment/quick-create`
4. **(owner)/dashboard.tsx** — Badge ABERTO/FECHADO, toggle, adicionar profissional/servico, logout
5. **(owner)/add-professional.tsx** — Nome + especialidade → `POST /professional/quick-create`
6. **(owner)/add-service.tsx** — Tipo + nome + preco → `POST /establishment/{id}/service-items`

### Sequencia de chamadas
```
POST /auth/register { email, password }
POST /auth/login { email, password }
  → armazena tokens no SecureStore
POST /establishment/quick-create { name, serviceType }
  → ganha OWNER
POST /auth/refresh { refreshToken }
  → novo token com ROLE_OWNER
POST /professional/quick-create { name, establishmentId, specialty? }
  → ganha PROFESSIONAL
POST /auth/refresh { refreshToken }
  → novo token com ROLE_PROFESSIONAL
POST /establishment/{id}/service-items { serviceItemType, customName, price }
PATCH /establishment/{id}/open-status { openStatus: "OPEN" }
```

### Regra de negocio
- Owner so pode criar UM perfil profissional (o dele mesmo)
- Service items sao vinculados ao profissional (JWT userId), nao ao establishment
- Owner PRECISA ter perfil profissional para adicionar services

---

## 4. Fluxo 2 — Professional (novo)

### Telas planejadas
1. **(auth)/index.tsx** — Escolha "Sou profissional" (ja existe)
2. **(auth)/register.tsx** — Email + senha (ja existe)
3. **(professional)/onboarding.tsx** — **A IMPLEMENTAR:**
   - Step 1: Nome + especialidade → `POST /professional/register`
   - Step 2: Buscar establishment → `GET /establishment?name=X`
   - Step 3: Selecionar da lista → `POST /professional/affiliate { establishmentId }`
4. **(professional)/queue.tsx** — Tela de fila (placeholder)

### Sequencia de chamadas
```
POST /auth/register { email, password }
POST /auth/login { email, password }
  → armazena tokens no SecureStore
POST /professional/register { name, specialty? }
  → ganha PROFESSIONAL (sem establishment)
POST /auth/refresh { refreshToken }
  → novo token com ROLE_PROFESSIONAL
GET /establishment?name=barbearia
  → lista de establishments
POST /professional/affiliate { establishmentId }
  → profissional vinculado ao establishment
```

### Responses esperados do backend

**POST /professional/register (201):**
```json
{
  "id": "uuid",
  "name": "Joao Silva",
  "specialty": "Corte masculino",
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
  "specialty": "Corte masculino",
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
- `logout()` — POST /auth/logout → limpa SecureStore
- `loadStoredTokens()` — carrega tokens salvos ao abrir app

### establishment.store.ts
- `quickCreate(name, serviceType)` — POST /establishment/quick-create
- `updateOpenStatus(id, status)` — PATCH /establishment/{id}/open-status
- `quickCreateProfessional(name, establishmentId, specialty?)` — POST /professional/quick-create
- `addServiceItem(establishmentId, serviceItemType, customName, price)` — POST /establishment/{id}/service-items
- **PENDENTE:** `searchByName(name)` — GET /establishment?name=X

### professional.store.ts (A CRIAR)
- `register(name, specialty?)` — POST /professional/register
- `affiliate(establishmentId)` — POST /professional/affiliate

---

## 6. Telas Implementadas

```
app/
  _layout.tsx                    — GluestackUIProvider + fontes
  (auth)/
    index.tsx                    — Escolha de papel (Owner vs Professional)
    login.tsx                    — Login conectado ao authStore
    register.tsx                 — Register + auto-login + redirect por role
  (owner)/
    onboarding/
      establishment.tsx          — Quick-create establishment
      address.tsx                — Endereco (visual, sem API)
      services.tsx               — Servicos (visual, sem API)
    dashboard.tsx                — Dashboard principal do owner
    add-professional.tsx         — Criar profissional (quick-create)
    add-service.tsx              — Adicionar servico
  (professional)/
    onboarding.tsx               — PLACEHOLDER → A IMPLEMENTAR
    queue.tsx                    — PLACEHOLDER
```

---

## 7. Formato dos Tokens e Refresh

### Login response
```json
{
  "user": { "id", "email", ... },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "uuid",
    "expires_in": 3600
  }
}
```

### Refresh request
> **DUVIDA:** O campo e `refreshToken` (camelCase) ou `refresh_token` (snake_case)?
> Nosso codigo atual envia `refresh_token` (snake_case).

### Refresh response
> **DUVIDA:** Retorna direto `{ access_token, refresh_token }` ou dentro de `{ tokens: { ... } }`?
> Nosso codigo atual le `data.tokens.access_token`.

### Interceptor Axios
- Request interceptor: adiciona `Authorization: Bearer <access_token>` em todas as requests
- Response interceptor: em 401, tenta refresh automatico e retry da request original
- Refresh no interceptor usa `axios.post` direto (sem interceptor) para evitar loop

---

## 8. Testes E2E — Maestro

### seed_complete.yaml
Cria 4 establishments com 1 profissional cada (owner = profissional):
- Barbearia do Andre (BARBER) — 3 servicos
- Salao Beleza Total (BEAUTY_SALON) — 2 servicos
- Nail Studio Premium (NAIL_SALON) — 2 servicos
- SPA Relaxe Bem (SPA) — 1 servico

### Limitacoes do Maestro
- `inputText` nao suporta Unicode (acentos removidos nos nomes)
- Nao suporta `- wait: N` — usar `assertVisible` que ja tem timeout
- Seletores por `id` (testID) preferidos sobre `text` para evitar ambiguidade

### Pendente no Maestro
- Adicionar fluxo de professional independente (register → buscar establishment → afiliar)
- Testar multiplos profissionais por establishment

---

## 9. Pendente de Implementacao

### Alta prioridade (MVP)
| Item | Descricao | Depende de |
|------|-----------|------------|
| professional.store | register + affiliate | — |
| Busca de establishments | GET /establishment?name=X no establishment.store | — |
| Tela professional onboarding | Nome + especialidade + busca + afiliacao | stores acima |
| Maestro seed multiplos profissionais | 2+ profissionais por establishment | tela acima |
| Corrigir formato refresh token | Verificar camelCase vs snake_case | resposta backend |

### Media prioridade
| Item | Descricao |
|------|-----------|
| Dashboard com polling | TanStack React Query, refresh a cada 30s |
| Tela de fila do profissional | Start/pause/resume/finish attendance |
| React Hook Form + Zod | Validacao nos formularios |
| Variavel de ambiente API | EXPO_PUBLIC_API_ENV para alternar local/dev/prod |

### Baixa prioridade
| Item | Descricao |
|------|-----------|
| Sistema de afiliacao bidirecional | POST /professional/me/affiliations + PATCH /affiliations/{id}/accept |
| Owner gerencia profissionais | POST/DELETE /establishment/{id}/professionals |
| Transferencia de ownership | PATCH /establishment/{id}/owner |
| Paleta PRD | #1B4332, #52B788, #00B37E, #F7FAF8 |
| Fontes DM Sans + DM Mono | — |

---

## 10. Duvidas para o Backend

1. **Formato refresh token request:** `refreshToken` (camelCase) ou `refresh_token` (snake_case)?
2. **Formato refresh token response:** direto `{ access_token, ... }` ou dentro de `{ tokens: { ... } }`?
3. **POST /professional/affiliate requer establishment OPEN?** Ou funciona com establishment CLOSED tambem?
4. **GET /establishment retorna establishments CLOSED?** Ou so ACTIVE + OPEN?
5. **Limite de profissionais por establishment?** Existe restricao no backend?
