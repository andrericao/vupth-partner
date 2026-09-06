# AMBIENTES — o que cada nome significa, e com quem cada app fala

> **Fonte unica** do assunto "ambientes: URLs, variaveis, canais", conforme a Regra 1 do
> [`VUPTH_DOCS.md`](VUPTH_DOCS.md). Os PRDs e handoffs **referenciam** este arquivo; nao
> repetem os valores. Vale para os **dois fronts** (partner e client) e para o backend.
>
> **Criado em 2026-09-06**, a partir da regra do Andre e de tres confusoes que custaram tempo
> (o Expo Go que parou de abrir, o APK de teste que gravava em producao, e o "APK" que as duas
> pessoas usavam para dizer coisas diferentes).

---

## 1. A regra, em uma linha

**`prod` e o Railway. `staging` e o Render. O que se testa e o Render.**

O Render roda a branch `dev` do backend; o Railway roda a `main`. Quem testa — no aparelho ou
no navegador — bate no Render. So o app de producao toca no Railway.

| ambiente | profile Spring | branch do backend | plataforma | URL |
|---|---|---|---|---|
| local | `dev` | — | docker-compose | `http://<IP da maquina>:8080` |
| teste | `staging` | `dev` | Render | `https://vupth-backend-ia.onrender.com` |
| producao | `prod` | `main` | Railway | `https://vupth-backend-ia-production.up.railway.app` |

⚠️ **`staging` e `dev` sao apelidos do MESMO host.** O partner chamou de `staging` o que o
client chamou de `dev`, e o mesmo `.env` circula entre os dois repos — sem o apelido,
`EXPO_PUBLIC_API_ENV=dev` no partner caia no fallback `local` sem avisar.

**Como se verifica:** `src/lib/api.ts`, constante `API_URLS`. Se as URLs acima nao baterem com
as de la, **esta secao esta mentindo — corrija-a**.

---

## 2. Quem decide com qual backend o bundle fala

Nao e so o `.env`. A ordem e:

1. **Se o bundle tem canal** (foi publicado pelo EAS), **o canal decide**.
2. **Sem canal** (rodando local), vale o `EXPO_PUBLIC_API_ENV` do `.env`.
3. Valor desconhecido, ou canal fora da tabela: cai em `local`.

**Por que o canal vem primeiro:** `EXPO_PUBLIC_API_ENV` e embutido no bundle **na hora de
publicar**, a partir do `.env` da maquina de quem publicou. Quem estivesse com `local` no
`.env` — o normal para rodar no computador — publicaria um app apontando para
`http://localhost:8080`, morto em qualquer aparelho e **sem nenhum erro que diga isso**. O
canal, nao: e carimbado pelo EAS no proprio update. Em 22/08/2026 o partner chegou a um
comando de distancia desse acidente.

**Como se verifica:** `src/lib/apiEnv.ts` (`resolveApiEnv`), com
`src/lib/__tests__/apiEnv.test.ts` cobrindo cada canal declarado.

---

## 3. Os tres apps no aparelho — um por papel

O Android identifica app pelo `package`: dois builds com o **mesmo id sao o mesmo app**, e
instalar um **desinstala** o outro. Por isso as variantes de teste levam sufixo, e o id limpo
fica com producao — que e o app de verdade.

| perfil de build | id no aparelho | icone | backend | de onde vem o JS |
|---|---|---|---|---|
| `development` | `com.vupth.partner.dev` | VUPTH dev | **Render** | Metro da maquina (`npx expo start --dev-client`) |
| `preview` | `com.vupth.partner.preview` | VUPTH preview | **Render** | OTA do push na `dev` |
| `prod-apk` | `com.vupth.partner` | vupth parceiros | **Railway** | OTA do push na `main` |
| `production` | `com.vupth.partner` | vupth parceiros | **Railway** | o que vai para a loja (app-bundle) |

- **`prod-apk` existe porque `production` gera app-bundle**, formato de loja que **nao instala
  no aparelho**. Ele estende o `production` — mesmo canal, mesmo backend — so trocando para
  APK com distribuicao interna. **Para a loja, continua valendo o `production`.**
- ⚠️ **`preview` recebe OTA da `dev`, nao da `main`.** Quem quer olhar producao usa o
  `prod-apk`. Confundir os dois foi o que motivou esta tabela.
- Ate 2026-09-06 o canal `preview` apontava para o **Railway**: **teste em device gravava no
  banco de producao**. Corrigido.

**Como se verifica:** `app.config.js` (sufixos) e `eas.json` (perfis), com
`src/lib/__tests__/appVariantes.test.ts` garantindo que os tres ids sao distintos e que nada
mais do `app.json` e alterado.

---

## 4. A web

| deploy | branch | `EXPO_PUBLIC_API_ENV` | backend |
|---|---|---|---|
| Cloudflare **Preview** | `dev` | `staging` | **Render** |
| Cloudflare **Production** | `main` | `prod` | **Railway** |

O link de teste e `https://dev.vupth-partner.pages.dev`.

⚠️ **As variaveis de Preview NAO herdam da Production** — precisam ser declaradas nas duas. E
o **painel nao persiste a branch de producao** (ao salvar o Preview ele reescreve a
Production): mexer **pela API**. `CF_ACCOUNT_ID = 2c23f12069b7f6654ecd6ae81d93f5bb`.

---

## 5. Expo Go nao e mais ambiente de teste

O Expo Go e um app da loja e carrega **so o SDK mais novo** (SDK 57 desde 30/06/2026). Os
projetos estao no **SDK 54**, entao ele parou de abri-los — e como se atualiza sozinho, o
problema voltaria a cada lancamento.

O substituto e o **`expo-dev-client`**: um build do proprio app, com a camada nativa
**congelada no nosso SDK**, que so muda quando **nos** rebuildarmos. O fluxo continua igual,
com uma flag a mais: `npx expo start --dev-client`.

**Quando rebuildar** (mesma fronteira do `runtimeVersion`): bump de SDK, lib nativa nova,
plugin, permissao, icone/splash, package id. **Tela, logica, rota, estilo e troca de branch
nao pedem rebuild.**

Bonus: no dev client o nativo e real, entao **push remoto volta a ser testavel** — o Expo Go
nao entrega push desde o SDK 53.

**Subir de SDK (54 -> 57)** e decisao planejada, nao urgencia: sao tres saltos e o React
Native vai de 0.81.5 a 0.86. O dev client existe justamente para tirar a pressa disso.

---

## 6. Lib nativa entrando = bump de versao

`runtimeVersion` segue a politica `appVersion`. Quando entra lib nativa, a versao sobe, e **os
APKs da versao anterior param de receber OTA** — o que e o comportamento certo (o update nao
casaria com o nativo), mas pega de surpresa quem nao sabe. Cada bump pede **build novo** dos
veiculos que se quer manter vivos.

Registro: `expo-dev-client` entrou em 2026-09-06 e levou o partner de **1.1.0 para 1.2.0**
(`versionCode` 2 -> 3).

---

## 7. Contas de QA

`<perfil>_<dezena>@teste.com` — dominio sempre `@teste.com`; prefixo `client`, `prof` ou
`prop`; numero em **dezenas**, um por bateria de teste.

`prop_10@teste.com`, `prof_10@teste.com` e `client_10@teste.com` sao a **mesma rodada**. A
proxima bateria comeca no **20**. A dezena diz de imediato a que grupo um usuario pertence,
sem consultar nada.

Como o QA vive no **Render**, e la que essas contas existem.

---

## 8. Cold start do Render

O Render Free **hiberna por inatividade**, e o primeiro request depois disso **acorda a
instancia e demora ~50s** (boot da JVM + migrations). Por isso os fronts tem um portao que
cutuca `GET {API}/actuator/health/readiness` (endpoint **publico**) com retry ate `200
{"status":"UP"}` antes de liberar login/cadastro.

Consequencia de o `preview` ter mudado para o Render: **o APK de teste agora ve esse portao**
no primeiro acesso apos ociosidade. **Nao e bug.**

**Como se verifica:** `src/lib/readiness.ts` no partner; especificacao completa no
`PRD_BACKEND.md`, secao "18c. Readiness / cold start".
