# O que precisamos do design para atualizar as telas

> Contexto: o canvas com as telas novas (splash, onboarding, login social, dashboard
> do dono, fila do cliente, notificações…) **não está no repositório** — nem os
> frames, nem o arquivo-fonte. Hoje o código tem só a camada de cor e fonte da
> marca; a estrutura das telas ainda é a antiga. A lista abaixo é o que falta para
> implementar **sem adivinhar**.

---

## 1. Os frames, exportados e versionados · **prioridade máxima**

**PNG de cada tela** (2x), com o nome que já aparece no canvas:
`CLIENT-01-splash.png`, `CLIENT-03-login.png`, `OWNER-01-dashboard.png`,
`PARTNER-05-recuperar-senha-codigo.png` e assim por diante.

Eles entram na pasta `design/` do repositório. A razão é concreta: **duas vezes já
perdemos tempo** porque a informação de design vivia fora do código — a paleta teal
antiga ficou meses no documento errado, e a semana passada implementamos a marca a
partir de comentários em vez do desenho. Frame versionado é referência conferível.

Se der para exportar o arquivo-fonte em **PDF** também, melhor ainda — dá para ler
medidas.

## 2. A tabela de tokens, com o PAPEL de cada cor

Não só os hexes, mas **onde cada um entra**. Já temos estes e queremos confirmação:

| Token | Hex atual | Papel que assumimos |
|---|---|---|
| `brandGreen` | `#9FE870` | fundo de ação (nunca texto) |
| `forest` | `#163300` | texto e estrutura sobre claro |
| `greenTint` | `#E2F6D5` | realce suave, chips |
| `surface` | `#F3F5F1` | fundo de bloco |
| `danger` | `#B3261E` | erro e ação destrutiva |

**Faltam:** os acentos (pêssego, azul, rosa, ameixa) — em que situação cada um
aparece? E o **verde-escuro do botão "Mudar minha vez"** na tela da fila: é o
`forest` ou um tom próprio?

## 3. Tipografia: a escala, não só a família

Sabemos que é **Archivo** em títulos e **Inter** no corpo. Falta a **hierarquia**:
tamanho e peso de cada nível — título de tela, título de card, corpo, legenda,
botão — e o que rege os **números grandes** (o "2 pessoas na frente" ocupa a tela
inteira; isso é um estilo próprio?).

## 4. Medidas dos componentes

Raio de canto por tipo (card, chip, botão, input), altura do botão, espaçamento
entre blocos. Sem isso cada tela sai com um valor diferente e a diferença aparece
quando se navega entre elas.

## 5. Estados — o que o canvas não mostra

Os frames mostram o caminho feliz. Para implementar precisamos de cada componente
**desabilitado, carregando e pressionado**; input em **foco e com erro**; e, para
cada lista, os estados **vazio, carregando e com falha**. Hoje o app tem esses
estados; se o desenho não os cobre, vamos improvisar e desalinhar.

## 6. Ícones: qual biblioteca

Os ícones do canvas parecem de um conjunto específico. Precisamos do **nome da
biblioteca** (Phosphor, Lucide, outra) ou dos **SVGs**, e de qual ícone vai em cada
item. Ícone escolhido "parecido" é a fonte mais silenciosa de divergência entre os
dois apps.

## 7. O texto exato

A microcópia do canvas é boa e específica ("PODE FECHAR O APP", "Avisamos quando
faltarem 2 pessoas", "Mostrando a última posição confirmada"). Queremos **o texto
em arquivo**, não transcrito de imagem — transcrição gera erro de acento e
abreviação, e esses textos são parte do produto.

## 8. ⚠️ O mais importante: o que é NOVO e o que é reskin

Vários frames não são "a mesma tela repintada" — são **funcionalidade que não
existe**. Precisamos que o design (ou você) marque cada tela como
**redesenho visual** ou **comportamento novo**. Estes chamaram atenção:

- **Login com Google e Apple** → muda a autenticação inteira, precisa de backend
- **"Encerrar o dia"** e **"Pausar entrada"** no dashboard → ações que não existem
- **Abas Início / Filas / Menu** para o dono → navegação nova
- **"Falta 1 passo para abrir — 2 de 3"** → o checklist existe, a barra de progresso não
- **Agendamentos** e **Pedidos de troca** na tela do cliente → dependem de backend
  (INTENTION e swap-offers) que ainda não têm UI
- **Onboarding de 3 telas com fotografia** → telas novas, e as fotos precisam vir junto
- **"Sem conexão · há 2 min"** na fila → estado de WebSocket caído, desenhado

Sem essa marcação, olhar o canvas dá a impressão de que falta pouco — e não falta.

## 9. Ordem de implementação

Quais telas primeiro. Nossa sugestão é começar pelo que o usuário vê primeiro
(splash, onboarding, login, cadastro) e depois as duas telas de trabalho (fila do
profissional e dashboard do dono).

## 10. A logo

Está pendente desde a semana passada: o **SVG original** da marca. O PNG que temos
borra as linhas de velocidade em tamanho de ícone (22px), e o vetor que desenhei é
aproximação. Com o SVG, o ícone do menu fica fiel.

---

### Resumo do essencial

Se vier só uma coisa, que sejam os **PNGs dos frames em `design/`**. Se vierem
duas, some a **marcação do item 8** (novo vs reskin). Com essas duas, conseguimos
planejar de verdade; o resto refina.
