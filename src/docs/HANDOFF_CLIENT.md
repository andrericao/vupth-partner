# Handoff Front-Partner → Front-Client

Itens descobertos no front-partner mas cujo **frontend pertence ao app cliente** (repo `vupth/`, fora do escopo de edicao deste projeto). Registrados aqui para alinhamento: quando o usuario precisar, ele manda o front-client ler estas pendencias e implementar.

Ultima atualizacao: 2026-09-06 · branch `dev` do front-partner.

> 🔧 **NOVO (2026-09-06): C27 — o Expo Go saiu de cena, e o APK de teste pode estar gravando em PRODUCAO.** Duas coisas para o client conferir **hoje**: (1) o Expo Go carrega **so o SDK mais novo** (57) e os projetos estao no **54**, entao ele parou de abrir — o substituto e o `expo-dev-client`; (2) no partner, o canal `preview` apontava para o **Railway**, ou seja, **teste em device gravava no banco de producao** — vale checar se o repo de voces tem o mesmo mapeamento. Ficha completa na secao **"Detalhe — C27"** no fim deste documento. Fonte unica do assunto: [`AMBIENTES.md`](AMBIENTES.md).

> 🎨 **NOVO (2026-08-18): C25 — identidade visual nova (marca Vupth).** Paleta `brandGreen #9FE870` + `forest #163300`, **Archivo** no lugar da Poppins e **DMMono** para numeros. **Isso SUPERA a paleta do C7** (a "Verde Marca" `#3b7a3f`), que segue valida so durante a transicao. ⚠️ **Mea-culpa de processo:** a identidade foi aplicada em **55 arquivos de codigo e ZERO documentos**, numa branch nao mergeada — o client so descobriu porque o Andre mandou procurar. O que esperavamos deles estava escrito **dentro de um comentario de codigo**. Ficha completa na secao **"Detalhe — C25"** no fim deste documento.

> 🎨 **NOVO (2026-08-01): C15 — padroes de estilizacao (NativeWind).** O partner esta **saindo do Gluestack** e passou a estilizar com **NativeWind/Tailwind (`className`)**. A cartilha completa (paleta, primitivas, convencoes e as armadilhas que ja custaram retrabalho aqui) esta na secao **"Detalhe — C15"** no fim deste documento. **Isso SUPERA o C2** (que mandava atualizar o Gluestack v1). ⚠️ O **C7 estava desatualizado** e foi corrigido na mesma data: ele documentava a paleta **teal antiga** (`#00B37E`), abandonada em 2026-07-09 — se o client copiou aqueles hexes, esta com o verde errado.

> ⚠️ **NUMERO DELES ENVELHECE — NOME NAO (registrado em 2026-08-11, apontado pelo backend).** Este documento cita, em varios pontos, itens do backlog do backend como **"#13 deles"**, **"#2"**, **"#31"** etc. **Esses numeros sao RENUMERADOS** a cada reorganizacao do PRD_BACKEND, entao um "#13" escrito aqui em julho pode apontar p/ outra coisa hoje. **Regra:** ao ler, tratar o **PRD_BACKEND como a fonte** do numero e usar o **NOME do item** p/ casar (foi a convencao acordada na reconciliacao de 2026-07-22). Ao escrever daqui p/ frente: **citar por NOME**, com o numero no maximo como pista datada. *(O mesmo vale ao contrario: os nossos **S**/**C** sao estaveis — nunca renumeramos —, entao podem nos citar por numero com seguranca.)*

> **Fonte unica dos handoffs partner → client.** Nao espalhar pelo corpo do PRD.
>
> ⛔ **C21 e INTENCAO, nao pedido (Andre, 2026-08-05):** o modo *fila vs agenda pura* por profissional ficou na lista de **"possiveis implementacoes"** do PRD do partner — **nao e para comecar**. Fica registrado so para a tela da loja **nao ser desenhada assumindo que todo profissional tem fila**.
>
> ✅ **O C20 (hibrido no fim da fila), ao contrario, e TRABALHO REAL** — o Andre promoveu ao backlog do partner no fim do dia (item 4 de la: exibir os agendados na cauda da fila). O backend **ja entregou tudo** (S2/INTENTION completo), entao **o gargalo e a UI daqui** — segue sendo a peca que falta p/ o modelo hibrido existir de ponta a ponta.

---

| # | Item | Descricao | Justificativa / status |
|---|------|-----------|------------------------|
| C1 | **Busca de estabelecimento por bairro ordenada por menor fila** | A busca em que o **cliente** escolhe a barbearia pelo bairro (e depois por GPS, fase 2) **ordenada pela menor fila** e feature do **app cliente**, nao do partner (o partner so tem busca de afiliacao, sem ordenacao por fila). Depende do backend #2 (`GET /establishment?neighborhood=X` + tempo de espera agregado + ordenacao). | Esclarecimento do usuario (2026-06-14). Implementar no `vupth/` quando o backend #2 entregar. |
| C2 | ~~**Atualizar o Gluestack no front-client**~~ | ⚠️ **SUPERADO pelo C15 (2026-08-01).** O plano era acompanhar o partner no `@gluestack-ui/themed` 1.1.73 (ultima v1) e depois avaliar v1→v2. **O partner nao foi por ai:** a "v2" do Gluestack **e** NativeWind, entao a migracao virou **sair do Gluestack** em vez de subir de versao. Se o client ainda esta no `^1.1.34` e funcionando, **nao gaste esforco atualizando o v1** — vai direto para o C15. *(Historico: 1.1.73 puxa `@gluestack-ui/tooltip → react-aria → react-dom`, exigindo `react-dom` na versao do React + `expo start -c`.)* | Pedido do usuario (2026-06-14), **encerrado em 2026-08-01**. |
| C3 | **Tempo real via WebSocket (STOMP) — fila + notificacoes pessoais** | Backend entregou o tempo real (contrato PRD_BACKEND 18b). Client deve: (1) `@stomp/stompjs`; (2) URL do socket a partir do BASE_URL (`http→ws`/`https→wss`, sufixo `/ws`); (3) `connectHeaders: { Authorization: "Bearer <token>" }`; (4) SUBSCRIBE `/topic/establishment/{id}/queue` (snapshot completo, substitui polling, mantem refetch fallback); (5) SUBSCRIBE `/user/queue/notifications` (`ATTENDANCE_STARTED`/`ATTENDANCE_FINISHED`). **Modelo:** o partner ja fez `/topic/.../queue` em `src/hooks/useQueueSocket.ts` — o client espelha + adiciona `/user/queue/notifications`. | Backend concluido. Implementar no `vupth/` quando autorizado. |
| C4 | **Nao exibir profissional sem servico** | Backend (#31) ja filtra profissionais sem servico em `GET .../professionals-with-queue` e so abre a loja com >=1 profissional com >=1 servico. **Acao client:** garantir que a UI nao assume profissionais "fantasma" e trata lista vazia. | Backend concluido. So validar no client. |
| C5 | **Encaixe — cliente pede atendimento antecipado (cliente→profissional)** | O **cliente pede ao profissional** para ser atendido antes; o **profissional decide**. Backend tem `PATCH /attendances/{id}/fit-in?aheadCount=N` (+ `/undo-fit`), endpoint do **PROFESSIONAL** → fluxo: cliente solicita (client) → pro aprova → app chama `/fit-in`. **A definir:** se a aprovacao do pro entra no partner (provavel pequena peca) ou o backend cria "pedido de encaixe" que o pro confirma. Distinto da troca entre clientes (C6). | Backend (fit-in) pronto. UI do pedido no `vupth/`; confirmar o lado da aprovacao. |
| C6 | **Agendamento (INTENÇÃO) — UI do cliente** | Lado client do backend **S2**. UI = **barra de encaixe** (particao; = **C12**). O cliente cria uma INTENÇÃO (`/attendances/intentions`, create/edit/cancel ja prontos no backend) para um horario que a fila **ainda nao alcancou** ("hoje mais tarde"/"outro dia"); o backend **promove** quando o **fim da fila cruza o horario**. Profissional **nao participa**. **⚠️ CORRIGIDO 2026-07-15 (alinhado c/ PRD-Client):** "adiantar/atrasar" **NAO** e agendamento — e a **TROCA na fila viva** (`/swap-offers`, ver **C13**). O C6 antigo misturava as duas (e tambem dizia "promove ≤15min" — hoje e "quando o fim da fila cruza o horario"). | Depende do backend **S2** (promocao + expor `projectedQueueEnd`/`closing_time`/blocos ocupados). = C12. |
| C14 | **Atendimento EM ANDAMENTO nao aparece pro cliente (so quando finaliza)** | 🐛 **Observado no device (Andre 2026-07-24):** o profissional INICIOU o atendimento (`PATCH /attendances/{id}/start` → IN_PROGRESS) e viu tudo certo no app dele, mas na tela do CLIENTE **nada mudou enquanto corria** — o card "voce esta sendo atendido agora" nao apareceu. So **ao FINALIZAR** o cliente viu o card de corte concluido. Ou seja: o cliente pula direto de "na fila" para "concluido", sem passar por "em atendimento". **Provavel raiz:** lado client do **C3** (tempo real via WS ainda nao implementado no client → depende de polling; a transicao SCHEDULED→IN_PROGRESS nao esta sendo refletida, so o estado terminal). **Acao client:** (a) renderizar o estado **IN_PROGRESS** do proprio atendimento ("sendo atendido agora"/cronometro) no "meu atendimento"; (b) refletir a transicao via **`ATTENDANCE_STARTED`** (`/user/queue/notifications`, C3) ou pelo refetch do proprio status. **Verificar no backend:** que o read-model do cliente (`GET /attendances/client/me` / client-queue) expoe o `IN_PROGRESS` e que `ATTENDANCE_STARTED` e emitido ao cliente no start (o `ATTENDANCE_FINISHED` claramente chega — o concluido aparece). **Partner: OK** (mostra IN_PROGRESS corretamente — nada a fazer do nosso lado). | Bug cross-project. Lado client do C3 + conferir emissao/read-model no backend. |
| C13 | **Troca de posicao (Adiantar/Atrasar) na fila viva** | 🆕 Modelo fechado no PRD-Client (2026-07-15). Troca **1-por-1 bidirecional** via **`/swap-offers`** (backend NOVO): adiantar publica oferta p/ quem esta **a frente**; atrasar p/ quem esta **atras**; o solicitante pode estar **fora da fila** (entra na vaga de quem aceita; quem aceita vai pro fim); expira **so quando e atendido**; **nunca multa**. **Feature do CLIENTE** — o **partner so REFLETE** a fila pos-troca (nenhuma acao no partner; **nao marca LATE**). **Nao confundir** com C6 (agendamento/INTENÇÃO) nem com o partner **S4** (promover ao topo = acao do profissional). | Client implementa a UI ("Trocar" + dot). **Partner: passivo** (ja reflete via `professionals-with-queue`/WS). Backend: `POST/GET/PATCH-accept/DELETE /swap-offers`. |
| C7 | **Alinhamento de design "Verde Imersivo" com o front-partner** | Aplicar no client a mesma linguagem (2026-06-26). ⚠️ **HEXES CORRIGIDOS EM 2026-08-01 — a versao anterior desta linha estava STALE:** ela listava a paleta **teal** (`400 #52B788 / 500 #00B37E / 600 #009E6F / 700 #1B4332`), **abandonada em 2026-07-09** quando o partner re-ancorou tudo na **"Verde Marca"** — que veio do proprio front-client (o client e a fonte da verdade da MARCA). **Escala valida:** 50 `#eef5ee` · 100 `#d9ead9` · 200 `#b5d5b6` · 300 `#8bbd8d` · 400 `#5c9c60` · **500 `#3b7a3f`** · 600 `#316635` · 700 `#26522a` · 800 `#1c3d1f` · 900 `#142c17`. Sombra dos cards `#1A281A`. Tokens (`gluestack-ui.config.ts`): off-white **#F7FAF8**; amber #FFB703; red #E63946; **Poppins** (titulos/botoes) + **Inter** (texto). **Se o client copiou os hexes antigos, esta com o verde errado.** Componentes 1:1: `cardShadow` (cards $2xl sem borda); **Button** pilula+sombra; **Input** raio $xl, foco verde; **Skeleton** no lugar dos Spinner; **Tab bar** `TabBarIcon` (outline/preenchido, sem pilula). Fonte da verdade: PRD partner secao 13.1 (Guia de Design). Refs no repo partner: `design/redesign-form-tabbar-skeleton.html`, `src/components/{Button,Input,Skeleton,TabBarIcon}.tsx`, `src/lib/styles.ts`. | Pedido do usuario (2026-06-26). Facilita se atualizar o Gluestack antes (C2). ✅ O client ja registrou este alinhamento (PRD-Client "Verde Imersivo, handoff C7"). |
| C8 | **Cliente adiciona MAIS servico ja estando na fila** | 🆕 Pedido do usuario (2026-07-04). O cliente que **ja esta na fila** de um profissional pode **acrescentar servico(s)** ao seu atendimento (ex.: entrou so p/ corte, decide somar barba). Recalcula tempo estimado + total e reflete na fila (o profissional ve o atendimento atualizado). **UI = app cliente** (tela do "meu atendimento na fila" ganha "adicionar servico" a partir do catalogo do profissional). **Depende de backend:** endpoint p/ acrescentar service items a um attendance existente (ex.: `PATCH /attendances/{id}/service-items` add) que recalcula duracao/total — **ver HANDOFF_BACKEND S6**. | Feature nova. Implementar no `vupth/` quando o backend expuser o add-service ao attendance em fila. |
| C9 | **Refletir REMOCAO da fila no app cliente** | 🐛 Observado (2026-07-04): o profissional **removeu** o cliente da fila (`DELETE /professional-queue/{id}/remove`), mas o **app cliente continua mostrando "voce esta na fila"**. O client precisa **detectar a remocao/cancelamento** e sair do estado "em fila" — via refetch do proprio status ou evento WS `/user/queue/notifications` (`ATTENDANCE_CANCELLED`/removido). Liga ao **C3** (tempo real ainda nao implementado no client → hoje mostra estado velho/cacheado). **Backend:** ✅ **resolvido 2026-07-09** (a remocao ja some do read do cliente + emite o evento). | Bug cross-project. **Backend resolvido** — falta so o `vupth/` **refletir** (refetch/WS). |
| C10 | **Mensagens distintas: cliente cancelou vs profissional removeu vs pedido recusado** | 🆕 Pedido do usuario (2026-07-14). Lado client do **HANDOFF_BACKEND S10**: quando o backend expuser os status distintos, o app cliente deve mostrar mensagem **diferente** para cada saida da fila: **CANCELLED** = "voce cancelou seu atendimento"; **REMOVED** (REMOVIDO) = "o estabelecimento removeu voce da fila"; **REFUSED/RECUSADO** (se virar status proprio) = "seu pedido de corte fora do horario foi recusado". Extensao natural do C9 (que ja precisa sair do estado "em fila"). | Depende do backend **S10** (novo enum). Implementar no `vupth/` quando entregar. |
| C11 | **Tempo de espera exibido = ETA com buffer de −10min (regra global)** | 🆕 Pedido do usuario (2026-07-14). Lado client do **HANDOFF_BACKEND S11**: o tempo de espera mostrado ao cliente ja vem do backend **com −10min** (para o cliente chegar antes). O client so **exibe** o valor do read-model — **nao** subtrair nada por conta (senao client e partner divergem). | Depende do backend **S11**. So garantir que o client usa o campo de espera exposto (nao recalcula). |
| C15 | 🎨 **Padroes de estilizacao do front (NativeWind) — alinhar as duas UIs** | 🆕 **Pedido do Andre (2026-08-01).** O partner migrou a estilizacao de **Gluestack (props `$token`)** para **NativeWind/Tailwind (`className`)**, de forma **faseada** (as duas bibliotecas convivem, tela por tela). Este item registra **como** ele faz, para o client seguir o mesmo padrao e as duas UIs nao divergirem: paleta espelhada 1:1, primitivas `NwButton`/`NwInput` com API limpa, fontes, sombras, e as **armadilhas que ja custaram retrabalho aqui** (paleta ancorada no verde errado, `autoCapitalize` perdido, componentes sem equivalente). **Cartilha completa: secao "Detalhe — C15" no fim deste documento.** Substitui o C2. | Alinhamento de UI. O client decide **quando** migrar; o que nao pode e cada app inventar sua paleta/primitivas. |
| **C16** | 🔴 **WS: o token do socket nunca e renovado — o canal pessoal morre 1h depois do login** *(pedido: **front-partner**, estudo de infra WS/push 2026-08-01, a pedido do Andre)* | Vale para os **dois** hooks do client (`useQueueSocket.ts` e `useQueueNotifications.ts`): o token e lido **uma vez** (`SecureStore.getItemAsync` dentro do `useEffect`) e vira `connectHeaders` na criacao do `Client`. O `reconnectDelay: 5000` reconecta sozinho — **sempre com o header antigo**. Como o access token dura **1 hora** (`jwt.access-token-expiration=PT1H`) e o backend, ao receber token invalido, **conecta como ANONIMO em vez de recusar** (ver HANDOFF_BACKEND **S14**), o app fica "conectado" mas **para de receber `/user/queue/notifications`** — para sempre, sem erro. O topico publico da fila continua chegando. **Isto e candidato a causa-raiz do C14** (cliente nao ve `IN_PROGRESS`, so o estado final) **e do C9** (remocao nao reflete): o padrao bate — quebra so o canal pessoal, nunca o publico. **Correcao no client:** ler o token **dentro do `beforeConnect`** do stompjs (roda a cada tentativa de conexao) e renovar pelo refresh antes de reconectar, em vez de capturar no mount. | 🆕 Bug de infra. O **partner esta aplicando a mesma correcao** no proprio codigo; o fechamento completo depende do **S14** no backend. |
| **C17** | 🟠 **O client abre DUAS conexoes STOMP; o partner abre UMA** *(pedido: **front-partner**, mesmo estudo)* | `useQueueSocket` (fila, topico publico) e `useQueueNotifications` (pessoais) fazem **cada um o seu `new Client()`** — dois handshakes, dois ciclos de reconexao e duas sessoes no servidor por usuario. O partner resolve com **uma conexao e duas subscriptions** (`useQueueSocket.ts`: assina `/topic/establishment/{id}/queue` e `/user/queue/notifications` dentro do mesmo `onConnect`). Nao e bug funcional, mas **dobra o custo no backend** — que hoje roda **broker em memoria numa instancia so** — e dobra a superficie de falha. **Sugestao:** unificar num unico hook/cliente STOMP, com as duas assinaturas, espelhando o partner. | 🆕 Alinhamento de arquitetura. Fica melhor de fazer **junto com o C16** (mexe nos mesmos dois arquivos). |
| **C18** | 🟡 **Nenhum dos apps reconecta ao voltar do background** *(pedido: **front-partner**, mesmo estudo)* | Nao ha listener de `AppState` em nenhum dos dois apps. Quando o Android suspende o processo, o socket morre **sem evento**; ao voltar, o stompjs pode demorar a perceber. Na fila isso e mascarado pelo polling de fallback — **no canal pessoal nao e mascarado por nada**. Somado ao C16, e o cenario real de "parou de chegar": o usuario deixa o app aberto/em background por horas. **Correcao:** ao voltar para `active`, forcar reconexao do socket + `refetch` das queries de fila. | 🆕 Bug de infra. O **partner esta implementando** este item (junto com o C16) — o client pode espelhar. |
| **C19** | 🐛 **Solicitacao de corte: o cliente pede e NAO recebe confirmacao nenhuma** *(feedback de device, Andre 2026-08-05)* | Andre solicitou um corte pelo app cliente e **nada confirmou o envio na tela dele** (do lado do profissional tambem nao apareceu — ver o callout do 2026-08-05 no HANDOFF_BACKEND). **O que o client precisa fazer:** (1) mostrar **feedback imediato** do `POST` do pedido (sucesso/erro — se o backend recusou, o motivo tem de aparecer); (2) manter um **estado visivel "aguardando resposta do profissional"** com **contagem regressiva de 5min** — o pedido expira sozinho (auto-nega server-side) e o cliente precisa saber disso; (3) tratar os desfechos pelo WS pessoal: **aceito** (virou atendimento na fila), **recusado**, **expirado** (`CUT_EXPIRED` vai ao cliente). ⚠️ **Antes de codar, checar o obvio:** confirmar que o `POST` do pedido esta mesmo sendo disparado e com 2xx — a hipotese 1 do callout do backend e que o pedido **nunca foi criado**, e nesse caso o defeito e aqui. | Lado client do fluxo de **cut request** (C2/S-corte). O partner ja consome `GET /attendances/cut-requests` + `PATCH .../accept|refuse` e vai ganhar banner proprio na Fila; sem o lado do cliente, o fluxo fica manco nas duas pontas. |
| **C25** | 🌐 **App acessivel por URL (build web) — e as duas mitigacoes de seguranca que vao junto** *(decisao do Andre **D8**, 2026-08-12; o partner ja implementou)* | **Por que:** mandar APK e pedir "instala mesmo assim" e caro — Play Protect assusta, o arquivo circula por WhatsApp e cada versao repete o ritual. Com URL, o testador **abre e usa**, e a atualizacao e instantanea (o deploy substitui o app; nao ha "verificar atualizacao"). O Andre quer isto p/ **donos de estabelecimento testarem**, e vale igual p/ o app do cliente. **O que o partner fez, p/ voces espelharem:** **(1) `expo-secure-store` NAO existe na web** — o modulo web e um objeto vazio e a **1a chamada estoura**; pior, o erro sobe ate um `Alert.alert`, que tambem e **no-op** no React Native Web, entao a tela **fica parada sem dizer nada**. Dois caminhos: **alias no `metro.config.js`** trocando o pacote so no bundle web (zero mudanca no codigo — e o que a branch `design/marca-dev` do partner faz, com `web-shims/expo-secure-store.js`) **ou** um **adaptador** (`src/lib/storage.ts`) que imita a API e faz `Platform.OS === "web"` (explicito e testavel). **(2) 🔒 Usar `sessionStorage`, NAO `localStorage`** — o token **morre ao fechar a aba**, o que apaga o cenario do computador compartilhado, onde o proximo que sentar herda a sessao. **(3) 🔒 `public/_headers` com CSP** (o Expo copia `public/` p/ a saida do export; Cloudflare Pages e Netlify leem esse formato sem config) — o CSP e o que ataca o **vetor real**: sem ele, um script injetado le o token que o `sessionStorage` guarda. ⚠️ **O `connect-src` precisa listar a API E o WebSocket (`wss:`)** — esquecer o `wss:` faz a fila **parar de atualizar sem erro visivel**, porque o navegador bloqueia calado. **(4) Gatear o que a web nao tem:** esconder "verificar atualizacao" (`expo-updates`) e o registro de **push** — ⚠️ **push nao funciona na web**, entao no navegador o cliente so recebe atualizacao com a **aba aberta**, pelo WebSocket. 🆕 **(5) ASSUMIR a limitacao na tela e oferecer o app** *(decisao do Andre, 2026-08-12)*: em vez de a web parecer quebrada, ela **diz o que nao tem** — faixa so na web (`Platform.OS === "web"`) com *"no navegador voce nao recebe notificacao; a fila atualiza so com esta aba aberta"* e, logo abaixo, **"Baixar o app"**. Vale igual no client, onde a falta de push e ainda mais sensivel (o cliente perde o aviso de "chegou a sua vez"). Poe na tela da **fila/meu atendimento** e na **entrada**; **nao** repetir em toda tela, e deixar dispensavel na sessao. | ⚠️ **Sobre seguranca, sem rodeio:** no navegador **nao existe Keychain** — o token fica legivel por qualquer JS da mesma origem (e por extensao com permissao no site). As mitigacoes acima cobrem o uso como **canal de TESTE**. Se a web virar **acesso real**, o padrao da industria e refresh token em **cookie `HttpOnly`** — o que exige backend e faz conviverem **dois modos de auth** (header no app, cookie na web). Isso e **normal** (nenhum app nativo de big tech usa cookie), e o que barateia e servir **front e API na mesma origem**: ai basta `SameSite=Lax`, sem CORS com credenciais nem CSRF. Ver **D8** no PRD do partner. |
| **C24** | 🧊 **Cold start do Render × WebSocket — e o painel de diagnostico p/ isolar a causa** ✅ **O PARTNER JA ESTA INSTRUMENTADO (no ar desde 2026-08-11)** *(medicao do front-partner, 2026-08-11)* | Medido daqui: com a instancia hibernada, o readiness levou **35s** p/ responder; acordada, o `/ws/info` responde em **0,5s**. Ou seja, **qualquer** handshake feito na janela de boot morre — e isso vale igual p/ o client. **O que o partner ja tem e vale copiar:** (1) o **readiness gate** (`waitForBackend`) segurando o roteamento na abertura do app ate o backend responder — se o client ainda nao tem, e a peca que evita o 1o login falhar por timeout; (2) **reconexao ao voltar do background** (**C18**, aberto ai) — sem ela, o socket morre suspenso e nao volta; (3) **diagnostico na tela** mostrando o ultimo erro **e limpando-o ao reconectar** — no nosso `wsDiagnosticsStore` o erro ficava colado e fazia uma falha ja superada parecer permanente; se o de voces tem o mesmo comportamento, vale o mesmo conserto. ⚠️ **Nao confundir com o S14/S17:** aqui nao ha defeito no servidor — e a instancia dormindo. 🆕 **RESPOSTA AO RECADO DE VOCES (2026-08-11):** concordamos com o raciocinio — *"so com os dois apps instrumentados da p/ isolar a causa; os dois falharem aponta infra, so um falhar aponta o codigo daquele app"*. **Do nosso lado ja esta pronto e publicado:** o painel vive em **Configuracoes do profissional**, logo abaixo do id do OTA, e mostra `WS conectado/desconectado` · o **`heart-beat` que o SERVIDOR respondeu** · `sessao autenticada (<user-name>)` ou **ANONIMA** · **contagem por canal** (`fila N · pessoal N msg`) · e o ultimo erro. O store (`src/store/wsDiagnostics.store.ts`) **espelha o de voces de proposito** — mesmos canais (`public`/`personal`) e mesmas acoes (`markConnected(headers)`/`markMessage`/`markError`/`markClosed`) — justamente p/ a comparacao ser mac~a com mac~a. ⚠️ **DOIS ACHADOS QUE POUPAM TEMPO DE VOCES:** (1) **medimos a infra e ela ja explica o handshake:** com a instancia hibernada o readiness levou **35s**; **acordada**, o `/ws/info` responde em **0,5s** — entao "falha no handshake no primeiro acesso" e cold start, nao codigo; **testem sempre com o backend ja quente**, senao o A/B mede o Render e nao os apps. (2) **o nosso painel tinha um defeito que enganava:** o `lastError` **nao era limpo ao reconectar**, entao a falha do boot ficava na tela p/ sempre enquanto o `reconnectDelay` reconectava por baixo — lia-se "conectado" e "ultimo erro" ao mesmo tempo. **Corrigido aqui; confiram o de voces.** | | Registrado p/ o QA de voces nao gastar tempo cacando bug de codigo quando o sintoma for "primeiro acesso do dia falhou". A decisao de fundo (plano pago do Render vs keep-alive vs aceitar) esta no topico "Decisoes pendentes" do PRD do partner. |
| **C22** | 📅 **Horario de funcionamento por DIA da semana — a tela do cliente vai ter de exibir a semana** *(decorre do S27, feedback de teste manual do Andre 2026-08-11)* | Hoje o contrato tem **um** `opening_time`/`closing_time` p/ a semana inteira, e o Andre pediu **horario por dia** (domingo fechado, sabado ate as 18h). Quando o backend modelar isso (**S27** no HANDOFF_BACKEND: lista de `{dayOfWeek, openingTime, closingTime, closed}`), o **client tambem muda**: a tela da loja hoje mostra um par unico de horarios, e vai precisar mostrar **o dia corrente** ("hoje 9h–19h", "fechado hoje") e idealmente **quando reabre** ("abre amanha as 9h") — que e a informacao util p/ quem chega fora do horario. | ⛔ Depende do **S27**. Registrado agora p/ a tela da loja **nao ser desenhada assumindo um horario unico**. Partner: a tela `establishment-hours` vira grade de 7 linhas. |
| **C23** | 📧 **"Esqueci minha senha": a mensagem tambem muda no client** *(decorre do S21; evidencia de device do Andre em 2026-08-11)* | O Andre testou e **o fluxo passou com um e-mail sem cadastro** — o backend responde **200 sempre** (anti-enumeracao), entao os dois apps dizem *"se este e-mail estiver cadastrado..."* e seguem p/ o passo do codigo. Ele decidiu o contrario: o backend passa a devolver **`404 EMAIL_NOT_FOUND`** (**S21**). **Acao client, quando isso entrar:** trocar a mensagem por uma **afirmativa** ("Enviamos um codigo de 6 digitos para seu e-mail") e tratar o `404` como **erro do proprio campo** ("E-mail nao cadastrado"), sem popup. ⚠️ **No mesmo teste o e-mail NAO chegou** (**S7**, SMTP) — entao, ate o envio voltar, o fluxo segue inutilizavel nos dois apps mesmo com a mensagem certa. | ⛔ Depende do **S21** (e o fluxo so volta a funcionar com o **S7**). Trade-off de enumeracao de usuarios registrado no S21; a decisao do Andre esta mantida. |
| **C21** | 🕐 **Cada profissional escolhe seu regime: fila ou agenda pura — a tela do cliente tem de servir os dois** *(decisao do Andre, 2026-08-05 parte 3)* | Andre: *"o profissional podera escolher se usara fila (modelo que estamos criando), ou se apenas agenda onde os horarios sao fixos."* **Nao confundir com o C20:** o C20 e a escolha do **cliente** no fim da fila (entrar agora ou agendar por INTENÇÃO, horario **estimado**); o C21 e a escolha do **profissional** sobre como ele trabalha, e no modo agenda o horario e **FIXO** (hora marcada, nada empurra). **Acao client:** o card/tela de cada profissional passa a oferecer **"entrar na fila"** ou **"escolher horario"** conforme o `queue_mode` **dele** — e **os dois modos convivem no mesmo estabelecimento**, entao a tela da loja nao pode assumir um regime unico. No modo agenda, nao existe posicao/ETA a mostrar: existe **grade de horarios livres**. | ⛔ **Depende do backend S24** (campo de modo + grade de slots + reserva). Registrado agora p/ o client nao desenhar a tela da loja assumindo que todo profissional tem fila. Partner: tela da Fila vira grade do dia no modo agenda (mesma dependencia). |
| **C20** | 🎯 **O fim da fila e HIBRIDO: entrar na fila OU agendar — a escolha e do cliente** *(decisao do Andre, 2026-08-05 parte 2)* | Andre fechou o modelo: *"para o final da fila quero que o app seja hibrido, podendo ser por fila ou por agenda"*. **Nao e feature nova** — e a confirmacao de que o **C12/C6 (barra de encaixe + INTENÇÃO)** e mesmo o caminho, e que ele convive com o walk-in em vez de substituir. **Acao client:** no ponto em que hoje so existe "entrar na fila", oferecer **as duas portas** — *entrar agora* (vai pro fim da fila, ordem de chegada) ou *agendar* (INTENÇÃO num horario que a fila ainda nao alcancou, promovida sozinha quando o fim da fila cruza o horario). O backend **ja tem tudo** (S2/INTENTION completo: create/edit/cancel + promocao event-driven + agenda view + availability por profissional) — **o gargalo e a UI daqui**. ⚠️ Lembrar da implicacao ja registrada: disponibilidade e **por profissional**, entao o cliente pode entrar na fila do prof A (trabalhando) **e** agendar com o prof B (que ainda nao comecou) no mesmo estabelecimento. | Confirma C6/C12. Partner: passivo hoje, mas vai passar a **exibir os agendados na cauda da fila** (ver S2 no HANDOFF_BACKEND). |
| **C25** | 🎨 **Identidade visual nova (marca Vupth) — os tokens precisam existir nos DOIS apps** *(design, 2026-08-18)* | Paleta nova, desenhada no Pencil (`pencil-new.pen`): **`brandGreen #9FE870`** (verde-limao) + **`forest #163300`** (verde escuro) + pasteis de apoio (`greenTint #E2F6D5`, `accentBlue #A0E1E1`, `accentPeach #FFC091`, `accentPink #FFD7EF`, `accentPlum #260A2F`). Neutros: `background #FFFFFF` · `surface #F3F5F1` · `textPrimary #163300` · `textSecondary #454745` · `border #D7DDD3` · `danger #B3261E`. Tipos: **Archivo** (`700Bold` heading / `800ExtraBold` display) no lugar da **Poppins**, **Inter** mantida no corpo, **DMMono `500Medium`** para numeros (posicao na fila, horarios). Raios novos: `card 20` · `hero 24`. ⚠️ **A REGRA QUE MAIS IMPORTA — o contraste inverteu:** o `brandGreen` e claro demais para texto/icone sobre fundo claro. Ele entra **SO como FUNDO**, sempre com **`forest` por cima**; **nunca o inverso**. Isso e o oposto do habito da paleta antiga (`#3b7a3f` era escuro o bastante para servir de texto). **Estado:** aplicado nos dois apps na branch `design/marca-dev` (PR [#16](https://github.com/andrericao/vupth-partner/pull/16) aqui, PR [#14](https://github.com/andrericao/vupth/pull/14) no client), **aguardando decisao do Andre** sobre adotar. ✅ **Risco baixo:** os tokens sao **ADITIVOS** — nao remapeiam a escala `green` atual, entao sincroniza-los **nao muda tela nenhuma**. | 🆕 **Sincronizacao pedida:** os tokens precisam bater 1:1 em **tres** arquivos (`vupth-partner/config/gluestack-ui.config.ts`, `vupth-partner/tailwind.config.js` e `vupth/config/gluestack-ui.config.ts`) — a paleta viver em dois lugares no partner e o que ja causou "dois verdes diferentes no app". **Adotar os componentes e decisao separada** (e cara — conversa com a **D9**/migracao Gluestack v2). |
| **C26** | 🌐 **Caminho web — o app do cliente tambem vai virar link, e as quatro pecas ja estao provadas no partner** *(front-partner, 2026-08-25)* | O partner acabou de montar o export web de ponta a ponta: `web.output` no `app.json`, script `build:web`, `public/_headers` (CSP) e `public/_redirects` (fallback de SPA), com deploy na **Cloudflare Pages** por GitHub Actions e um teste que guarda as quatro pecas. **Nada disso e especifico do partner** — o client precisa das mesmas quatro, e de mais duas coisas que o nativo esconde. Ver "Detalhe — C26". | Copiar o caminho em vez de redescobrir. ⚠️ **O gate e o CORS no backend**, que bloqueia os DOIS apps igual. |
| C12 | **Agendar = barra de encaixe (particao de disco) + INTENÇÃO estimada** | 🆕 Modelo fechado com Andre (2026-07-14, evoluiu ao longo da conversa). A UI de agendar do cliente e uma **barra de encaixe estilo particao de disco**: comeca no **fim da fila viva** e vai ate o **fechamento**; os agendados ja congelados sao **blocos travados**; o cliente arrasta uma **"sombra" do tamanho do seu serviço** (soma das duracoes) e a encaixa num vao **sem cruzar ninguem**. O horario e uma **INTENÇÃO estimada** (o cliente confirma ciente de que pode oscilar): **congela num estimado realista** ao criar (ja contando quem esta na frente), **protegida por ordem de criacao** (nova intencao nao empurra as anteriores), **piso** no horario escolhido (nunca antes), e na **promocao** (fim da fila cruza o horario) vira fila viva e oscila de leve — **sem notificacao de atraso**. Mockup de referencia no repo partner: `design/agendamento-barra.html`. | Parte da UI de agendamento do cliente (**C6/S2**). Backend expoe `projectedQueueEnd` + `closing_time` + a **lista de blocos ocupados** (`{start,duracao}` por agendado) — ver HANDOFF_BACKEND "Detalhe — S2 · Encaixe de agendamento". Slots fixos foram **descartados** (quebram num modelo de fila). |

---

## Detalhe — C15 · Padroes de estilizacao do front (NativeWind)

> **Escrito em 2026-08-01, a partir do estado real do front-partner** (branch `chore/gluestack-update`, 7 batches entregues: todo o `(auth)`, os dois onboardings, a tela da FILA e 16 componentes). Nao e teoria — e o que esta rodando aqui, com as armadilhas que ja pagamos.

### 1. Por que NativeWind (e nao Gluestack v2)

A "v2" do Gluestack **e** NativeWind por baixo — migrar nao e bump de versao, e **troca de arquitetura** (props `$token` → `className`). Medimos o escopo aqui: **49 arquivos** e **~974 props `$token`**. Por isso a regra numero um:

**Nao faca big-bang.** NativeWind roda **ao lado** do Gluestack; converte-se **tela por tela**, e o `GluestackUIProvider` so sai do `_layout` quando o ultimo arquivo sair. Tela v1 e tela v2 convivem na mesma navegacao sem conflito.

### 2. Toolchain

- `nativewind` + `tailwindcss` (dependencias **JS/build-time**, sem modulo nativo → **entram por OTA**, nao exigem build novo).
- `babel.config.js` (preset do NativeWind), `metro.config.js` (`withNativeWind`), `global.css` importado no `_layout`.
- `jest`: incluir `nativewind|react-native-css-interop` no `transformIgnorePatterns`, senao os testes quebram ao importar componente com `className`.

### 3. Paleta — a regra mais importante

O `tailwind.config.js` **espelha 1:1** a escala `green` da marca. Enquanto a migracao durar, telas v1 e v2 dividem a mesma navegacao: **qualquer desvio vira "dois verdes" no app**.

```js
// tailwind.config.js — theme.extend.colors
brand:   { DEFAULT:"#3b7a3f", 50:"#eef5ee", 100:"#d9ead9", 200:"#b5d5b6",
           300:"#8bbd8d", 400:"#5c9c60", 500:"#3b7a3f", 600:"#316635",
           700:"#26522a", 800:"#1c3d1f", 900:"#142c17" },
success: { 500:"#348352", 950:"#071f11" },   // verde dos campos (inputs/busca)
amber:   { 500:"#FFB703", 600:"#d97706", 700:"#b45309" },
danger:  { 500:"#E63946", 600:"#dc2626" },
// fontFamily: heading = Poppins_700Bold · body = Inter_400Regular
```

⚠️ **Armadilha real (custou um commit de correcao):** o config do partner nasceu ancorado no **teal antigo `#00B37E`**, e login/cadastro renderizaram com um verde diferente do resto do app ate alguem notar. **Ao criar o `tailwind.config.js` do client, copie os hexes da fonte da verdade da marca — nao "escolha um verde parecido".**

Cinzas: a escala `gray` padrao do Tailwind **bate com a `coolGray` do Gluestack** (`gray-500` = `#6b7280` = `$coolGray500`, etc.) — nao precisa customizar. `amber-100/200/800` e `red-50` tambem batem com os defaults.

### 4. Primitivas — API limpa, sem token

Duas primitivas em `src/components/nw/` substituem `Button`, `Input`, `InputPassword` e `FormControl`:

**`NwButton`** — `title`, `isLoading`, `variant`, `className`, `textClassName`.
Variantes: `primary` · `secondary` · `danger` · `outlineBrand` · `outlineDanger`.
Nada de `bg="$green500"` na chamada: quem precisa de um visual fora das variantes usa `className` (e `textClassName` para a cor do texto — existe para botao claro **sobre fundo colorido**, ex.: "Finalizar" no card verde da fila).

**`NwInput`** — `label`, `error` (string; vazia = sem erro), `secure` (vira campo de senha com olho), mais os props de `TextInput`.
Sem `FormControl`: o erro e uma string por campo, o que deixa **cada input acender sozinho** em vez do form inteiro.

⚠️ **Armadilha real (regressao de COMPORTAMENTO, nao de estilo):** o `Input` do Gluestack embutia `autoCapitalize="words"` no `InputField`. Ao trocar pela primitiva nova, os campos de nome/endereco **param de capitalizar sozinhos** e ninguem nota na revisao de codigo. O `NwInput` do partner tem `autoCapitalize = "words"` como **default**; e-mail/senha/codigo passam `"none"` explicitamente.

### 5. Convencoes

| Situacao | Como fazer |
|---|---|
| Sombra de card | **`style={cardShadow}`** (objeto RN em `src/lib/styles.ts`). Sombra por classe nao e confiavel cross-platform — `elevation` no Android + `shadow*` no iOS. |
| `ScrollView` | `className` estiliza o **componente**; `contentContainerStyle` continua **objeto de estilo** (`{ flexGrow: 1 }`). Nao da para trocar por classe. |
| Espacamento entre filhos | `gap-*` no lugar de `space="sm"` (RN 0.71+ suporta `gap`). |
| Feedback de toque | `active:bg-*` / `active:opacity-*` no `Pressable` (substitui `$active-bg`). |
| Cor sem token equivalente | Classe arbitraria com o **hex real do tema antigo** (`bg-[#FFF4EB]`), nunca "uma cor parecida". Ex.: o `Badge` do Gluestack nao tem equivalente — fomos ao `config/theme/Badge.ts` buscar `warning` = `#FFF4EB`/`#ea580c` e `muted` = `#F6F6F7`/`#525252`. |
| Sub-componentes (`Row`, `Section`) | **Sempre no escopo do MODULO**, nunca dentro do componente. Definidos dentro, a inferencia de tipos do Gluestack por instanciacao **estourava a pilha do `tsc` (segfault)** — e continua sendo anti-padrao React (remonta a subarvore a cada render). |
| Textos/acessibilidade | **Preservar `testID` e `accessibilityLabel`** ao converter. Sao a ancora dos testes RNTL e dos flows do Maestro — e a unica rede de protecao que sobra, ja que a conversao nao tem como ser testada por tipo. |

### 6. Como o partner faz cada batch (receita)

1. Converter em **lotes pequenos e coerentes** (um grupo de rotas, ou os componentes de uma tela **antes** da tela).
2. Componentes **compartilhados** primeiro e **in place** (mantendo import e API) — as telas que os usam nao mudam, zero churn.
3. Componentes que **expoem token na API** (ex.: `bg="$white"` como prop) vao **junto das telas que os consomem**, senao a troca vaza para as chamadas.
4. Gate por batch: **`tsc --noEmit` + `eslint --max-warnings 0`**, e `jest` antes do push (o partner tem hook de pre-push rodando lint → tsc → jest --coverage → expo-doctor).
5. Commit por batch, com o **motivo** das decisoes nao obvias na mensagem.

### 7. O que NAO da para verificar sozinho

`tsc` e `eslint` provam que **compila**, nao que **renderiza**. Conversao de estilo so se valida **no device** — e o custo de nao validar e alto: sete batches acumulados aqui antes do primeiro QA real. **Recomendacao ao client: publicar OTA e olhar no aparelho a cada 2-3 batches**, nao no fim.

---

## Detalhe — C25 · Identidade visual nova (marca Vupth)

> **Escrito em 2026-08-18**, junto com a aplicacao nas duas branches `design/marca-dev`. Existe porque **faltou canal**: a identidade foi aplicada em 55 arquivos de codigo e nenhum documento, e o que esperavamos do client estava so num comentario de codigo, numa branch nao mergeada. Este documento e a correcao disso. *(O PRD do client cita "61 arquivos" — contagem feita de outro ponto; medindo `origin/dev...design/marca-dev` daqui dao 55 de codigo, 57 no total.)*

### 1. Os tokens (fonte da verdade)

| Token | Hex | Papel |
|---|---|---|
| `brandGreen` | `#9FE870` | verde-limao — **so como FUNDO** |
| `forest` | `#163300` | verde escuro — **texto/icone**, e o par do brandGreen |
| `forestSoft` | `#223D0D` | estado pressionado do forest |
| `greenTint` | `#E2F6D5` | lavagem clara (cards, badges, avatares) |
| `accentBlue` | `#A0E1E1` | apoio |
| `accentPeach` | `#FFC091` | apoio |
| `accentPink` | `#FFD7EF` | apoio |
| `accentPlum` | `#260A2F` | apoio |
| `background` | `#FFFFFF` | fundo da tela |
| `surface` | `#F3F5F1` | fundo de campo/superficie |
| `textPrimary` | `#163300` | texto principal (= forest) |
| `textSecondary` | `#454745` | texto de apoio |
| `border` | `#D7DDD3` | bordas |
| `danger` | `#B3261E` | erro/destrutivo |

**Tipografia:** `heading` **Archivo_700Bold** · `display` **Archivo_800ExtraBold** · `body` **Inter_400Regular** (inalterado) · `mono` **DMMono_500Medium** (numeros: posicao na fila, horarios). Pacotes: `@expo-google-fonts/archivo` e `@expo-google-fonts/dm-mono`.

**Raios:** `card 20` · `hero 24` (somam aos existentes, nao substituem).

### 2. A regra de contraste — o que mais custa se ignorar

O `brandGreen` **inverteu o habito da paleta antiga**. O `#3b7a3f` era escuro o bastante para ser texto sobre branco; o `#9FE870` **nao e**.

- ✅ `brandGreen` de **fundo**, `forest` de **texto/icone** por cima.
- ⛔ `brandGreen` como cor de texto, icone ou borda fina sobre fundo claro — **some**.
- ⚠️ Cuidado com o caso **invertido**: onde hoje existe fundo escuro (`green500`) com texto claro (`green50`/branco), trocar o fundo para `brandGreen` **exige** trocar o texto para `forest` no mesmo passo. Trocar so o fundo produz claro-sobre-claro.

### 3. Como aplicamos aqui (e o que deixamos de fora de proposito)

- **Aditivo, nao substituicao:** a escala `green50-900` continua definida e em uso. Nao remapeamos porque ela ainda serve de **cor de texto** em varias telas — remapear exigiria auditar contraste tela por tela.
- **Onde o fundo era escuro + texto branco** (a maioria dos botoes), trocamos so o tom: `green500` → `forest`. Continua escuro, o texto branco continua legivel. **O par claro `brandGreen`+`forest` entra so onde foi desenhado.**
- **Icones com hex cru** (`Ionicons color=`, `ActivityIndicator color=`, `tabBarActiveTintColor`) **nao aceitam token** — foram para `#163300` na mao. Vale checar os equivalentes no client: uma busca por `#3b7a3f` acha o que um grep por `$green` nao acha.
- **Ambar/warning ficou intocado.**

### 4. Componentes

- `src/components/brand/Button.tsx` — variantes `primary` (fundo brandGreen) / `secondary` (greenTint) / `outline` / `ghost`. ⚠️ **O comentario original dizia espelhar um `src/components/brand/Button.tsx` do client que nao existia** — agora existe, criado no PR #14 do client.
- `src/components/nw/Button.tsx` (NativeWind) — ganhou `vupthPrimary` / `vupthSecondary` / `vupthOutline` ao lado das variantes antigas, que **mudaram so de tom** (nao de estrutura), entao as ~36 chamadas existentes herdaram sem edicao.

### 5. O que pedimos ao client

1. **Sincronizar os tokens** — e barato e nao muda tela nenhuma (sao aditivos). Os tres arquivos (`gluestack-ui.config.ts` daqui, `tailwind.config.js` daqui e `gluestack-ui.config.ts` de voces) precisam bater **1:1**: a paleta viver em dois lugares aqui e o que ja produziu dois verdes diferentes no mesmo app.
2. **Adotar os componentes e decisao separada** — mais cara, e conversa com a **D9** (migracao Gluestack v2). Sincronizar token nao obriga a adotar componente.

---

### 6. As REGRAS DE USO (2026-08-21) — o que faltava, e o que custou caro

> **Por que esta secao existe.** Ate aqui o C25 documentava os **tokens** e mais
> nada. Token nao decide nada sozinho: sem regra de USO, cada tela decide de
> novo, e foi o que aconteceu. Custou, em ordem de gravidade:
>
> - Um **`$blue50`/`$blue800`** — cor que **nao existe na marca** — chegou ao
>   relatorio do dono e ficou. Entrou porque o `StatCard` de la aceitava `bg` e
>   `color` **crus por parametro**.
> - **Texto ilegivel** em 11 pontos do client (detalhe no item 6.4).
> - **~60 sombras** contra **13** no `.pen` inteiro, o que fez o QA dizer que
>   *"parece que tudo e clicavel e importante"*.

#### 6.1 Verde e ACENTO — 1 a 2 por tela

Medido no `.pen`, por tela: **1 a 2** elementos com fundo `brand-green`, contra
**3 a 8** em `surface`. Referencia limpa: `PROF · 03 Relatorios` = **1 verde, 8
surface**.

Quando tudo e verde, nada e. Regra pratica que ja aplicamos duas vezes:
**numero ZERO nao e heroi** — "0 na fila" e a *ausencia* de fila, nao o numero
que importa; nesse estado o card fica neutro e o acento sobra pra acao da tela.

#### 6.2 Card = `surface`, raio 20, PLANO

O que separa um card do fundo e o proprio `$brandSurface` — **nao** a sombra,
**nao** a borda. O trio `bg="$white"` + `borderRadius="$2xl"` + `cardShadow`
era o card mais comum dos dois apps e esta **aposentado**.

Primitiva pronta: `src/components/brand/Card.tsx` (`BrandCard`) nos dois repos.
Em tela ja migrada p/ NativeWind: `bg-vupth-surface rounded-card`.

#### 6.3 Sombra so no que FLUTUA

No `.pen` inteiro sao **13** elementos com sombra: as 5 tab bars, o FAB, o sino,
a notificacao e os cards de resumo sobre `forest`. **Nada mais.**

`cardShadow` foi **renomeada p/ `floatingShadow`** de proposito — o rename obriga
a revisar cada ponto de uso em vez de o import antigo passar batido. Sombra e
*affordance de toque*: em tudo, faz tudo parecer botao.

#### 6.4 Contraste — a escala cinza do client e INVERTIDA

⚠️ **Armadilha real, ja cobrada em producao.** No `gluestack-ui.config.ts` do
client, `gray300` (#5C6265) e mais **ESCURO** que `gray400` (#B9BBBC), que e
mais escuro que `gray500` (#DDDEDF). Quem escreve `$gray400` esperando "cinza
medio" acerta um cinza **quase invisivel**:

| token | hex | sobre branco | |
|---|---|---|---|
| `$gray400` | #B9BBBC | **1,93:1** | REPROVA |
| `$gray500` | #DDDEDF | **1,35:1** | REPROVA |
| `$gray200` | #F2F3F3 | **1,11:1** | REPROVA |
| `$brandTextSecondary` | #454745 | 9,37:1 | ok |

Minimo WCAG AA p/ texto = **4,5:1**. Texto secundario e
**`$brandTextSecondary`**, ponto. Unica excecao legitima: controle
**desabilitado**, que a WCAG isenta — baixo contraste ali *e* o sinal.

#### 6.5 Sobre `forest`, o par e `brandGreen` — nunca branco

Ja estava no topo do C25 na forma "brandGreen so entra como fundo". A outra
metade da regra: **fundo `forest` pede `brandGreen` por cima**, nao `$white`.
Branco sobre forest funciona de contraste mas nao e a marca — e o par da paleta
antiga.

#### 6.6 Numero e `$display`; hora/versao e `$mono`

`$display` (Archivo ExtraBold) p/ numero grande e titulo. `$mono` (DM Mono) p/
hora, cronometro e versao — digito que muda nao pode dancar de largura.

#### 6.7 Primitiva nao aceita cor crua

`StatCard` expoe **`hero`** (booleano), nao `bg`/`color`. Foi o parametro de cor
cru que deixou o azul entrar. Se uma tela "precisa" de uma cor que a primitiva
nao oferece, quase sempre o certo e a primitiva errada — nao uma cor nova.

---

## Detalhe — C26 · Caminho web (o que o partner montou, e o que o client vai precisar)

**Por que isto existe:** a decisao **D8** (2026-08-12) foi distribuir por **web E por lojas**. O partner fechou o lado web primeiro; este bloco e o mapa para o client nao repetir a descoberta.

### As quatro pecas do export

1. **`app.json` → `web: { "bundler": "metro", "output": "single" }`.** Sem `output` declarado, o expo-router escolhe sozinho. **`single`** gera UM `index.html` e deixa o roteamento no navegador — que e o certo para app cujas telas uteis estao todas **atras de login**. `static` geraria um HTML por rota, o que so se paga com conteudo publico e indexavel.
2. **Script `build:web`: `expo export --platform web`** (saida em `dist/`).
3. **`public/_headers`** — cabecalhos de seguranca, com o **CSP**. O Expo copia `public/` inteiro para a saida do export, e **Cloudflare Pages e Netlify leem esse arquivo sem configuracao extra**.
4. **`public/_redirects`** com `/*    /index.html   200`. Sem essa regra, abrir `/login` direto — ou dar **F5** dentro do app — devolve **404 do host** em vez da tela. E o defeito classico de SPA em host estatico, e so aparece **depois** do deploy. O `200` importa: 301/302 mandariam o usuario para `/` e ele perderia a rota.

### As duas coisas que o nativo esconde

5. **O token nao tem onde morar.** Na web nao existe `SecureStore`: o cofre do sistema simplesmente nao esta la. O partner resolveu com **shim de `sessionStorage`** (o token **morre com a aba** — mais curto que `localStorage`, de proposito) **mais o CSP**, que sao as duas metades da mesma mitigacao: o `sessionStorage` encurta a janela, o CSP evita que exista script injetado para ler dentro dela. **O client vai precisar do mesmo par** — e a decisao de qual storage usar **nao pode divergir** entre os apps, senao um dos dois fica com a janela maior sem ninguem ter decidido isso.
6. **Push NAO funciona na web.** Nem no partner nem no client. O que der para resolver por polling/WS, resolve; o resto o usuario **nao recebe**, e a UI nao deve prometer que recebe.

### Onde hospedar — e a pegadinha de licenca

**Cloudflare Pages**, e a escolha nao foi por recurso: requisicao a asset estatico e **gratuita e ilimitada** la (o teto de 100 mil/dia so vale para Functions/Workers, que nao usamos), **sem restricao de uso comercial**, e e um dos dois hosts que ja leem o `_headers`/`_redirects` como estao.

⚠️ **Vercel nao serve para nos no plano gratuito.** A documentacao do **Hobby** diz, textualmente, que ele e restrito a uso **nao-comercial e pessoal**. A Vupth cobra taxa e multa — e negocio. O plano compativel seria o **Pro, US$ 20 por usuario/mes**. Ou seja: a diferenca entre Cloudflare e Vercel aqui **nao e de preco nem de recurso, e de estar dentro ou fora dos termos**.

Netlify tambem e gratis e tambem le os dois arquivos, com teto de banda (100 GB/mes). Fica como terceira porta.

**Custo total do caminho: zero.** So aparece conta se voces quiserem **dominio proprio** (o `*.pages.dev` sai de graca e o link funciona igual).

### 🔴 A armadilha que derrubou o nosso app — e que ESTA no site de voces agora

**A Cloudflare Pages exclui `node_modules` do deploy, por design** ([known issues](https://developers.cloudflare.com/pages/platform/known-issues/)). E o `expo export --platform web` grava os assets **espelhando o caminho de origem** — entao os TTFs saem em `dist/assets/node_modules/@expo-google-fonts/...` e a Pages **descarta a pasta inteira, em silencio**.

**Medido no site de voces (`dev.vupth.pages.dev`, 2026-08-27):** o bundle referencia **42 fontes** sob `assets/node_modules/`, e a primeira que testamos responde **`200` com `content-type: text/html`** — ou seja, **nao existe**; quem respondeu foi o fallback de SPA devolvendo o `index.html`.

⚠️ **No app de voces isso nao trava — e por isso e pior.** Como o `_layout` de voces nao segura a tela no `useFonts`, o site carrega normalmente **renderizando com a fonte do sistema, sem a identidade da marca**. Parece "quase certo", que e o tipo de defeito que ninguem reporta. No nosso, que segurava, virou **spinner eterno** — mais barulhento, mas mais facil de achar.

**Como conferir em dois comandos:**

```bash
curl -s https://dev.vupth.pages.dev/ | grep -o '/_expo/static/js/web/[^"]*\.js'
# baixe o bundle, pegue um caminho de fonte e teste o CONTENT-TYPE:
curl -sI "https://dev.vupth.pages.dev/assets/node_modules/.../Inter_400Regular....ttf" | grep -i content-type
```

`content-type: text/html` = o arquivo nao existe.

**As duas correcoes que fizemos:**

1. **Tirar os TTFs de dentro do `node_modules`.** Copiamos os 8 arquivos para `assets/fonts/` e carregamos com `require("../assets/fonts/X.ttf")`. Verificado no build: 8 arquivos em `/assets/assets/fonts/`, **nenhum** sob `node_modules`, cada um servindo `200 font/ttf`. De brinde, o export caiu de **42 fontes para 8** — antes o pacote inteiro entrava no bundle.
2. **Nao travar a tela no carregamento de fonte.** `useFonts` devolve `[loaded, error]`; usar so o `loaded` faz qualquer falha virar espera infinita. O portao passou a ser `fontLoaded || fontError`. **Esta e a correcao mais importante das duas** — vale para qualquer plataforma, e e o que impede o defeito de voltar por outro motivo.

**A licao que generaliza, e que vale mais que o caso:** **`200` nao significa que o arquivo existe.** Com fallback de SPA, *tudo* responde 200 — o que distingue e o **`content-type`**. Isso vale para conferir qualquer asset de qualquer um dos dois apps.

### ⚠️ O gate de verdade: CORS — com uma CORRECAO sobre o WebSocket

Nada disso funciona se a **API nao autorizar a origem nova**. No app nativo CORS nao existe, entao o assunto nunca apareceu — no navegador ele bloqueia **toda** chamada. **Isso trava os dois apps igual**, e e item de **backend**.

❌ **CORRECAO (2026-08-27) — o WebSocket NAO precisa ser autorizado, e cobrar isso era pedir para quebrar o que funciona.** A primeira versao deste bloco dizia que o CORS tinha de valer *"em https e no WebSocket"*. O backend auditou o proprio codigo e mostrou que **o WS ja esta aberto**: `WebSocketConfig:68-69` tem `.setAllowedOriginPatterns("*")` no endpoint nativo **e** no SockJS, com `/ws/**` em `permitAll`. Handshake de WS **nativo nem passa por CORS**; o fallback SockJS passa, e ja emite os headers a partir desse mesmo `*`. ⚠️ **O alerta que eles devolveram e o que importa:** apertar o CORS do HTTP **junto com** a origem do WS quebraria o tempo real que hoje funciona — o commit do CORS deliberadamente nao toca no `*`. **Nao cobrem WS deles.**

**E o lado HTTP e pior do que este documento dizia:** nao e "falta autorizar a origem" — **nao existe CORS nenhum** (auditado 26/08: `SecurityConfig` sem `.cors(...)`, sem `CorsConfigurationSource`, sem `addCorsMappings`; o unico `@CrossOrigin` esta comentado). Sem `.cors()`, o **preflight `OPTIONS`** cai em `anyRequest().authenticated()` e preflight **nao leva `Authorization`** — o navegador toma **401 no OPTIONS** antes de qualquer chamada real, e o console mostra so o erro generico de CORS, sem corpo e sem status util. ⚠️ **Armadilha:** `cors.allowed-origins` existe nos `application-*.properties` e e **propriedade MORTA**; "autorizar" la nao muda nada. O desenho aprovado (env var `CORS_ALLOWED_ORIGINS`, `setAllowedOriginPatterns` por causa do curinga no meio de `https://*.vupth-partner.pages.dev`, `allowCredentials(false)`) esta na **secao 18e do PRD_BACKEND**.

📣 **Para o client, na pratica:** nada muda no codigo de voces — sigam mandando o JWT em `Authorization` e **nao usem cookie** (com `allowCredentials(false)` ele nao atravessa, e mudar isso exigiria abandonar o curinga de subdominio). Origem nova = avisar o backend para entrar na env var.

### A variavel de ambiente que e assada no build

`EXPO_PUBLIC_API_ENV` entra **no bundle em tempo de build**, e o default do `api.ts` e `staging`. O partner passou a **declarar o valor no workflow**, explicitamente — porque deixar implicito foi exatamente o defeito que quase mandou ao aparelho um bundle apontando para `localhost`. **Vale o mesmo alerta para o build web do client.**

### Guarda automatica

O partner escreveu `src/lib/__tests__/webConfig.test.ts`, que reprova se qualquer uma das quatro pecas sumir. Existe porque **nenhuma delas quebra typecheck, lint ou teste de componente**: o app continua compilando e o build nativo nem percebe — quem quebra e o **site**, e so em producao. Vale espelhar.


---

## Detalhe — C27 · Ambiente de teste: dev client, canais e os tres apks (2026-09-06)

> **Fonte unica do assunto:** [`AMBIENTES.md`](AMBIENTES.md), no repo do partner (Regra 1 do
> VUPTH_DOCS). O que segue e o resumo acionavel para o client, com o que **voces** precisam
> conferir no repo de voces.

### 1. O Expo Go parou de abrir os projetos — e nao e bug de voces

O Expo Go e um app da Play Store e carrega **so o SDK mais novo**: o SDK 57 saiu em
**30/06/2026** e os projetos estao no **54**. Como ele se atualiza sozinho pela loja, chegou o
dia em que passou do 54 e nao abre mais. Nao adianta procurar no codigo: e acoplamento —
enquanto o ambiente de teste for um app que a Expo atualiza, quem manda no calendario de
voces e a Expo.

### 2. O substituto: `expo-dev-client`

Um build do **proprio app**, com menu de desenvolvimento e leitor de QR embutidos, e a camada
nativa **congelada no SDK do projeto**. A Expo pode lancar o 58: nao chega no aparelho, porque
o app nao vem da loja. So muda quando **voces** mandarem buildar.

```
npx expo install expo-dev-client
eas build -p android --profile development
# instala o APK, e a partir daqui:
git switch <branch>          # ou: gh pr checkout <n>
npx expo start --dev-client  # le o QR COM ESSE APP — sem Expo Go
```

**Rebuild so quando o nativo muda**: bump de SDK, lib nativa, plugin, permissao, icone,
package id. Tela, logica, rota, estilo e troca de branch **nao** pedem rebuild.

Bonus: como e o app de verdade, **push remoto volta a ser testavel** (o Expo Go nao entrega
push desde o SDK 53). Se precisarem de um paliativo hoje, da para instalar o Expo Go da versao
certa em `https://expo.dev/go?sdkVersion=54&platform=android&device=true` — mas e remendo, e
precisa desligar a atualizacao automatica dele.

### 3. ⚠️ Confiram se o `preview` de voces aponta para producao

No partner, o canal `preview` — o APK de distribuicao interna, o que o time instala —
apontava para o **Railway**. Consequencia: **teste em device gravava no banco de producao**.
Corrigido em 2026-09-06.

**Onde olhar no repo de voces:** o mapeamento canal -> ambiente (no partner e o
`CANAL_PARA_ENV`, em `src/lib/apiEnv.ts`) e o `env` de cada perfil no `eas.json`. Se o
`preview` estiver em `prod`, e o mesmo problema.

A regra acordada: **`prod` e o Railway, `staging` e o Render, e o que se testa e o Render.**

### 4. Tres apps no aparelho, um por papel

O Android identifica app pelo `package`: dois builds com o mesmo id sao o **mesmo app**, e
instalar um **desinstala** o outro. Era por isso que nao dava para ter o veiculo de teste e o
de producao lado a lado. A saida foi um `app.config.js` que da sufixo as variantes de teste:

| perfil | id | backend | de onde vem o JS |
|---|---|---|---|
| `development` | `...partner.dev` | Render | Metro local |
| `preview` | `...partner.preview` | Render | OTA do push na `dev` |
| `prod-apk` | `...partner` | Railway | OTA do push na `main` |

⚠️ Dois detalhes que custaram confusao aqui: o canal **`preview` recebe OTA da `dev`**, nao da
`main` (quem quer olhar producao usa o `prod-apk`); e o perfil **`production` gera app-bundle**,
formato de loja que **nao instala no aparelho** — dai a existencia do `prod-apk`.

### 5. Efeito colateral esperado, para ninguem abrir bug

O Render Free hiberna: o APK de teste passa a ver o **portao de warmup (~50s)** no primeiro
acesso apos ociosidade. E esperado.

### 6. Contas de QA

`<perfil>_<dezena>@teste.com` — prefixo `client`, `prof` ou `prop`, numero em **dezenas**, um
por bateria. `client_10@teste.com`, `prof_10@teste.com` e `prop_10@teste.com` sao a **mesma
rodada**; a proxima bateria comeca no **20**. Como o QA vive no Render, e la que essas contas
existem.

### 7. Como o partner esta revisando PR

Duas passadas, porque sao duas perguntas diferentes: testa-se a branch **isolada** (aqui se
julga o PR — se quebrou, a culpa e dele), e depois do merge roda-se a `dev` uma vez (aqui se
pergunta se as duas mudancas convivem). Para PR visual, `npx expo start --web` adianta sem
esperar build.

E uma regra que vale espelhar: **lib nativa entrando = bump de versao obrigatorio**. Como o
`runtimeVersion` segue `appVersion`, os APKs da versao anterior **param de receber OTA** — o
que e correto, mas pega de surpresa quem nao sabe.
