# VUPTH DOCS — onde cada informacao mora, e como saber se ainda e verdade

> **Status:** proposta aberta (2026-08-27). Vale quando as tres equipes concordarem.
> Nada aqui muda codigo — muda **onde se procura** e **quem responde** por cada assunto.

## Por que isto existe

Hoje sao **12 documentos em 3 repositorios**, somando mais de 10 mil linhas. Nenhum
deles e ruim; o problema e que **nao ha regra de qual e a fonte de cada assunto**, e
sem essa regra a informacao se duplica — e copia envelhece em silencio.

Nao e hipotese. Ja aconteceu tres vezes, e todas custaram tempo real:

| o que aconteceu | custo |
|---|---|
| O topo do `PRD_BACKEND` descrevia um `.github/workflows/keep-alive.yml` com toggle. O workflow tinha sido **deletado** meses antes (`363019d`), e ninguem corrigiu a secao. | O Andre tentou "reativar" um keep-alive que nao existia. |
| O **C7** documentava a paleta **teal** (`#00B37E`), abandonada em 2026-07-09. | Se o client tivesse copiado os hexes, entraria com a cor errada — e so apareceria no device. |
| A identidade nova foi aplicada em **55 arquivos de codigo e ZERO documentos**. O que se esperava do client estava dentro de um **comentario de codigo**. | O client so descobriu porque o Andre mandou procurar. |

**A licao comum as tres:** documento que afirma sem dizer **como se verifica** apodrece
sem aviso — e e pior que documento nenhum, porque as pessoas confiam nele.

---

## Regra 1 — uma fonte por assunto. O resto REFERENCIA, nunca repete

| Assunto | Fonte unica | Quem responde |
|---|---|---|
| Identidade visual: tokens, tipografia, cor, espaco, raio | **`DESIGN.md`** | design |
| Regras de UX: hierarquia, bloqueio x vazio, semantica, sombra | **`DESIGN.md`** | design |
| Contrato da API: endpoints, payloads, codigos de erro, WebSocket | **`PRD_BACKEND.md`** | backend |
| Ambientes: URLs, variaveis, canais, o que cada nome significa | **`AMBIENTES.md`** *(a criar)* | backend + fronts |
| Fluxo de trabalho: branches, PR, gate, OTA, deploy, publicacao | **`FLUXO.md`** *(a criar)* | fronts |
| Pendencia de um time para outro | **`HANDOFF_<destino>.md`** do repo que pede | quem pede |
| Decisao de produto (com alternativas e consequencia) | **`DECISOES_*.md`** | Andre |
| Estado e backlog de cada app | **`PRD_FRONT-*.md`** | cada front |

**Como se escreve uma referencia:** *"paleta e tipografia: ver `DESIGN.md` secao 1"* —
e **nunca** copiar o hex para o PRD. Se voce sentiu vontade de repetir o valor, e sinal
de que a fonte esta dificil de achar; conserte a fonte, nao duplique.

## Regra 2 — o que pode virar teste, vira teste

O documento guarda o **porque**. O **que** fica no codigo, verificado por maquina.

Isto ja se provou aqui: o comentario dizendo *"estes tokens precisam bater 1:1"* nunca
pegou nada; o **`brandTokens.test.ts`** pegou o `dangerTint` divergente no merge. Mesma
regra escrita duas vezes — so a executavel funcionou.

Guardas que ja existem e servem de modelo: `brandTokens.test.ts` (tokens 1:1, contraste,
fontes declaradas x carregadas) e `webConfig.test.ts` (as pecas do build web).

## Regra 3 — todo documento diz COMO SE VERIFICA

Cada secao que afirma um fato sobre o sistema termina com a forma de conferir:
um comando, um arquivo com linha, ou um teste.

> ❌ *"Existe um keep-alive rodando a cada 14 min."*
> ✅ *"Existe um keep-alive: confira `.github/workflows/keep-alive.yml`. Se o arquivo
> nao existir, esta secao esta MENTINDO — corrija-a."*

A segunda forma teria evitado o caso do keep-alive.

## Regra 4 — numero e estavel, nome e a chave

Os nossos identificadores (**S**, **C**, **DS**) **nunca sao renumerados**, entao podem
ser citados por numero. Os itens do backlog do backend **sao** renumerados a cada
reorganizacao — ao cita-los, use o **NOME**, com o numero no maximo como pista datada.
*(Convencao acordada em 2026-07-22 e reforcada em 2026-08-11.)*

## Regra 5 — documento compartilhado nao mora dentro de um app

O `DESIGN.md` vale para **os dois** fronts, mas hoje vive so no partner. Foi assim que o
client ficou com a paleta velha. Enquanto for markdown num repo so, o outro time sempre le
uma copia atrasada.

**Alvo:** os tokens viram **pacote versionado** que os dois apps importam — `import { tokens }`
e imposto pelo build; *"consultar o DESIGN.md"* depende de disciplina. Enquanto o pacote nao
existe, o **VUPTH DOCS** e a ponte: um lugar so, publicado, que le a versao viva de cada repo.

---

## O site: VUPTH DOCS

Um site estatico, publicado no Cloudflare Pages, que **agrega** os documentos dos tres
repositorios. Ele **nao guarda conteudo proprio** — se guardasse, viraria a 13a copia
para envelhecer. Cada pagina e gerada a partir do arquivo vivo no repo de origem, com
o commit de onde veio.

**O que ele resolve, na pratica:**

1. **Um link so.** Hoje, para entender o sistema, e preciso ter os tres repos clonados.
2. **A data de cada coisa fica visivel.** Cada documento aparece com o commit e a data
   da ultima alteracao — "atualizado ha 40 dias" e um aviso que markdown solto nao da.
3. **Quem le nao precisa saber onde mora.** A busca e por assunto, nao por repositorio.

**Primeira versao (proposta):** indice navegavel + a regra de roteamento acima + os
documentos de design e ambientes, que sao os que os dois fronts consultam todo dia.
O resto entra por demanda.

---

## O que falta decidir (as tres equipes)

1. **Onde o VUPTH DOCS mora** — repositorio proprio, ou dentro de um dos tres? *(Sugestao:
   proprio, pela Regra 5.)*
2. **`AMBIENTES.md` e `FLUXO.md`** — quem escreve a primeira versao de cada.
3. **`DESIGN.md` compartilhado** — ele ja existe no partner e e bom. Vira a fonte dos dois
   fronts hoje, ou espera o pacote de tokens?
4. **Decisao vira ADR?** Um arquivo por decisao, imutavel, com "superada por". O Andre ja
   faz isso na pratica com D1..D9 — falta so a forma.
