# DESIGN.md — o sistema, e por que cada regra existe

Vale para os **dois** apps (`vupth` cliente e `vupth-partner`). O arquivo de
design diz isso na propria capa: *"Foundations — compartilhado entre client-app
e partner-app"*.

Cada regra aqui nasceu de um erro que **realmente aconteceu** no codigo, e vem
com ele anotado. Regra sem o erro que ela evita vira decoracao e ninguem segue.

---

## 1. Tokens — os numeros vem da tabela, nunca do uso

Fonte unica: a tabela de variaveis do `.pen` (`GetVariables()` no MCP do
Pencil). **Nao inferir token olhando o que as telas usam.**

> **Erro que isso evita (2026-08-26).** Precisei da escala de texto, nao achei o
> acessador da tabela e deduzi os sete niveis pela moda dos tamanhos usados nas
> 47 telas desenhadas. Errei **os sete**, de 1 a 6px. A causa e circular: as
> telas desenhadas nao seguem a escala — cada um dos 866 textos escreve o numero
> na mao, em 68 combinacoes de tamanho/peso/familia, e os sete tokens aparecem
> exatamente **uma vez cada**, no proprio espécime que os define. Inferir a
> norma a partir de dados que a contradizem so reproduz o desvio.

### Texto

| token | px | peso | familia | letter-spacing | papel |
|---|---|---|---|---|---|
| `text-xxxl` | 34 | 800 | display | −1.5 | Titulo Hero |
| `text-xxl` | 28 | 800 | display | −1 | **Titulo de Tela** |
| `text-xl` | 22 | 700 | display | −0.5 | **Titulo de Secao** |
| `text-lg` | 18 | 500 | body | — | Subtitulo |
| `text-md` | 16 | 400 | body | — | Corpo de texto padrao |
| `text-sm` | 14 | 400 | body | — | Texto secundario / legendas |
| `text-xs` | 12 | 500 | body | — | Rotulos e metadados |

Os nomes sao os do arquivo de proposito: **uma palavra so entre design e
codigo**. `text-base`, `text-2xl` e `text-3xl` ainda funcionam mas estao FORA da
escala — migrar.

> ⚠️ O rotulo do espécime diz "xxl / 700", mas o texto de exemplo esta em 800.
> Seguimos o **exemplo** (800). Vale corrigir o rotulo no arquivo.

### Espaco · Raio

`space` 4 · 8 · 16 · 24 · 32 · 48 (xs → xxl)

`rounded` sm 4 · md 8 · lg 12 · xl 16 · **card 20** · **hero 24** · full 999

`card` e `hero` sao tokens proprios do arquivo, fora da escala sm→xl. Todo
`rounded-card` no codigo (eram 26) e `rounded-card`.

### Cor

A paleta do codigo ja bate 1:1 com a do arquivo. Duas armadilhas na tabela:

1. **Ha uma segunda familia de verdes que NAO e a marca** — `primary #1B4332`,
   `primary-light #2D6A4F`, `accent #52B788`, `error #320707`. Sao restos de uma
   direcao anterior; a pagina Foundations nem os mostra. Usar `$primary`
   entrega um verde que nao e o da marca.
2. **O arquivo especifica MODO ESCURO** — `background`, `surface`,
   `surface-alt`, `primary`, `primary-light`, `text-primary`, `text-secondary` e
   `border` tem par claro/escuro. **Nenhum dos dois apps implementa.** Decisao
   em aberto, ver §6.

---

## 2. Hierarquia

**Titulo nunca menor que o proprio corpo.** Use o componente `Titulo`, que
amarra nivel semantico e tamanho de uma vez.

> **Erro (2026-08-26).** Copiei do bloco "409 AGENDA CHEIA" o par titulo 13/700
> + texto 14. La funciona porque o titulo e um rotulo curto de duas palavras.
> No bloco novo o titulo era uma frase inteira — a manchete saiu menor que o
> proprio texto.

**Um titulo de nivel 1 por tela, e quem entrega e o `ScreenHeader`.** Nenhuma
tela escreve o proprio h1.

**Dois avisos nao se acumulam.** Antes de somar uma faixa a um bloco, verifique
se os dois nao estao dizendo a mesma coisa. Se estiverem, fica o **especifico**
— o que nomeia o passo e leva direto a ele.

> **Erro (2026-08-26).** A Fila mostrava a faixa de prontidao ("Falta 1 passo
> para abrir · 1 de 2") logo acima do bloco que dizia "voce precisa de um
> servico cadastrado". Nessa tela a faixa **so pode** estar cobrando esse mesmo
> passo, porque o outro e pre-requisito para chegar la. Dois cartoes, um fato,
> e o de cima era o mais vago.

---

## 3. Semantica: h1 existe, e nao vem de graca

Antes de 2026-08-26, `accessibilityRole="header"` aparecia **zero** vezes nos
dois apps. No navegador, `h1..h6` e `[role="heading"]` voltavam 0: o titulo da
tela era um `<div>` de 26px. Leitor de tela nao conseguia pular pro titulo.

Use `Titulo`:

| nivel | papel | estilo |
|---|---|---|
| 1 | Titulo de Tela — **so** o `ScreenHeader` | display / `text-xxl` |
| 2 | Titulo de Secao — blocos da tela | heading / `text-xl` |
| 3 | Titulo de item — cartoes e linhas | heading / `text-md` |

⚠️ O `<Heading>` do **Gluestack v1** emite `aria-level` **4 fixo**. As telas que
ainda estao em v1 tem um h4 solto sem h1 acima. Ao migrar uma tela, troque
`<Heading>` por `Titulo`.

⚠️ Na web o Expo Router mantem as telas montadas, entao varios h1 coexistem no
DOM. E limitacao do roteador, nao do componente — no aparelho a acessibilidade
so expoe a tela em foco.

---

## 4. Bloqueio ≠ vazio

Dois estados diferentes, dois tratamentos. Confundir e o erro mais comum.

| | quando | tratamento |
|---|---|---|
| **Bloqueio** | "voce nao consegue usar isto, e este e o passo que destrava" | `accentPeach`, `rounded-card`, **com acao** (`BlocoBloqueio`) |
| **Vazio** | "esta tudo certo, so nao ha nada ainda" | `surface`, calmo, **sem acao** |

Vazio nao ganha botao porque **nao ha o que fazer** — botao ali cobra do usuario
uma coisa que nao depende dele.

> ⚠️ **O arquivo de design nao desenha estado vazio em tela nenhuma** — as 47
> telas estao todas em estado cheio. A referencia de bloqueio e o unico bloco do
> genero que existe ("409 AGENDA CHEIA"). O resto e derivado por esta regra.

---

## 5. Erros mecanicos que ja aconteceram

**Borda da mesma cor do fundo.** Aparece em dois lugares ate agora. Nao desenha
nada — e codigo morto que parece decoracao. Cartao no arquivo e **sem borda**.

**Dois acentos empilhados.** Botao solido de marca dentro de um cartao que ja e
acento. A acao de um bloco de acento e **texto + seta**, nao botao cheio.

**`opacity` derruba o contraste de TUDO,** inclusive do texto que ja passava.
`0.7` numa linha de lista levou o nome da loja a **3.82:1** — reprova o minimo
AA de 4.5:1. `0.8` da 4.92:1. Sempre recalcular depois de aplicar opacidade.

**Cor crua por parametro.** Um `StatCard` que aceita `bg`/`color` deixou entrar
um `$blue50/$blue800` — cor que nao existe na marca. Componente recebe
**variante**, nao cor.

**A escala de cinza do cliente e invertida:** `gray300` (#5C6265) e mais ESCURO
que `gray400` (#B9BBBC). Quem escreve `$gray400` esperando "cinza medio" acerta
1.93:1. Use `$brandTextSecondary`.

**`flex-1 items-center justify-center` dentro de um `ScrollView` nao
centraliza** — o pai e o conteudo, nao a viewport. So joga o texto no meio da
largura e deixa o vazio embaixo.

---

## 6. Em aberto — decisao da equipe de design

1. **Modo escuro.** O arquivo especifica 8 tokens com par claro/escuro. Nenhum
   app implementa. Entra no escopo?
2. **Rotulo "xxl / 700"** no espécime vs o exemplo em 800 — qual vale?
3. **Escala de fonte do sistema** (DS4): teto, refluxo por primitiva, e o que
   nao deve escalar.
4. **`BenchIcon`** (DS3): banco provisorio, unica porta das "Opcoes da fila".
   Banco nao comunica "opcoes".

---

## 7. Como conferir

```
GetVariables()                     # a tabela — fonte dos numeros
grep -rn 'text-\[' app src         # escapes de tamanho
grep -rn 'rounded-\[' app src      # escapes de raio
grep -rn '<Heading' app src        # v1 sobrando: vira Titulo
```

Placar no parceiro em 2026-08-26, depois de escrever este documento:

| | antes | agora |
|---|---|---|
| escapes de raio | 27 | **0** |
| escapes de tamanho | 32 | 32 |
| `<Heading>` v1 | 8 | 8 |

O raio foi varrido junto (era mecanico: os 26 `rounded-[20px]` eram todos
`card`, e o `rounded-[18px]` de um botao 39×39 era `full`). Os outros dois
seguem como divida aberta — tamanho exige decidir o nivel caso a caso, e
`<Heading>` sai junto com a migracao v1→v2 de cada tela.

No navegador, numa tela qualquer:

```js
[...document.querySelectorAll('[role="heading"]')]
  .map(e => [e.getAttribute('aria-level'), e.textContent.trim()])
```

Deve sair **um** nivel 1, e nenhum nivel 4.
