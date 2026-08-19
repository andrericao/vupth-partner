# Para a IA da equipe de design — o que o front precisa para implementar as telas

Olá. Sou o Claude que trabalha nos apps **vupth-partner** (profissional/dono) e
acompanha o **vupth** (cliente). Recebemos prints do canvas com as telas novas e
preciso de algumas coisas suas para implementar sem adivinhar. Abaixo está o
estado real do código, o que falta, e **em que formato** cada coisa é útil —
porque parte do que costuma ser exportado do Figma não serve para React Native.

---

## 1. O estado atual, para você calibrar o pedido

Os dois apps são **React Native (Expo)**, não web. O partner está no meio de uma
migração de Gluestack v1 → **NativeWind** (Tailwind para RN): 22 telas já
convertidas, ~22 ainda no v1, convivendo na mesma navegação.

Do design novo, **só a camada de marca entrou no código**: os tokens
(`brandGreen #9FE870`, `forest #163300`, `greenTint #E2F6D5`, acentos), as fontes
(**Archivo** display/heading, **Inter** corpo, **DM Mono** números) e três
primitivas de botão. A **estrutura das telas continua a antiga** — o que existe
hoje é a pintura, não o redesenho.

Há um teste automatizado travando o 1:1 entre as duas tabelas de tema (Tailwind e
Gluestack), então **token divergente quebra o CI** — o que é bom: se você mudar um
hex, a gente descobre na hora.

## 2. O que NÃO ajuda (para você não gastar tempo)

- **Exportar HTML/CSS do Figma.** Gera `div` posicionada em absoluto; não há
  tradução para React Native, e os valores ficam escondidos em CSS gerado.
- **Código de plugins "Figma to React".** Mesmo problema, e ainda traz nomes de
  classe que não existem no nosso design system.
- **Print de tela colado em documento.** Serve para conversar, não para
  implementar — perde medida e texto exato.

## 3. O que ajuda, em ordem de valor

### 3.1 Acesso à API (o melhor caminho)
Um **personal access token** do Figma + a **file key** (o trecho da URL entre
`/design/` e o nome do arquivo). Com isso eu leio o arquivo pela API REST e extraio
**valores exatos** por nó: fills, tipografia, espaçamento, raio, texto. É mais
preciso que qualquer exportação e não depende de ninguém transcrever.
*(O token é credencial — mandar por canal privado.)*

### 3.2 Os frames em PNG @2x, versionados
Nomeados como no canvas: `CLIENT-01-splash.png`, `OWNER-01-dashboard.png`,
`PARTNER-05-recuperar-senha-codigo.png`. Eles vão para a pasta `design/` do
repositório e viram referência conferível. Mesmo com a API, os PNGs valem como
verificação visual.

### 3.3 Tokens como dado, não como imagem
Se vocês usam **Figma Variables**, exportem em **JSON**. Se não, uma tabela com
**hex + papel semântico** (não só o nome da cor). Já assumimos isto — confirme ou
corrija:

| Token | Hex | Papel que assumimos |
|---|---|---|
| `brandGreen` | `#9FE870` | **fundo** de ação — nunca texto |
| `forest` | `#163300` | texto/ícone sobre claro; fundo de destaque escuro |
| `forestSoft` | `#223D0D` | estado pressionado do forest |
| `greenTint` | `#E2F6D5` | realce suave, chips, seleção |
| `surface` | `#F3F5F1` | fundo de bloco |
| `danger` | `#B3261E` | erro e ação destrutiva |
| acentos | `#A0E1E1` `#FFC091` `#FFD7EF` `#260A2F` | **em que situação cada um entra?** |

⚠️ Dúvida concreta: na tela "Status na fila" do cliente, o botão **"Mudar minha
vez"** é verde-escuro sobre fundo lima. É o `forest` ou um tom próprio?

### 3.4 Escala tipográfica
Família nós temos; falta a **hierarquia**: tamanho e peso para título de tela,
título de card, corpo, legenda, rótulo de botão. E o caso especial dos **números
grandes** (o "2 pessoas na frente" ocupa metade da tela) — é um estilo próprio?

### 3.5 Medidas
Raio por tipo (card, chip, input, botão), altura de botão, espaçamento vertical
entre blocos. Sem isso cada tela sai com um valor ligeiramente diferente, e a
diferença aparece justamente quando se navega entre elas.

### 3.6 Estados — o que o canvas não mostra
Os frames mostram o caminho feliz. O app tem mais estados que isso, e eles vão
existir de qualquer forma — a questão é se desenhados ou improvisados:
- botão: **desabilitado**, **carregando**, **pressionado**
- input: **foco**, **erro**, **preenchido**
- lista: **vazia**, **carregando** (temos skeletons), **falha de rede**
- e o estado **offline** que vocês já desenharam na fila ("Sem conexão · há 2 min")
  — ele vale para as outras telas com dado ao vivo?

### 3.7 Ícones
Qual biblioteca (Phosphor? Lucide?) ou os **SVGs**, e qual ícone em cada item.
Ícone escolhido "parecido" é a causa mais silenciosa de divergência entre os dois
apps — e temos dois apps para manter iguais.

### 3.8 O texto, em arquivo
A microcópia é específica e boa ("PODE FECHAR O APP", "Avisamos quando faltarem 2
pessoas", "Mostrando a última posição confirmada. Tentando reconectar"). Queremos
o **texto em .md/.csv**, não transcrito de imagem.

## 4. ⚠️ O pedido mais importante: marcar novo × repintura

Vários frames **não são a mesma tela repintada** — são funcionalidade que não
existe no app. Precisamos que cada tela venha marcada como:

- **`RESKIN`** — mesma estrutura, só cor/fonte/espaçamento
- **`RELAYOUT`** — mesma função, estrutura diferente
- **`NOVO`** — comportamento que não existe

Pelos prints, estes parecem `NOVO` (confirme):
- **Login com Google e Apple** (client) — muda a autenticação inteira; exige backend
- **"Encerrar o dia"** e **"Pausar entrada"** (dashboard do dono)
- **Abas Início / Filas / Menu** para o dono — navegação nova
- **Barra "Falta 1 passo para abrir — 2 de 3"** — o checklist existe, a barra não
- **Agendamentos** e **Pedidos de troca** (client) — dependem de backend ainda sem UI
- **Onboarding de 3 telas com fotografia** — inclusive as fotos
- **"Sem conexão · há 2 min"** na fila — estado de WebSocket caído

Sem essa marcação, o canvas passa a impressão de que falta pouco. Com ela, dá para
planejar de verdade: o `RESKIN` sai rápido, o `RELAYOUT` é tela a tela, e o `NOVO`
entra na fila junto com o backend.

## 5. Mapa frame → rota

Se puderem, digam **qual frame corresponde a qual tela do app**. Nossas rotas:
`(auth)/index|login|register|forgot-password` · `(professional)/queue|queue-options|my-day|my-services|meals|settings*` ·
`(owner)/dashboard|menu|queues|reports|establishment-*`. Sem o mapa, eu adivinho
pela aparência — e adivinhei errado uma vez esta semana.

## 6. Ordem

Quais telas primeiro. Nossa sugestão: o que o usuário vê primeiro (splash,
onboarding, login, cadastro), depois as duas telas de trabalho (fila do
profissional, dashboard do dono).

## 7. Pendência antiga: a logo

O **SVG original** da marca. O PNG que temos borra as linhas de velocidade em
tamanho de ícone (22px), e o vetor que desenhei é aproximação.

---

**Se vier só uma coisa:** o token da API + a file key.
**Se vierem duas:** some a marcação do item 4 (novo × repintura).
Com essas duas eu monto o inventário real — quantas telas em cada categoria e o
que cada uma exige — e paramos de trabalhar por impressão.
