# Handoff Front-Partner -> Design (almarr-cyber)

Itens levantados no **QA de device** do app partner cuja decisao pertence a **equipe de design**: desenho de tela, hierarquia, iconografia e affordance. Registrados aqui para alinhamento — o front nao muda desenho por conta propria.

Ultima atualizacao: 2026-08-31 · branch `design/marca-dev` do front-partner.

> **Estado da rodada de 22/08:** DS1, DS2 e a metade de codigo do DS5 fechados. **Aberto e esperando a design: DS3, DS4 e o glifo de Menu do DS5.**

> **Direcao do documento.** Aqui vai o que o front PEDE ou APONTA para a design. O caminho inverso (o que a design pede ao front) esta em `design/PEDIDO_DESIGN.md` e `design/PEDIDO_PARA_IA_DESIGN.md`.

> **Prefixo `DS`, e nao `D`.** O `D` ja esta ocupado pelas **DECISOES de produto** (D1..D9) no topico 9-A do `PRD_FRONT-PARTNER.md` — usar `D` aqui criaria duas listas com o mesmo nome. Como nos handoffs `S`/`C`, **os numeros `DS` sao estaveis**: nunca renumeramos, entao podem ser citados por numero com seguranca.

> **Origem desta rodada.** Teste manual do Andre em **Expo Go** (2026-08-22) sobre a entrega da design em `origin/design/marca-dev` (`e76470d`, 25 commits do Pencil).

---

| # | Item | Descricao | Justificativa / status |
|---|------|-----------|------------------------|
| DS1 | **CTA "Entrar" do login cai sobre a barra do aparelho** | Na tela de login o botao de entrar ficou **por cima dos botoes de navegacao do dispositivo** (barra inferior do Android). Ver "Detalhe — DS1". | ✅ **FECHADO em 2026-08-26 (Alexia, `85ae773`).** A design confirmou o CTA ancorado, e o `pb-8` fixo deu lugar ao inset real (`Math.max(insets.bottom, 32)` — o 32 e o piso pra tela sem barra nenhuma). Estava em **tres** telas, nao so no login: `login`, `register` e `forgot-password`. O gemeo no app do cliente saiu depois, na PR #23 do `vupth`. |
| DS2 | **Icone do canto superior direito na tela do proprietario e PROVISORIO** | O icone que aparecia no canto superior direito da tela do dono ("banco") era **apenas um icone de fila**, quebra-galho do Andre — nao escolha de arte. | ✅ **FECHADO em 2026-08-26 (Alexia).** Ele **ja tinha saido** na componentizacao do cabecalho (`cac950de`), que apagou o `Header.tsx` e o `RoleIcon.tsx` juntos. Hoje o canto superior direito da tela do dono e a **pilula de status** (ABERTO / PAUSADO / FECHADO), nao um icone. Nao ha icone a substituir. ⚠️ **Nao confundir com o `BenchIcon`**, que segue vivo e e outra coisa: ele fica na tela do **PROFISSIONAL** e e a unica porta pras "Opcoes da fila" (ver DS3). |
| DS3 | **Profissional nao acha onde abrir/fechar a propria fila** | A acao de **dizer que esta trabalhando** (e de abrir/fechar a fila dele) precisa estar **visivel na tela do profissional**. Hoje, de primeira viagem, o profissional **nao descobre por onde** faz isso. | 🎨 Pedido de desenho (Andre, 2026-08-22). **Nao e falta de feature** — a acao existe e funciona; falta **affordance**. Ver "Detalhe — DS3". |
| DS4 | **Poder aumentar e diminuir as fontes** | O usuario precisa conseguir **ampliar ou reduzir o tamanho do texto** do app. | 🎨 Pedido (Andre, 2026-08-22). **Decisao da design antes de codar:** honrar a fonte do sistema ou oferecer controle proprio? E ate onde o layout do Pencil aguenta? **Instrumentado em 2026-08-31** — o app ja honra a fonte do sistema, e sao **duas** primitivas que travam, nao "varias". Ver "Detalhe — DS4". |
| DS5 | **Abas do rodape nao mostram qual esta ativa; o icone de "Menu" ficou estranho** | Ao tocar nas abas do rodape **nao ha destaque** da aba selecionada. Alem disso, o icone de **Menu** ficou estranho. | 🟡 **METADE FECHADA.** A pilula da aba ativa foi codada em 2026-08-26 (Alexia, `85ae773`), com dois testes de regressao — ver "Detalhe — DS5", item 1. **Continua aberto o item 2**: o glifo de Menu (`Grid3x3`) e escolha de arte e espera revisao da design. |

---

## Detalhe — DS1 (CTA do login sobre a barra do aparelho)

**Onde:** `app/(auth)/login.tsx`, linha 64 — `<View className="flex-1 pt-14 pb-8 px-7">`.

**Raiz:** o commit `7170796` (*"feat(login-partner): aplica o Pencil e ancora o CTA no rodape"*) passou a ancorar o botao no fim da tela usando **`pb-8` fixo**. Padding fixo **nao conhece a barra de navegacao** do aparelho: em device com barra por gestos ou por botoes, a altura util muda e o CTA invade a barra. O log do mesmo teste tambem acusou `SafeAreaView has been deprecated` — os dois apontam para o mesmo lugar.

**✅ Corrigido em 2026-08-26 (`85ae773`).** A design confirmou o CTA ancorado, e o padding fixo deu lugar ao inset real via `useSafeAreaInsets()` do `react-native-safe-area-context` (a lib que o proprio warning recomendava): `paddingBottom: Math.max(insets.bottom, 32)`, com o 32 de piso pra tela sem barra nenhuma.

A varredura prevista aqui valeu a pena: o padrao estava em **tres** telas, nao so no login — `login`, `register` e `forgot-password`. O mesmo defeito existia no **app do cliente** (as telas de auth de la vivem dentro do `Tab.Navigator`) e saiu na PR #23 do `vupth`, pelo `BottomTabBarHeightContext`.

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

### Levantamento de 2026-08-31 — o que de fato trava

Feito para a decisao ser sobre desenho, e nao sobre descobrir onde esta o problema. Tudo abaixo se confere com um `grep` no repo.

**1. O app JA honra a fonte do sistema.** `allowFontScaling` nao e desligado em lugar nenhum (`grep -rn allowFontScaling app src` nao retorna nada). Ou seja, a **opcao 1 do DS4 ja esta ligada** — o que ninguem sabe e ate onde o layout aguenta. Nao ha o que codar para "honrar o sistema"; ha o que **medir**.

**2. Sao DUAS primitivas que travam, nao "varias".** Caixa de altura fixa segurando texto que cresce:

| Onde | Altura | O que segura |
|---|---|---|
| `src/components/nw/Button.tsx:51` | `h-[54px]` | o rotulo do botao |
| `src/components/nw/Input.tsx:42` | `h-[50px]` | o texto digitado e o placeholder |

**3. As outras alturas fixas NAO seguram texto** — nao quebram com fonte maior: o avatar `w-[72px] h-[72px]` em `app/(professional)/settings.tsx:167` e o `w-[39px] h-[39px]` do `ButtonGoBack.tsx:11`. Sao caixas de icone/foto.

**4. O padrao certo ja existe no repo.** O `ScreenHeader.tsx` usa `min-h-[44px]` (linha 78) e `min-h-[40px]` (linha 108) — altura **minima**, que cresce quando o conteudo cresce. Trocar `h-` por `min-h-` nas duas primitivas do item 2 e correcao mecanica e **nao depende de decisao nova**; o que depende e o item 6.

**5. A tab bar e o unico ponto com altura verdadeiramente cravada.** Em `app/(owner)/(tabs)/_layout.tsx:28`: `height: 72 + insets.bottom`, com `paddingTop: 8` e `paddingBottom: 8 + insets.bottom` — sobram ~56px para pilula (34) + rotulo (13) + respiro. Ela **soma** o inset do device, mas **nao cresce com a fonte**. E exatamente onde o rotulo ja cortou.

**6. Ha 7 pontos que TRUNCAM em vez de refluir** (`numberOfLines`): `my-day.tsx:207` e `:319`, `reports.tsx:117`, `attendances.tsx:158`, `ServiceTypeGrid.tsx:85`, `ScreenHeader.tsx:98` e `:120`. Com a fonte ampliada eles cortam a frase em vez de estourar a caixa — o que e melhor que quebrar o layout, mas e **perda de informacao silenciosa**.

### O que isto muda no pedido a design

O pedido original ("dizer como **cada** primitiva reflui") era grande porque ninguem tinha contado. Contado, sobra:

- **o teto de ampliacao** que o desenho suporta (ex.: 130%) — segue sendo a pergunta principal, e so a design responde;
- **quais dos 7 pontos podem truncar** e quais precisam quebrar em duas linhas;
- **a tab bar**: cresce junto com a fonte, ou o rotulo some acima de um certo tamanho (padrao que iOS e Android usam)?
- o que **NAO deve escalar** — numero de senha e posicao na fila costumam ser elemento grafico, nao texto.

**Como se verifica este levantamento:** `grep -rnE 'h-\[[0-9]+px\]' --include='*.tsx' app src` para as alturas fixas, `grep -rn allowFontScaling app src` para o item 1, `grep -rn numberOfLines --include='*.tsx' app src` para o item 6. Se os numeros nao baterem, esta secao envelheceu — corrija-a.

---

## Detalhe — DS5 (estado ativo da tab bar e o icone de Menu)

**Sao dois problemas com causas diferentes.**

### 1. Falta destaque — a pilula do Pencil nao foi implementada

O `src/components/TabBarIcon.tsx` **documenta o desenho correto no proprio comentario**: no Pencil, o estado ativo e marcado por **cor** (`$forest` vs `$text-secondary`) **mais a pilula `$green-tint` atras do icone**. O codigo entregue faz **so a cor** — a pilula nunca foi codada. Ou seja: **o desenho esta certo, a implementacao ficou pela metade.**

E a cor sozinha nao da conta, com numero: ativo `#163300` contra inativo `#454745` tem contraste de **1,49:1** entre si. Os dois se leem bem sobre o branco (13,9:1 e 9,4:1), mas sao praticamente **indistinguiveis um do outro** — dois tons escuros. E a mesma armadilha que ja custou retrabalho nesta branch (trocar um verde escuro por outro e achar que a marca chegou): quem olha nao ve diferenca.

**✅ Corrigido em 2026-08-26 (`85ae773`).** A pilula `$green-tint` entrou sob o icone ativo, como o Pencil especifica. Ela **ocupa espaco sempre** (o inativo so nao pinta o fundo), senao a linha de icones pula de altura a cada troca de aba.

Travado por **dois testes**: um mede que os dois tons NAO se separam sozinhos — e por isso a pilula precisa existir —, o outro garante que ela nao suma de novo.

Segue em aberto, se a design quiser: reforcar ainda mais o ativo (peso do rotulo, indicador superior). Nao e pendencia, e opcao.

### 2. O icone de Menu e escolha de arte, e ela precisa ser revista

O glifo hoje e o **`Grid3x3`** do `lucide` — uma grade de 9 quadrados. Ele **nao e aproximacao nossa**: veio do commit `1d441a2` (*"usa os icones exatos do Pencil (lucide), nao aproximacao"*), lido do proprio arquivo de design. Entao a revisao e **da design**, nao do front.

**Por que estranha:** grade de quadrados e a convencao de **"todos os apps / launcher / dashboard"**, nao de "menu". O vocabulario que o usuario reconhece para menu e o hamburguer (`Menu`) ou as reticencias (`Ellipsis` / `MoreHorizontal`). Vale notar que esta mesma aba **ja deu problema de rotulo cortado** em device real (commit `89f1678` da propria entrega) — e a aba do rodape que mais pediu conserto ate agora.

---

## Nota de contexto — o erro de push no Expo Go NAO e da entrega da design

Ao rodar a branch `design/marca-dev` como entregue (`e76470d`) no **Expo Go**, o app quebra com `expo-notifications: Android Push notifications ... was removed from Expo Go with the release of SDK 53`, em `src/hooks/usePushRegistration.ts:3`.

**Nao e defeito do desenho** e nao ha nada a fazer do lado da design. E uma limitacao do Expo Go desde o SDK 53: o modulo grita **no import**, antes de qualquer tela. O front ja corrigiu isso (carregar o modulo sob demanda, commit `6969ea9`), mas essa correcao **nao esta** na branch da design — ela vive na `design/marca-dev` local do front, junto do merge das duas pontas.

**Consequencia pratica para quem for testar:** rodar o `e76470d` puro em Expo Go bate nesse erro. Testar a partir do merge (que tem **zero diferenca de tela** em relacao a entrega — so acrescenta dois arquivos de teste) mostra o mesmo desenho sem o crash.
