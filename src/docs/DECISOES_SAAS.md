# Virar SaaS — as perguntas que precisam de resposta antes do código

> **Para:** André
> **De:** front (partner + client)
> **Data:** 2026-08-24
> **Status:** 🟡 **respondido em 2026-08-25** — 4 de 7 fechadas, 2 abertas, 1 reencaminhada

Este documento nasceu do pedido *"o cliente poder ser dono de estabelecimento e
vice-versa"* somado à meta de virar SaaS. Ao levantar o que o código suporta,
apareceu um fato que muda a ordem das coisas — e é por ele que o documento
começa.

---

## ✅ Respostas do André (2026-08-25)

| # | pergunta | resposta |
|---|---|---|
| 1 | Quem paga | **Não haverá assinatura.** Receita é **taxa por atendimento + multa**; o profissional escolhe absorver ou repassar, na tela em que cria o serviço. |
| 2 | Modelo de papel | **OWNER e PROFESSIONAL também são CLIENT**, por definição — e o cliente pode virar OWNER/PROFESSIONAL. O acúmulo vale **nos dois sentidos**. *(Fecha o **S23**.)* A escolha formal do modelo (booleano × vínculo) segue no **S32**. |
| 3 | Multi-loja | **Está para ser feito.** |
| 4 | Revogação | ⬜ **em aberto** — o enunciado não ficou claro. Reescrito com casos concretos no **S33**. |
| 5 | Área administrativa | Era ambiguidade de nome: vira um **app administrativo separado**, não uma área dentro do app do parceiro. |
| 6 | Apagar conta (S19) | **Já está na lista dele.** |
| 7 | Hospedagem | Vai **medir a hibernação no Render primeiro, depois no Railway**, para comparar. Por isso o merge do PR #18 espera a 1ª medição. |

### O que a resposta 1 muda — e o que não muda

Sem assinatura, **o argumento do S32 caiu, mas a conclusão não.** As respostas 2 e 3
substituem o fundamento por outro mais forte: no instante em que existir a
segunda loja, `"é OWNER"` deixa de responder **de qual loja**; e a taxa por
atendimento nasce de um atendimento, que acontece **numa loja**, absorvido ou
repassado pelo profissional **daquela** loja. O S32 foi reescrito sobre esse
fundamento em 2026-08-26.

### O que a resposta 1 agrava

A multa deixou de ser "aviso sem consequência" e passou a ser **receita
declarada**. O app anuncia R$ 3,00 em três ações e o backend nunca cobra — não
é mais só promessa vazia, é **receita que o produto anuncia e não arrecada**.
O André não disse "implementar agora", então segue **item aberto**.

---

## O fato que gerou este documento: a Vupth nunca moveu um centavo

Não é figura de linguagem. Varrendo os quatro repos e todos os docs:

- **zero endpoints** de pagamento, cobrança, assinatura, fatura ou plano;
- a palavra **"assinatura"** aparece 5 vezes nos docs e **nenhuma** é de
  assinatura paga — todas são assinatura de WebSocket;
- **"plano pago"** é o plano do **Render**, de hospedagem;
- a decisão de **2026-06-28** — *"implementar TODO o restante, EXCETO o meio de
  pagamento"* (Stripe/Pagar.me adiado) — **nunca foi revista**.

Não é crítica: foi decisão consciente e provavelmente certa na época. Mas
significa que a camada de dinheiro do SaaS começa do zero, e isso muda a
estimativa de qualquer plano.

### ⚠️ Risco vivo, independente do SaaS

O app **anuncia ao cliente** a multa de R$ 3,00 ao sair da fila perto da vez —
em três ações (sair, reagendar, ir para o fim). O backend **nunca cobra**:
*"falta só o backend efetivar o strike/cobrança"* (HANDOFF_BACKEND, S/D2).

Prometer uma cobrança que não acontece corrói confiança nos dois sentidos: o
cliente aprende que o aviso é blefe, e o profissional continua levando o
prejuízo do furo. **Isso precisa de decisão antes do SaaS** — cobrar de fato,
ou tirar o aviso.

---

## As perguntas, na ordem em que se destravam

### 1. Quem paga?

**A pergunta:** a receita vem do **dono** (assinatura por loja) ou do **cliente
final** (taxa por atendimento)? Ou os dois?

**Por que vem primeiro:** ela decide o modelo de dados, não só o preço. Se quem
paga é a loja, a unidade de cobrança é o estabelecimento e o papel precisa de
escopo. Se quem paga é o cliente, o dinheiro entra por outro caminho e a loja
pode continuar de graça.

**Custo de responder errado:** as perguntas 2 e 3 são derivadas desta. Responder
2 e 3 antes de 1 é refazer.

---

### 2. Papel continua sendo da PESSOA, ou vira vínculo pessoa↔loja?

**O que existe hoje:** o JWT carrega `roles: string[]`. Papel nasce como
**efeito** de criar a entidade (`/establishment/quick-create` → OWNER;
`/professional/quick-create` → PROFESSIONAL) e entra no token no
`refreshToken()` seguinte. **Não há endpoint que conceda nem que revogue
papel**, e o token **não diz em que contexto a pessoa está agindo** — quem
acumula os papéis abre todas as áreas ao mesmo tempo.

**O problema:** assinatura e cobrança não perguntam *"quantos papéis essa pessoa
tem"*. Perguntam *"quem tem qual papel em QUAL loja, e sob qual plano"*. A
primeira é por pessoa e booleana; a segunda é por loja e graduada.

**A pergunta:** o modelo continua `User → {Client, Professional, Owner}` (um de
cada, sem escopo), ou vira **vínculo pessoa↔estabelecimento** (N vínculos, cada
um com papel e status)?

**Custo de responder errado:** espalhar o modelo de hoje por mais uma UI custa
refazer quando a cobrança entrar. É por isso que o front **não está codando** a
troca de papel nova antes desta resposta.

---

### 3. Um dono poderá ter mais de uma loja?

**O que existe hoje:** `establishment_id` é singular em todo o estado do app.

**Por que perguntar agora:** dono com duas unidades é o caso normal em SaaS de
barbearia/salão. Se a resposta for sim, o token precisa de escopo — ou o
backend resolve tudo por `establishmentId` no path, e o app precisa de um
seletor de loja em todo lugar.

---

### 4. Papel poderá ser REVOGADO?

**O que existe hoje:** não há caminho. Nenhum endpoint de revogação (grep
vazio). Quem virou dono é dono para sempre.

**A pergunta:** o que acontece quando a assinatura vence, ou quando um
funcionário sai? A loja fecha para clientes? Vira somente-leitura? O papel some?

**Por que importa:** sem revogação não existe inadimplência — e sem
inadimplência não existe assinatura.

---

### 5. Quem, na Vupth, atende o cliente pagante?

**O que existe hoje:** nada. Não há área administrativa, back-office nem
qualquer tela interna. Ninguém consegue ver uma conta, suspender, estornar ou
investigar.

**Por que importa:** enquanto o app é gratuito, "não deu certo" é frustração.
Com assinatura, vira ticket — e alguém tem de conseguir responder. **Em SaaS
isso não é opcional, é o suporte.**

---

### 6. Apagar conta (S19) — hoje é exigência de loja, com SaaS vira contrato

**O que existe hoje:** aberto desde 2026-08-05, sem endpoint.

**O que muda:** hoje é exigência da App Store e da Play Store. Quando o
estabelecimento passar a **pagar** para processar dado de cliente através de
vocês, ele vira operador de dados sob contrato — e a exclusão deixa de ser um
item de loja para virar cláusula.

---

### 7. Infra: o backend hiberna

**O que existe hoje:** free tier do Render, com ~35s na primeira requisição
depois de hibernar. O app já mascara isso com um portão de readiness, e o
próprio PRD registra a saída (Render Starter, ~US$ 7/mês).

**Por que entra nesta lista:** cliente pagante não aceita 35s. É o item mais
barato de todos e não depende de nenhuma decisão de modelo.

---

## O que dá para começar sem esperar resposta

- **Item 7 (hospedagem)** — não depende de nada.
- **O risco vivo da multa** — decidir cobrar ou tirar o aviso. Tirar o aviso é
  uma linha; cobrar depende do item 1.
- **Item 6 (apagar conta)** — já é exigência hoje, independente de SaaS.

## O que NÃO precisa ser refeito

O produto. Autenticação multi-papel, o trilho de ganhar papel (`criar entidade
→ refresh → papel novo no JWT`, funcionando em 4 pontos), fila em tempo real,
os dois apps e a identidade visual. **SaaS aqui não é reescrever o Vupth** — é
montar a camada de dinheiro e de tenancy em cima do que já roda.

---

## Ligações

- **S32** (HANDOFF_BACKEND) — o modelo de papel, versão técnica da pergunta 2.
- **S31** (HANDOFF_BACKEND) — 403 por papel e por propriedade chegam iguais no
  app; vira rotina quando papel valer dinheiro.
- **S23** (HANDOFF_BACKEND) — `CLIENT → OWNER` é suposição, não fato provado. É
  sim/não e está aberta desde 2026-08-05.
- **S19** — apagar conta.
