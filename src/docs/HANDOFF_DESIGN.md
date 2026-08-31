# Handoff Front-Partner -> Design (almarr-cyber)

Itens levantados no **QA de device** do app partner cuja decisao pertence a **equipe de design**: desenho de tela, hierarquia, iconografia e affordance. Registrados aqui para alinhamento — o front nao muda desenho por conta propria.

Ultima atualizacao: 2026-08-31 · branch `design/marca-dev` do front-partner.

> **Estado da rodada de 22/08:** DS1, DS2, DS3, DS4 e a metade de codigo do DS5 fechados. **Aberto e esperando a design: so o glifo de Menu do DS5.** O DS3 e o DS4 tem desenho pronto; o que sobrou dos dois nao e decisao de design — e uma pergunta de modelo para o backend (DS3) e a escala dos icones (DS4).

> **Direcao do documento.** Aqui vai o que o front PEDE ou APONTA para a design. O caminho inverso (o que a design pede ao front) esta em `design/PEDIDO_DESIGN.md` e `design/PEDIDO_PARA_IA_DESIGN.md`.

> **Prefixo `DS`, e nao `D`.** O `D` ja esta ocupado pelas **DECISOES de produto** (D1..D9) no topico 9-A do `PRD_FRONT-PARTNER.md` — usar `D` aqui criaria duas listas com o mesmo nome. Como nos handoffs `S`/`C`, **os numeros `DS` sao estaveis**: nunca renumeramos, entao podem ser citados por numero com seguranca.

> **Origem desta rodada.** Teste manual do Andre em **Expo Go** (2026-08-22) sobre a entrega da design em `origin/design/marca-dev` (`e76470d`, 25 commits do Pencil).

---

| # | Item | Descricao | Justificativa / status |
|---|------|-----------|------------------------|
| DS1 | **CTA "Entrar" do login cai sobre a barra do aparelho** | Na tela de login o botao de entrar ficou **por cima dos botoes de navegacao do dispositivo** (barra inferior do Android). Ver "Detalhe — DS1". | ✅ **FECHADO em 2026-08-26 (Alexia, `85ae773`).** A design confirmou o CTA ancorado, e o `pb-8` fixo deu lugar ao inset real (`Math.max(insets.bottom, 32)` — o 32 e o piso pra tela sem barra nenhuma). Estava em **tres** telas, nao so no login: `login`, `register` e `forgot-password`. O gemeo no app do cliente saiu depois, na PR #23 do `vupth`. |
| DS2 | **Icone do canto superior direito na tela do proprietario e PROVISORIO** | O icone que aparecia no canto superior direito da tela do dono ("banco") era **apenas um icone de fila**, quebra-galho do Andre — nao escolha de arte. | ✅ **FECHADO em 2026-08-26 (Alexia).** Ele **ja tinha saido** na componentizacao do cabecalho (`cac950de`), que apagou o `Header.tsx` e o `RoleIcon.tsx` juntos. Hoje o canto superior direito da tela do dono e a **pilula de status** (ABERTO / PAUSADO / FECHADO), nao um icone. Nao ha icone a substituir. ⚠️ **Nao confundir com o `BenchIcon`**, que segue vivo e e outra coisa: ele fica na tela do **PROFISSIONAL** e e a unica porta pras "Opcoes da fila" (ver DS3). |
| DS3 | **Profissional nao acha onde abrir/fechar a propria fila** | A acao de **dizer que esta trabalhando** (e de abrir/fechar a fila dele) precisa estar **visivel na tela do profissional**. Hoje, de primeira viagem, o profissional **nao descobre por onde** faz isso. | 🟢 **DESENHO FECHADO em 2026-08-31, pronto para codar.** A pilula do status entrou em 26/08 (`85ae773`); o abrir/fechar fila **nao existia nem no desenho** — nao era falta de implementacao. Tres telas desenhadas e as quatro decisoes tomadas. **Sobra uma pergunta, e ela e de BACKEND**, nao de design: ver "Detalhe — DS3". |
| DS4 | **Poder aumentar e diminuir as fontes** | O usuario precisa conseguir **ampliar ou reduzir o tamanho do texto** do app. | 🟢 **DECIDIDO em 2026-08-31.** O app **ja honra** a fonte do sistema — controle A-/A+ proprio esta descartado. Regua: WCAG 1.4.4, texto a **200%**. Duas telas medidas: a 130% passa inteiro; a 200% passa depois de tres correcoes (chave em linha propria, tab bar sem rotulo, aviso em duas linhas). **Sobram dois itens, e o segundo e de codigo/backend:** ver "Detalhe — DS4". |
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

### Estado em 2026-08-31

**(a) e (b) fechados.** A pilula do proprio status entrou no `85ae773`: fica no cabecalho, mostra `Trabalhando` / `Intervalo` / `Fora` e abre um seletor curto ao toque — seletor, e nao ciclo, porque "Fora" tem consequencia (sendo o ultimo, fecha a loja) e num ciclo ela ficaria a dois toques distraidos de distancia.

**(c) continua aberto — e a causa nao era a implementacao.** Fui conferir o arquivo de design e **o controle de abrir/fechar fila nao esta la**. A tela `PROF · 01 Fila` tem a pilula de status e nada mais; o conceito so aparece em tres lugares, nenhum deles na tela do profissional:

| Onde | Como aparece |
|---|---|
| `ANTIGO · Partner Fila` | switch "Aceitando novos" — com rotulo errado sobrando (`1 · Aneka Silva`), herdado de quando o frame foi duplicado de uma linha de fila |
| `OWNER · 01 Dashboard` | botao "Pausar entrada" |
| `Q — Configuracoes Parceiro` | linha "Aceitando clientes" |

Ou seja: **o front nao deixou de implementar — nao havia o que implementar.** A frase "a acao existe e funciona, falta affordance" valia para (a) e (b), nao para (c).

### Proposta desenhada (2026-08-31)

Tres telas novas no arquivo de design — `PROF · 01 Fila · DS3 (aceitando clientes)`, `(fila fechada)` e `(fila pausada)` — com a `Nota DS3` ao lado. A disposicao e em **quatro linhas**:

1. **status a esquerda, reticencia a direita** — a faixa do que e do profissional;
2. **titulo** `Sua fila`, ocupando a linha inteira;
3. **a chave da fila**, em linha propria;
4. os numeros da fila.

Os dois controles ficam em **linhas diferentes**, entao nao dependem de cor para nao lerem como um botao so — a separacao e estrutural.

> **A chave comecou na linha do titulo, e saiu de la por causa do DS4.** Ela nao encolhe, e como o titulo e `flex-1` com `numberOfLines={2}`, quem cede espaco e sempre o titulo: com a fonte do sistema a 130% ele ja virava duas linhas, e a 200% uma coluna de letras. Em linha propria, o titulo cabe numa linha nos dois tamanhos. **Quem for reaproximar as duas coisas um dia, leia o DS4 antes.**

**Os dois sao clicaveis, e por isso precisam ser controles de tipos diferentes:**

- **status** — chip de cor + chevron. Vocabulario de ESCOLHA: toca, abre lista, tem tres respostas. O chevron entrou porque nada dizia que a pilula abre alguma coisa.
- **chave da fila** — trilho + knob. Vocabulario de INTERRUPTOR: toca, vira, tem duas.

⚠️ **A chave nao pode usar cor de acento.** A pilula de status ja fala por cor e ocupa tres: `brand-green` = Trabalhando, `#FFC091` = Intervalo, `danger` = Fora. Uma chave em pessego diria "Intervalo" na mesma tela. Por isso ela vive no eixo forest/neutro: aberta e trilho escuro com knob claro a direita; fechada e trilho `surface` com contorno, knob e texto em `text-secondary`, knob a esquerda.

A tela "fila fechada" mostra de proposito o cruzamento que este handoff alertava: **Trabalhando + Fila fechada ao mesmo tempo**, com a linha de apoio trocando para a consequencia ("ninguem novo entra") e o rodape confirmando que o profissional segue atendendo quem ja entrou.

### Decisoes da design — 2026-08-31

1. **Confirmacao assimetrica**, igual ao que a tela de opcoes ja faz: **fechar pergunta** e explica a consequencia; **reabrir e imediato**, por ser acao inofensiva.
2. **Vocabulario: "Aceitando clientes" · "Fila fechada" · "Fila pausada".** Sai o par "Aberta/Fechada": ele colidia com o `ABERTO / PAUSADO / FECHADO` da **loja** na tela do dono — mesmas palavras para sujeitos diferentes, e os dois se cruzam de verdade (fechar a fila do ultimo profissional fecha a loja).
3. **Titulo: "Sua fila".** O app publica `"Fila"` — quem alinhar, alinhe o codigo com o desenho, nao o contrario.
4. **O chevron na pilula de status fica.** Ela e clicavel desde 26/08 e nada na tela dizia isso.

### O sistema que essas decisoes criaram

A chave passou a ter **dois canais**, cada um dizendo uma coisa:

- **posicao do knob** = `accepting_new`, que e o que a chave de fato controla — direita aceita, esquerda nao;
- **cor** = o estado **efetivo** da fila, herdado do status quando ele importa.

| Tela | Status | Chave | Leitura |
|---|---|---|---|
| `(aceitando clientes)` | Trabalhando | trilho forest, knob `brand-green` a direita | aceitando |
| `(fila fechada)` | Trabalhando | trilho `surface` com contorno, knob a esquerda | nao aceitando |
| `(fila pausada)` | Intervalo | trilho `accent-peach`, knob a direita | aceita, mas voce esta em intervalo |

Isto **corrige o alerta anterior** de que a chave nao podia usar cor de acento: ela **pode** usar pessego — desde que pessego signifique *Intervalo*, que e exatamente o que ele significa na pilula de status. O erro seria pessego significando outra coisa.

⚠️ **Falta confirmar, e e a unica coisa que sobrou:** *"Fila pausada"* aqui e **derivado**, nao um terceiro estado da fila. Hoje `accepting_new` e binario e `ON_BREAK` e so rotulo de status — nao toca na fila. Entao essa tela e **exibicao**: com o status em Intervalo, a chave mostra o que a fila *parece*, sem nada mudar no backend. **Se a intencao for que Intervalo de fato PARE a entrada de gente nova, isso e mudanca de modelo** e vira pedido para o backend, nao trabalho de front.

**Como se verifica:** abrir o arquivo de design e procurar as tres telas `PROF · 01 Fila · DS3`. Se elas nao existirem mais, esta secao esta desatualizada.



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

### Decisoes da design — 2026-08-31

**A regua e a norma, nao um numero a dedo.** Sendo acessibilidade, o alvo e a **WCAG 1.4.4**: texto a **200%** sem perda de conteudo ou funcao. Por isso duas telas desenhadas, `DS4 (fonte do sistema a 130%)` e `(a 200%)`, com a `Nota DS4` ao lado.

**O controle A-/A+ dentro do app esta descartado.** O app ja honra a fonte do sistema; um controle proprio seria uma segunda regua concorrendo com a do aparelho. Nao ha o que implementar para "honrar o sistema" — havia o que medir.

| Decisao | O que fica |
|---|---|
| **A chave da fila** | Sai da linha do titulo, vai para linha propria (ver DS3). Era ela que esmagava o titulo. |
| **A tab bar NAO cresce** | Guarda `358x64` sempre. Por volta de **185%**, onde os tabs passariam dos 358, o **rotulo sai e fica so o icone** — o padrao de iOS e Android. Medido a 200% com os rotulos desligados: os tabs caem de **380 para 200** numa barra de 358, com 158 de folga. |
| **O aviso do rodape** | **Quebra em duas linhas**, mantendo a frase inteira e o icone. Encurtar o texto mudaria a copia em *todos* os tamanhos para resolver um problema que so existe no extremo; tirar o icone perderia a marcacao de "isto e um aviso". A 100% a pilula fica **identica a de hoje** (350x42, uma linha); a 200% vira 350x88. |

⚠️ **A tab bar so pode perder o rotulo por causa da pilula do DS5.1.** Sem rotulo, e ela que diz em qual aba voce esta. Se alguem tirar a pilula, este comportamento cai junto.

**Resultado a 200%:** nenhum corte no chrome fixo. A altura total maior que 844 e artefato do mockup — no aparelho o corpo rola.

**O que isso custa, e vale saber:** o chrome passa a comer **450 dos 844** (cabecalho 266 + rodape 98 + tab bar 86), sobrando 394 para o conteudo. O rodape engordou de 67 para 98 por causa da decisao de quebrar em duas linhas. E o preco de manter a frase inteira.

### Ainda em aberto

1. **O que NAO deve escalar.** As telas escalaram tudo de proposito: o relogio (`18:42`) e os numeros de posicao da fila cresceram junto. Sao elemento grafico, nao texto corrido — provavelmente ficam fixos.
2. **Os icones nao escalam com o texto, e isso e maior que uma tela.** A 200% o `info` do rodape segue com 15px ao lado de texto de 26, o chevron do status com 13, as setas da lista, a lupa da busca. Quem precisa de fonte grande costuma precisar de icone grande tambem. **E a mesma classe do problema da tab bar, e provavelmente e conversa com o Andre — nao so decisao de design.**
3. **A area de toque da tab bar sem rotulo:** o conteudo do item fica com 34 de altura. Conferir em device que o toque continua sendo o item inteiro dentro da barra de 64, e nao so o icone.

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

---

## Nota de manutencao — a barra com o wordmark saiu do arquivo de design (2026-08-31)

O app trocou o cabecalho na componentizacao (`cac950de`): hoje o `ScreenHeader` e **uma linha so** — voltar · titulo · acao — e nao existe mais barra com "VUPTH" acima do titulo. O arquivo de design tinha ficado para tras: **nove telas** ainda traziam essa barra.

Corrigidas: `OWNER · 01 Dashboard`, `02 Menu`, `03 Filas`, `04 Onboarding · Loja`, `05 Quem vai atender`, `06 Onboarding · Endereco`, `PROF · 01 Fila`, `02 Encaixes`, `03 Relatorios`.

A correcao foi minima e nao mexeu em nenhum titulo: sai o wordmark, a acao que morava ao lado dele (icone de loja, de perfil, ou a pilula de status) fica sozinha na linha, e a faixa passa a se chamar `Nav` — o mesmo papel que ela ja tem nas telas de login, onde o voltar fica em cima e o titulo vem abaixo.

⚠️ **O wordmark segue, de proposito, em `PARTNER · 02 Login` e `03 Cadastro`.** Ali ele nao e barra de navegacao: e a marca na tela de entrada, dentro do proprio `Head`.

**Como se verifica:** procurar por um texto "VUPTH" de 13px no arquivo de design. Se ele aparecer fora das duas telas de entrada, esta secao envelheceu — corrija-a.
