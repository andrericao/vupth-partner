# Handoff Front-Partner -> Design (almarr-cyber)

Itens levantados no **QA de device** do app partner cuja decisao pertence a **equipe de design**: desenho de tela, hierarquia, iconografia e affordance. Registrados aqui para alinhamento — o front nao muda desenho por conta propria.

Ultima atualizacao: 2026-08-22 · branch `design/marca-dev` do front-partner.

> **Direcao do documento.** Aqui vai o que o front PEDE ou APONTA para a design. O caminho inverso (o que a design pede ao front) esta em `design/PEDIDO_DESIGN.md` e `design/PEDIDO_PARA_IA_DESIGN.md`.

> **Prefixo `DS`, e nao `D`.** O `D` ja esta ocupado pelas **DECISOES de produto** (D1..D9) no topico 9-A do `PRD_FRONT-PARTNER.md` — usar `D` aqui criaria duas listas com o mesmo nome. Como nos handoffs `S`/`C`, **os numeros `DS` sao estaveis**: nunca renumeramos, entao podem ser citados por numero com seguranca.

> **Origem desta rodada.** Teste manual do Andre em **Expo Go** (2026-08-22) sobre a entrega da design em `origin/design/marca-dev` (`e76470d`, 25 commits do Pencil).

---

| # | Item | Descricao | Justificativa / status |
|---|------|-----------|------------------------|
| DS1 | **CTA "Entrar" do login cai sobre a barra do aparelho** | Na tela de login o botao de entrar ficou **por cima dos botoes de navegacao do dispositivo** (barra inferior do Android). Ver "Detalhe — DS1". | 🐛 Observado no device (Andre, 2026-08-22). **Correcao e de CODIGO**, mas a **decisao e da design**: manter o CTA ancorado no rodape (e entao respeitar o safe-area) ou devolve-lo ao fluxo da tela. |
| DS2 | **Icone do canto superior direito na tela do proprietario e PROVISORIO** | O icone que hoje aparece no canto superior direito da tela do dono ("banco") **e apenas um icone de fila**, colocado como quebra-galho pelo Andre — **nao** e escolha de arte. **Substituicao livre.** | ℹ️ Aviso, nao bug. A design escolhe o icone definitivo (o Pencil ja padronizou `lucide` no commit `1d441a2`). |
| DS3 | **Profissional nao acha onde abrir/fechar a propria fila** | A acao de **dizer que esta trabalhando** (e de abrir/fechar a fila dele) precisa estar **visivel na tela do profissional**. Hoje, de primeira viagem, o profissional **nao descobre por onde** faz isso. | 🎨 Pedido de desenho (Andre, 2026-08-22). **Nao e falta de feature** — a acao existe e funciona; falta **affordance**. Ver "Detalhe — DS3". |
| DS4 | **Poder aumentar e diminuir as fontes** | O usuario precisa conseguir **ampliar ou reduzir o tamanho do texto** do app. | 🎨 Pedido (Andre, 2026-08-22). **Decisao da design antes de codar:** honrar a fonte do sistema ou oferecer controle proprio? E ate onde o layout do Pencil aguenta? Ver "Detalhe — DS4". |
| DS5 | **Abas do rodape nao mostram qual esta ativa; o icone de "Menu" ficou estranho** | Ao tocar nas abas do rodape **nao ha destaque** da aba selecionada. Alem disso, o icone de **Menu** ficou estranho. | 🐛 + 🎨 Observado no device (Andre, 2026-08-22). **Parte disso e implementacao incompleta, parte e escolha de glifo.** Ver "Detalhe — DS5". |

---

## Detalhe — DS1 (CTA do login sobre a barra do aparelho)

**Onde:** `app/(auth)/login.tsx`, linha 64 — `<View className="flex-1 pt-14 pb-8 px-7">`.

**Raiz:** o commit `7170796` (*"feat(login-partner): aplica o Pencil e ancora o CTA no rodape"*) passou a ancorar o botao no fim da tela usando **`pb-8` fixo**. Padding fixo **nao conhece a barra de navegacao** do aparelho: em device com barra por gestos ou por botoes, a altura util muda e o CTA invade a barra. O log do mesmo teste tambem acusou `SafeAreaView has been deprecated` — os dois apontam para o mesmo lugar.

**Correcao tecnica (quando a design confirmar que o CTA fica ancorado):** trocar o padding fixo pelo inset real via `useSafeAreaInsets()` do `react-native-safe-area-context` (ja e a lib recomendada pelo warning), aplicando `paddingBottom: Math.max(insets.bottom, 32)`. Vale varrer as demais telas que ancoram CTA no rodape — o Pencil usa esse padrao em mais de uma.

## Detalhe — DS3 (affordance de "estou trabalhando")

**Por que isso e desenho e nao feature:** o modelo ja esta implementado e testado — o profissional tem status (`Trabalhando` / `Fora`), a loja **deriva** dele (primeiro que abre acende a loja, ultimo que sai fecha) e existe **"Fechar fila"** / **"Reabrir fila"** ligado ao `PATCH /professional/me/accepting-new`. O problema e **onde isso mora**: as acoes estao atras do menu **"Opcoes da fila"**, e a tela do profissional nao anuncia que elas existem.

**O que se pede a design:** um ponto de entrada **na propria tela do profissional** que mostre, sem abrir menu, (a) o estado atual (trabalhando ou fora), (b) que aquilo e tocavel para trocar, e (c) o par abrir/fechar fila. As pilulas largas *"Voce esta: X · toque para trocar"* foram a tentativa anterior do front nessa direcao — servem como ponto de partida, nao como solucao aprovada.

**Cuidado ao desenhar:** "estar trabalhando" e "aceitar novos clientes" sao **dois estados diferentes** (da para estar trabalhando com a fila fechada, drenando quem ja entrou). O desenho precisa deixar os dois legiveis sem sugerir que sao um so botao.

---

## Detalhe — DS4 (tamanho de fonte ajustavel)

**Duas solucoes diferentes, e a design escolhe qual:**

1. **Honrar o ajuste do SISTEMA** (Android/iOS ja tem "tamanho da fonte" nas configuracoes do aparelho). E o caminho padrao de acessibilidade, nao inventa controle novo e e o que o usuario ja espera. No React Native isso ja vem **ligado por padrao** (`allowFontScaling`) — ou seja, **em tese o app ja deveria crescer**, e vale conferir no device se alguma tela esta desligando isso.
2. **Controle DENTRO do app** (A- / A+ em Configuracoes). Da controle fino e independe do aparelho, mas e mais superficie para desenhar e manter, e passa a conviver com o ajuste do sistema (os dois se multiplicam se ninguem travar).

**O que trava hoje, e por que a design precisa opinar:** o Pencil usa **alturas fixas** em varias primitivas — o botao e `h-[54px]`, as pilulas de status e os cards seguem a mesma regra. Com a fonte ampliada, texto fixo dentro de caixa fixa **corta ou estoura**; nao adianta o front so "deixar escalar". O pedido concreto a design:

- definir o **teto de ampliacao** que o desenho suporta (ex.: ate 130% do padrao);
- dizer como cada primitiva **reflui** ao crescer (o botao vira mais alto? o texto quebra em duas linhas? o icone encolhe?);
- apontar o que **NAO deve escalar** (numeros de senha/posicao na fila, por exemplo, costumam ser desenhados como elemento grafico).

**Cuidado especifico:** os rotulos do rodape (abas) ja apareceram **cortados em device real** — foi o commit `89f1678` da propria entrega. Essa e exatamente a area que quebra primeiro quando a fonte cresce.

---

## Detalhe — DS5 (estado ativo da tab bar e o icone de Menu)

**Sao dois problemas com causas diferentes.**

### 1. Falta destaque — a pilula do Pencil nao foi implementada

O `src/components/TabBarIcon.tsx` **documenta o desenho correto no proprio comentario**: no Pencil, o estado ativo e marcado por **cor** (`$forest` vs `$text-secondary`) **mais a pilula `$green-tint` atras do icone**. O codigo entregue faz **so a cor** — a pilula nunca foi codada. Ou seja: **o desenho esta certo, a implementacao ficou pela metade.**

E a cor sozinha nao da conta, com numero: ativo `#163300` contra inativo `#454745` tem contraste de **1,49:1** entre si. Os dois se leem bem sobre o branco (13,9:1 e 9,4:1), mas sao praticamente **indistinguiveis um do outro** — dois tons escuros. E a mesma armadilha que ja custou retrabalho nesta branch (trocar um verde escuro por outro e achar que a marca chegou): quem olha nao ve diferenca.

**Acao:** e correcao de **CODIGO** (implementar a pilula `green-tint` sob o icone ativo, como o Pencil especifica). Nao depende de decisao nova da design — a nao ser que ela queira reforcar ainda mais o ativo (peso do rotulo, indicador superior).

### 2. O icone de Menu e escolha de arte, e ela precisa ser revista

O glifo hoje e o **`Grid3x3`** do `lucide` — uma grade de 9 quadrados. Ele **nao e aproximacao nossa**: veio do commit `1d441a2` (*"usa os icones exatos do Pencil (lucide), nao aproximacao"*), lido do proprio arquivo de design. Entao a revisao e **da design**, nao do front.

**Por que estranha:** grade de quadrados e a convencao de **"todos os apps / launcher / dashboard"**, nao de "menu". O vocabulario que o usuario reconhece para menu e o hamburguer (`Menu`) ou as reticencias (`Ellipsis` / `MoreHorizontal`). Vale notar que esta mesma aba **ja deu problema de rotulo cortado** em device real (commit `89f1678` da propria entrega) — e a aba do rodape que mais pediu conserto ate agora.

---

## Nota de contexto — o erro de push no Expo Go NAO e da entrega da design

Ao rodar a branch `design/marca-dev` como entregue (`e76470d`) no **Expo Go**, o app quebra com `expo-notifications: Android Push notifications ... was removed from Expo Go with the release of SDK 53`, em `src/hooks/usePushRegistration.ts:3`.

**Nao e defeito do desenho** e nao ha nada a fazer do lado da design. E uma limitacao do Expo Go desde o SDK 53: o modulo grita **no import**, antes de qualquer tela. O front ja corrigiu isso (carregar o modulo sob demanda, commit `6969ea9`), mas essa correcao **nao esta** na branch da design — ela vive na `design/marca-dev` local do front, junto do merge das duas pontas.

**Consequencia pratica para quem for testar:** rodar o `e76470d` puro em Expo Go bate nesse erro. Testar a partir do merge (que tem **zero diferenca de tela** em relacao a entrega — so acrescenta dois arquivos de teste) mostra o mesmo desenho sem o crash.
