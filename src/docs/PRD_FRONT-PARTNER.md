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
6. **(owner)/(tabs)/dashboard.tsx** — Badge de status com 3 estados (ABERTO / FECHADO / FECHADO TEMPORARIAMENTE), polling fila 30s, cards (fila, profissionais com nome/especialidade/fila/disponibilidade). useIsFocused para BackHandler. Se establishment null → botao "Criar Estabelecimento". Controle de status: "Abrir"/"Fechar" + "Fechar Temporariamente" (quando temp, vira "Reabrir"); `updateOpenStatus` envia OPEN/CLOSED/TEMPORARILY_CLOSED. Guard de abertura: bloqueia "Abrir" se nao ha profissional vinculado (alerta com acao "Adicionar Profissional"); validacao completa (profissional com servico) depende do backend — ver pendencia #7
7. **(owner)/(tabs)/menu.tsx** — Menu: Dados Pessoais (→ coming-soon "falta implementar"), **Dados do Estabelecimento (→ submenu establishment-data: Dados Cadastrais + Endereco)**, Relatorios (→ reports). Secao de gestao: Adicionar Profissional (se owner ja e PROFESSIONAL → add-professional info afiliacao; senao → also-professional quick-create), Solicitacoes, Servico, Filas, Atendimentos. Secao inferior: "Sair do Estabelecimento" (amber) e "Sair da Conta" (vermelho)
   - **(owner)/(tabs)/establishment-data.tsx** — submenu "Dados do Estabelecimento": **Dados Cadastrais** (→ establishment-registration) e **Endereco** (→ onboarding/address). Voltar via `router.back()`.
   - **(owner)/(tabs)/establishment-registration.tsx** — "Dados Cadastrais": edita o **nome** do estabelecimento via `updateGeneralInfos` → `PATCH /establishment/{id}/general-infos { name }`. (Futuro: phone/instagram — backend #13 ja tem os campos.)

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
5. **(professional)/queue.tsx** — Gerenciamento de fila: atendimento atual + lista de espera, start/pause/resume/finish/remove, polling 30s, pull-to-refresh, botao "Adicionar Walk-in". Botao "Buscar Estabelecimento" quando nao afiliado
6. **(professional)/add-guest.tsx** — Adicionar cliente walk-in: nome + selecao multipla de servicos + total → `POST /professional-queue/add-quest-attendance`
7. **(professional)/my-services.tsx** — Lista servicos + formulario com filtro por especialidade + pricing preview com absorcao. Guard: se profissional nao tem `establishment_id`, exibe aviso e botao para buscar estabelecimento (bloqueia adicao de servico); nesse estado faz `fetchMe()` no mount e no pull-to-refresh para detectar afiliacao aceita pelo owner (queue.tsx faz o mesmo no mount). Quando afiliado, mostra "Vinculado a {establishment_name}". Usa `POST /professional-queue/{profId}/add-service-items`. **Preco salvo = total pago pelo cliente** (`clientPrice`: digitado + taxas conforme absorcao), nao o valor digitado (decisao 2026-06-12). Lista mostra o tipo de servico humanizado (humanizeServiceType, sem underline). ✅ **Editar/remover servico (2026-06-15):** cada item tem acoes "Editar" (nome+preco inline, dentro de FormControl) via `updateMyServiceItem` → `PATCH /professional-queue/{profId}/service-items/{itemId}` e "Remover" (com confirmacao) via `removeMyServiceItem` → `DELETE ...` (backend #10/#15 concluido)
8. **(professional)/find-establishment.tsx** — Gate no mount via `fetchMe` + `GET /professional/me/affiliations`: se ja afiliado mostra "Voce ja esta vinculado" (link Configuracoes); se tem solicitacao PENDING mostra "Solicitacao em andamento" (so 1 estabelecimento por vez); senao libera a busca. Auto-load `GET /establishment` (lista todos), busca por nome (`GET /establishment?name=X`), solicitar vinculacao (`POST /professional/me/affiliations { establishmentId }`). Nao exige servicos — ordem: afiliar primeiro, servicos depois. Busca por bairro/proximidade ordenada por fila pendente — ver pendencia backend #11
9. **(professional)/profile.tsx** — Menu: Atendimentos, Relatorios, Meus Servicos, Configuracoes, Sair
10. **(professional)/attendances.tsx** — Historico de atendimentos: auto-load no mount, filtros (todos/finalizados/cancelados) → `GET /attendances`, erro real do backend + "tentar novamente"
11. **(professional)/reports.tsx** — Stats do dia (fila, tempo estimado) + finalizados/receita (total) via `GET /attendances?professionalId=X&status=FINISHED`; semana/mes ainda aguardando agregacao por periodo no backend
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
| 8 | Validacao de senha segura (letra, numero, especial, confirmar) | ✅ Implementado (2026-06-13) | `src/lib/passwordValidation.ts` (funcao pura testada): min 8 chars + letra + numero + especial. register.tsx mostra o 1o erro no campo Senha + dica e campo "Confirmar senha" (valida coincidencia) |
| 9 | Politica de Precos: renomear "Taxas Vupth" | ✅ Implementado (2026-06-13) | add-service.tsx e my-services.tsx: "Taxa plataforma" → "Taxas Vupth" e "Quem absorve a taxa" → "Quem absorve as Taxas Vupth" |
| 12 | Teclado cobre formularios | ✅ Corrigido | KeyboardAvoidingView adicionado em todas as 10 telas de formulario |
| 13 | Icone de lupa na aba de pesquisa | ✅ Resolvido (2026-06-15) | find-establishment.tsx usa o `SearchIcon` do gluestack em verde da paleta (#00B37E), monocromatico; com texto vira `CloseIcon` cinza para limpar (substituiu o emoji 🔍 colorido) |
| 14 | Profissionais sem servicos nao devem aparecer para clientes | ✅ Resolvido no BACKEND (2026-06-14, commit d2ea594) | Backend agora filtra: profissional sem servico nao aparece em `GET /establishment/id/{id}/professionals-with-queue` mesmo com a loja aberta. Nada a fazer no front. Ver pendencia backend #7 (status ATIVA, CONCLUIDO) |
| 15 | Pull-to-refresh em telas de dados | ✅ Implementado | RefreshControl em my-services.tsx, dashboard.tsx. queue.tsx ja tinha |

### Alta prioridade (MVP)
| Item | Descricao |
|------|-----------|
| Estado de solicitacao de afiliacao pendente | ✅ Implementado (2026-06-14): find-establishment.tsx bloqueia a lista quando ja afiliado ou com solicitacao PENDING, e no estado pending exibe o botao **"Cancelar solicitacao"** via `DELETE /affiliations/{id}` (store `cancelAffiliation`); apos cancelar, libera a busca. Usa `GET /professional/me/affiliations` (filtrar PENDING, guarda o id). Pendente no backend: validacao de pendencia unica global (PENDING bloquear qualquer outro establishment) |
| Complemento no endereco do establishment | ✅ Implementado (2026-06-14): address.tsx tem campo "Complemento (opcional)" entre Numero e Bairro; addAddress envia `complement` (o backend `AddressRequest` ja aceitava o campo). |
| Editar e-mail e senha do profissional em Configuracoes | ✅ Implementado (2026-06-14): settings.tsx com edicao inline — e-mail via `PATCH /profile/update-email/me` e senha via `PATCH /profile/update-password/me` (auth store `updateEmail`/`updatePassword`; persistem os novos tokens retornados para nao deslogar; senha valida com `validatePassword` + confirmacao). **Atencao:** `/profile/**` exige `hasRole("CLIENT")` no backend — funciona porque as roles sao cumulativas (o profissional tambem e usuario/cliente). ✅ **Editar nome do profissional (2026-06-15):** card "Nome" edita inline via `updateMyProfile` → `PATCH /professional/me { name }` + fetchMe (backend #12 concluido). Abordagem definitiva do campo nome migra para #16 (escrita unica em /profile/general-infos) quando o backend expuser. |
| Refeicoes do profissional (almoco/janta) | ⏳ **Backend-first** — ver pendencia backend #14. Sem seed/iniciar/encerrar/editar/ajustar previsao no backend, o front nao tem o que construir. Quando entregue: editar refeicoes em settings.tsx + botoes iniciar/encerrar na queue.tsx. |
| Editar e remover servicos do profissional | ✅ Implementado (2026-06-15): my-services.tsx tem acoes "Editar" (nome+preco inline) e "Remover" (com confirmacao) por servico, via `updateMyServiceItem`/`removeMyServiceItem` (`PATCH`/`DELETE /professional-queue/{profId}/service-items/{itemId}`). Backend #10/#15 concluido. |
| Busca de estabelecimento por proximidade/bairro ordenada por fila | find-establishment.tsx: (1) primeiro listar por proximidade de GPS do profissional; (2) se sem GPS, buscar por bairro; (3) ordenar o resultado por tempo de espera (menor → maior). Hoje so lista todos + busca por nome. Depende do backend — ver pendencia backend #11 |
| ~~Fila completa (visao do owner)~~ | ✅ Implementado |
| ~~Fila publica por profissional~~ | ✅ Implementado |
| ~~Adicionar client GUEST na fila~~ | ✅ Implementado |
| ~~Historico de atendimentos por role~~ | ✅ Implementado (frontend + backend) |
| Editar nome do estabelecimento (owner) | ✅ Implementado (2026-06-15): submenu Dados do Estabelecimento → Dados Cadastrais edita o nome via `PATCH /establishment/{id}/general-infos { name }` (store `updateGeneralInfos`). |
| Icone de papel no Header (teste) | ✅ Implementado (2026-06-15): `RoleIcon` SVG silhueta monocromatica verde (#00B37E) — predio para owner, busto+chapeu para professional, deduzido do grupo de rota (`useSegments`). Posicao fixa, so muda o desenho. |
| Testar manualmente no celular | Validar todos os fluxos (owner e professional) com backend local via Expo Go |
| Rodar Maestro seed_complete.yaml | Seed E2E: 4 establishments + profissionais + servicos |

### Media prioridade
| Item | Descricao |
|------|-----------|
| Completar dados do establishment | Frontend pronto (address.tsx conectado + addAddress no store). Backend `POST /establishments/{id}/addresses` implementado |
| React Hook Form + Zod | Validacao nos formularios |
| ~~Tratar TEMPORARILY_CLOSED~~ | ✅ Implementado (2026-06-13): 3 estados no dashboard (Abrir/Fechar + Fechar Temporariamente/Reabrir) |
| Paleta PRD | **COM O DESIGN** (decisao 2026-06-13): so ha 4 cores-ancora (#1B4332, #52B788, #00B37E, #F7FAF8); a escala completa (green/neutros) e decisao de design. Aplicar no tema (config/gluestack-ui.config.ts, escala `green`) quando o design entregar |
| Fontes DM Sans + DM Mono | **COM O DESIGN** (decisao 2026-06-13) |
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
| 3 | **Precificacao inteligente no ServiceItem** | Adicionar campos `uses_platform_pricing: boolean` e `client_price: number` ao ServiceItem | ✅ **CAMPOS EXISTEM NO BACKEND (dev, verificado 2026-06-15):** `ServiceItem` (model) + `ServiceItemRequest`/`UpdateServiceItemRequest`/`ServiceItemResponse` ja tem `clientPrice` e `usesPlatformPricing` (JSON `client_price`/`uses_platform_pricing`). ⚠️ Confirmar se o **calculo** (4% + 2% + arredondamento R$X,90) ja roda no backend como fonte da verdade, e se esta deployado no staging. Hoje o front ainda calcula (lib/pricing) e salva `price` = total do cliente. |
| 4 | **Endpoint de relatorios agregados** | `GET /establishment/{id}/reports?period=day\|week\|month` | ✅ **EXISTE NO BACKEND (dev, verificado 2026-06-15):** `GET /establishment/{id}/reports?dateFrom=&dateTo=` (ROLE_OWNER) e `GET /professional/me/reports?dateFrom=&dateTo=` (ROLE_PROFESSIONAL). ⚠️ Confirmar deploy no staging e ligar nas telas de relatorio (hoje o front agrega client-side via GET /attendances). |
| 5 | **Endpoint de historico de receita por profissional** | `GET /professional/{id}/revenue?dateFrom=Y&dateTo=Z` | Para o owner ver quanto cada profissional faturou no periodo e calcular comissoes |
| 6 | **Busca de profissionais** | `GET /professional?name=X&specialty=Y` — listar profissionais por nome e/ou especialidade. | ✅ **EXISTE NO BACKEND (dev, verificado 2026-06-15):** `GET /professional?name=&specialty=` (ProfessionalQuickCreateController, retorna `ProfessionalSearchResponse[]`). ⚠️ Confirmar deploy no staging. Falta so o **FRONT**: tela de busca de profissionais para o owner convidar via `POST /establishment/{id}/affiliations { professionalId }`. **Roadmap backend: #32 — endpoint pronto.** |
| 7 | **Status ATIVA do estabelecimento** | ✅ **BACKEND CONCLUIDO (entrega 2026-06-14, branch dev / commit d2ea594).** Abrir (`open_status=OPEN`) agora EXIGE >=1 profissional com >=1 servico, senao `422 { code: "ESTABLISHMENT_NOT_READY" }` (CLOSED/TEMPORARILY_CLOSED sem restricao). Profissional SEM servico nao aparece mais em `GET /establishment/id/{id}/professionals-with-queue` mesmo com loja aberta (resolve tambem o bug #14 e a pendencia de "prof sem servico nao aparece p/ clientes"). | **Acao no front-partner:** remover o bloqueio PARCIAL de abertura no dashboard (hoje so checa `professionals.length === 0`) e **confiar no 422** — o codigo `ESTABLISHMENT_NOT_READY` ja esta mapeado em `ERROR_MESSAGES_PT` (api.ts). Recomendado manter, no tratamento desse 422, a acao "Adicionar Profissional". **Roadmap backend: #31 — CONCLUIDO.** |
| 8 | **Cancelamento e pendencia unica de afiliacao** | (a) ✅ **Endpoint JA EXISTE**: `DELETE /affiliations/{id}` cancela a solicitacao PENDING (iniciador, status→CANCELLED) — confirmado no PRD backend 2026-06-13. **Falta so o FRONT** (botao "Cancelar solicitacao" em find-establishment). (b) Ainda pendente no backend: validar pendencia unica global (profissional com PENDING nao pode solicitar a nenhum outro establishment; hoje o 409 so cobre o mesmo) | Regra de produto (2026-06-12). **Roadmap backend: #29 — endpoint de cancel pronto; falta validacao global de PENDING** |
| 9 | **Owner desafiliar profissional** | ✅ Implementado (2026-06-14): tela professional-queue do owner tem botao **"Desvincular Profissional"** (confirmacao → `DELETE /establishment/{id}/professionals/{professionalId}`, store `removeProfessional`); ao concluir volta ao dashboard. Erro tratado com getApiErrorMessage (ex: atendimento ativo). Obs: a validacao de bloquear com atendimento ativo / tratar a fila pode ainda nao estar no backend (#30) | Regra de produto (2026-06-12): desafiliacao dos dois lados; o lado do profissional ja existe (`DELETE /professional/me/establishment`). **Roadmap backend: #30 — endpoint pronto; validacao de atendimento ativo/fila pode estar pendente** |
| 10 | **Editar e remover ServiceItem do profissional** | Endpoints para o profissional editar e remover seus servicos: ex. `PATCH /professional-queue/{profId}/service-items/{itemId}` (nome, preco) e `DELETE /professional-queue/{profId}/service-items/{itemId}`. Hoje so existe o POST de adicionar | Pedido do usuario (2026-06-12): my-services.tsx precisa permitir editar e remover servicos, nao so adicionar. **Roadmap backend: #15 (MEDIA PRIORIDADE / v2; consolidado com edicao/delecao no establishment — PUT/DELETE /establishment/{id}/service-items/{itemId} e PATCH/DELETE /professional-queue/{profId}/service-items/{itemId})** |
| 11 | **Busca de estabelecimento por bairro (PRIORIDADE) e por proximidade, ordenada por fila** | **Fazer primeiro a busca por bairro** (decisao 2026-06-13): `GET /establishment?neighborhood=X` — depende de cadastrar e expor o bairro no endereco do establishment; o response deve incluir tempo de espera agregado por establishment para ordenar (menor → maior). Depois (fase 2): busca por proximidade de GPS `GET /establishment?lat=X&lng=Y&radiusKm=Z` ordenando do mais perto, exigindo captura de localizacao no app | Pedido do usuario: fluxo de busca deve priorizar bairro primeiro; GPS vem depois; resultado sempre ordenado pela menor fila. Hoje o front so faz `GET /establishment` (todos) e `GET /establishment?name=X`. Bloqueado: o EstablishmentResponse atual nao traz bairro nem tempo de espera agregado. **Roadmap backend: #2.** 🟡 **PARCIAL (entrega 2026-06-14, branch dev / commit d2ea594):** ja existe `GET /establishment?neighborhood=X` (LIKE parcial, case-insensitive; so lojas com endereco no bairro) e a combinacao `?serviceType=BARBER&neighborhood=X`. Precedencia: name > (serviceType+neighborhood) > neighborhood > serviceType > todos; ordenacao atual `createdAt DESC`. ⚠️ **AINDA falta:** o response NAO traz bairro nem tempo de espera agregado, e NAO ordena por menor fila. **Decisao 2026-06-14: o front-partner NAO precisa de busca por bairro** — o find-establishment do partner e busca de afiliacao (profissional procurando loja), onde bairro nao agrega. A busca por bairro ordenada por fila e exclusiva do **front-client** (ver 11.1 / C1). (O filtro chegou a ser implementado no partner e foi revertido.) |
| 12 | **Editar nome e especialidade do profissional** | `PATCH /professional/me { name?, specialty? }` (name→firstName, ambos opcionais). | ✅ **EXISTE NO BACKEND (dev, verificado 2026-06-15)** — `PATCH /professional/me` (ProfessionalQuickCreateController, ROLE_PROFESSIONAL). ✅ **FRONT (2026-06-15):** settings.tsx edita o nome via `updateMyProfile` → `PATCH /professional/me`. ⚠️ Confirmar deploy no staging. **Obs:** para o campo NOME, a abordagem definitiva e o #16 (escrita unica em `/profile/general-infos`); este #12 fica para `specialty`. |
| 13 | **Telefone e Instagram do establishment** | Campos `phone` e `instagram` (opcionais) no Establishment + no `PATCH /establishment/{id}/general-infos` e no response. | ✅ **EXISTE NO BACKEND (dev, verificado 2026-06-15):** `EstablishmentGeneralInfosRequest`/`Response` ja tem `phone` e `instagram`. ⚠️ Confirmar deploy no staging. Falta so o **FRONT**: expor os campos em "Dados Cadastrais" do owner (tela `establishment-registration.tsx`, hoje so edita o nome) e idealmente na busca publica (front-client). |
| 14 | **Refeicoes/intervalos do profissional (almoco e janta) + horario de funcionamento** | ✅ **BACKEND COMPLETO (handoff 2026-06-16).** Entregue: seed almoco+janta na criacao do profissional; `PATCH .../intervals/{id}` (editar horario/duracao/descricao); `PATCH .../intervals/{id}/start` (iniciar manual) e `/finish` (encerrar manual); `DELETE .../intervals/{id}`; encerrar-ao-atender automatico; estimativa recorrente-aware; horario de funcionamento (`opening_time`/`closing_time` em general-infos) + gate `422 ESTABLISHMENT_HOURS_REQUIRED` ao abrir + janela das refeicoes (`400 INTERVAL_INVALID_TIME`). Contrato real e plano do front na **secao 11.2** (reescrita 2026-06-16). | **Acao FRONT (integrar contra staging, sem esperar main):** (A) tela de horario de funcionamento + tratar 422 ao abrir; (B) editar refeicoes em settings (PATCH/DELETE/recreate); (C) iniciar/encerrar na fila + popup "iniciar almoco / nao almocar". Itens #37 (lock), #38 (encaixe), #39 (multa) sao pos-MVP/spec — nao implementar agora. |
| 15 | **Tempo real via WebSocket (STOMP)** — substituir polling 30s | ✅ **BACKEND CONCLUIDO (entrega 2026-06-14, branch dev / commit 9bf858f).** Handshake `GET /ws` (publico; nativo p/ mobile + SockJS p/ web). Auth opcional no frame CONNECT: header `Authorization: Bearer <access_token>` (com token = sessao autenticada p/ notificacoes pessoais; sem = anonimo, so topicos publicos). **SUBSCRIBE:** `/topic/establishment/{id}/queue` (publico — snapshot COMPLETO da fila, identico ao `GET .../professionals-with-queue`, reenviado a cada mudanca) e `/user/queue/notifications` (autenticado — notificacao pessoal). Backend faz broadcast da fila em create/cancel/leave-queue/start/finish/pause/resume. Notificacao pessoal: start → `{type:"ATTENDANCE_STARTED"}`, finish → `{type:"ATTENDANCE_FINISHED"}`; payload `{ type, attendanceId, establishmentId, message, timestamp }`. Broker em memoria no MVP (contrato nao muda ao escalar). Contrato completo: PRD_BACKEND secao 18b. | **Acao no front-partner:** instalar `@stomp/stompjs` (+ `sockjs-client` opcional p/ web); criar hook de subscription que substitui o `useQueuePolling`/`useProfessionalQueue` (`refetchInterval: 30000`) usados em dashboard.tsx, queues.tsx, queue.tsx, reports.tsx — atualizar o cache do react-query com o snapshot recebido em `/topic/establishment/{id}/queue`. Manter fallback de refetch caso o socket caia. **Roadmap backend: #1 — CONCLUIDO.** ✅ **FRONT CONCLUIDO (2026-06-15):** `useQueueSocket` assina o topico publico; polling vira fallback. Fix de RN: `appendMissingNULLonIncoming`+`forceBinaryWSFrames` (o WebSocket nativo do RN corta o NULL terminador do frame STOMP). WS_URL = `/ws/websocket` (transporte raw do SockJS). |
| 16 | **Nome, sobrenome e apelido do usuario (identidade compartilhada) — spec** | O usuario quer editar **nome (first_name), sobrenome (last_name) e apelido (nickname)** do profissional e do dono. Estado atual do backend (verificado 2026-06-15): `BaseUser` tem `firstName`+`lastName` mas **NAO tem `nickname`**; o unico PATCH e `/profile/general-infos` (ja recebe `first_name`/`last_name`); **nao existe GET que retorne o nome do usuario** (`UserRegisterResponse` so traz id/email/roles; `GET /professional/me` so projeta `firstName`). **Delta proposto:** (a) adicionar coluna `nickname` (varchar ~50, opcional) em `BaseUser`; (b) adicionar `nickname` ao `UserProfileGeneralInfosRequest`/`Response` — **`PATCH /profile/general-infos` vira o UNICO ponto de escrita** de nome/sobrenome/apelido; (c) **projetar `first_name`+`last_name`+`nickname` nos GETs de papel para exibicao**: `GET /professional/me` e o info do dono (`GET /establishment/mine` ou um `GET /profile/me`); (d, recomendado) `GET /profile/me` retornando first/last/nickname como fonte canonica para **pre-preencher** os formularios. | **Boas praticas (discutido 2026-06-15):** nome/sobrenome/apelido sao **identidade do usuario** (compartilhada entre roles cumulativas owner/professional/client), nao dados do "professional". Logo: **1 unico caminho de ESCRITA** (`/profile/general-infos`) — hoje editar nome via `PATCH /professional/me` (#12) cria fonte de verdade dividida com o mesmo `firstName`; **consolidar a escrita** e deixar #12 so para `specialty`. **LEITURA pode ser projetada por papel** (cada GET devolve o que a tela mostra) — exatamente a ideia do usuario. **Plano do front (quando entregar):** editor unico Nome/Sobrenome/Apelido → `PATCH /profile/general-infos` no settings do profissional e numa tela "Dados Pessoais" do dono; pre-preencher com `GET /profile/me` (ou GET de papel); exibir os 3 campos. **Substitui** a abordagem de #12 para o campo nome. |

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
- **Fase C — Fila (queue.tsx):** botoes "iniciar almoco/janta" (`PATCH .../start`) e "encerrar" (`PATCH .../finish`); popup de nudge no horario previsto (Iniciar / Nao almocar) — depende de fechar a duvida do "Nao almocar".
- Tests-first em toda logica de store/parse (ex.: parser do `fixedStartTime` com segundos opcionais).

### 11.1 Pendencias que pertencem ao FRONT-CLIENT (registradas aqui pelo front-partner)

> Itens descobertos no front-partner mas cujo **frontend pertence ao app cliente** (repo `vupth/`, fora do escopo de edicao deste projeto). Registrados aqui para alinhamento: quando o usuario precisar, ele manda o front-client ler estas pendencias e implementar.

| # | Item | Descricao | Justificativa |
|---|------|-----------|---------------|
| C1 | **Busca de estabelecimento por bairro ordenada por menor fila** | A busca em que o **cliente** escolhe a barbearia pelo bairro (e depois por GPS, fase 2) **ordenada pela menor fila** e uma feature do **app cliente**, nao do partner. O partner so tem busca de afiliacao (profissional procura establishment para se vincular, sem ordenacao por fila). Depende do mesmo endpoint backend #2 (`GET /establishment?neighborhood=X` + tempo de espera agregado + ordenacao). | Esclarecimento do usuario (2026-06-14): o #2 (bairro/menor fila) e do front-client. Implementar no repo `vupth/` quando o backend #2 entregar. |
| C2 | **Atualizar o Gluestack no front-client** | Assim como foi feito no front-partner (2026-06-14: `@gluestack-ui/themed` 1.1.54 → 1.1.73, ultima da linha v1), o app cliente (`vupth/`) deve atualizar o Gluestack para a ultima v1 e, depois, avaliar a migracao v1 → v2 (refactor grande, base nativewind). Manter as duas bases alinhadas na mesma versao. **Atencao:** o bump 1.1.73 passa a puxar `@gluestack-ui/tooltip → react-aria → react-dom`; foi preciso adicionar `react-dom` (mesma versao do React, ex.: 19.1.0) so para o Metro resolver o import, e reiniciar o bundler com cache limpo (`expo start -c`). | Pedido do usuario (2026-06-14). O front-client esta atras no `package.json` (ex.: `@gluestack-ui/themed` ^1.1.34, `@gluestack-ui/config` ^1.1.19). Implementar no repo `vupth/` quando o usuario autorizar. |
| C3 | **Tempo real via WebSocket (STOMP) — fila + notificacoes pessoais** | O backend entregou o tempo real (2026-06-14, commit 9bf858f; contrato em PRD_BACKEND secao 18b). O **front-client** deve: **(1)** instalar `@stomp/stompjs`; **(2)** derivar a URL do socket do BASE_URL (`http→ws`, `https→wss`, sufixo `/ws`); **(3)** conectar com `connectHeaders: { Authorization: "Bearer <access_token>" }` no frame CONNECT (necessario para receber notificacoes pessoais; sem token recebe so topicos publicos); **(4)** SUBSCRIBE `/topic/establishment/{id}/queue` — snapshot COMPLETO da fila (igual ao `GET /establishment/id/{id}/professionals-with-queue`), reenviado a cada mudanca → usar para atualizar a tela de fila do cliente em tempo real e **substituir o polling**, mantendo um refetch como fallback; **(5)** SUBSCRIBE `/user/queue/notifications` (autenticado) — notificacao pessoal do cliente: `ATTENDANCE_STARTED` (mensagem "E a sua vez! ...") e `ATTENDANCE_FINISHED` ("Seu atendimento foi concluido."). Payload: `{ type, attendanceId, establishmentId, message, timestamp }`. Exibir como alerta/toast in-app no minimo; push real (app em background) depende do backend #3 (device token) — fora deste escopo. **Modelo de referencia:** o front-partner ja implementou o lado do `/topic/.../queue` em `src/hooks/useQueueSocket.ts` (embutido em `useQueuePolling`/`useProfessionalQueue`); o client pode espelhar o mesmo padrao e adicionar a subscription de `/user/queue/notifications`. | Backend concluido (roadmap #1). O cliente e o maior beneficiario das notificacoes pessoais ("e a sua vez"). Implementar no repo `vupth/` quando o usuario autorizar. |
| C4 | **Nao exibir profissional sem servico** | O backend (2026-06-14, commit d2ea594, #31) ja filtra profissionais sem servico em `GET /establishment/id/{id}/professionals-with-queue` e so abre a loja com >=1 profissional com >=1 servico. **Acao do client:** majoritariamente automatico (o backend nao retorna esses profissionais); apenas garantir que a UI nao assume profissionais "fantasma" e que listas vazias sao tratadas. | Backend concluido (#31). So validar no front-client. |

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

## 13. Proposta de Redesign (avaliacao 2026-06-17) — branch `new-design`, NAO implementar agora

> Mockups recebidos da equipe de design (13 PNGs do app cliente + parceiro). **Decisao: nao implementar agora; quando for, em branch `new-design`.** Avaliacao de usabilidade feita com pesquisa (NN/g, Material, Apple HIG, Journal of Service Research 2025). Falta avaliar um **PDF** que nao foi anexado (so vieram as imagens) — pedir o caminho do arquivo.

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
