# Ficha da Play Store — VUPTH Parceiros (rascunho)

Rascunho para o Andre revisar (Evolução, Degrau 1 · item 4). Nada foi enviado ao
Google. As respostas da Segurança dos dados saem do código (commit `3bf48a1`).

## Identidade

- **Nome do app (30):** VUPTH Parceiros
- **Pacote:** `com.vupth.partner`
- **Categoria:** Empresas (alternativa: Beleza)
- **Tags:** agenda, fila, barbearia, salão, manicure
- **E-mail de contato:** ❓ o Andre decide (a política diz "sem e-mail de contato"; a Play exige um)
- **Política de privacidade:** ❓ URL da página legal do Client (`/privacidade`)
- **Responsável:** ❓ empresa (CNPJ) ou pessoa física — ver pergunta do orquestrador (bcf7978)

## Descrição curta (até 80)

> Fila e agenda do seu salão ou barbearia, em tempo real, no celular.

(69 caracteres)

## Descrição longa (até 4000)

> O VUPTH Parceiros é o app do profissional e do dono do estabelecimento.
>
> Para o profissional:
> • Veja a sua fila em tempo real e inicie o próximo atendimento com um toque.
> • Aceite ou recuse pedidos de encaixe, inclusive para outro dia.
> • Monte os seus serviços, preços e tempos.
> • Defina a sua agenda da semana e as datas especiais.
> • Marque intervalos e refeições sem perder a fila.
> • Acompanhe o seu dia e os seus relatórios.
>
> Para o dono:
> • Cadastre a loja, o endereço e o horário de funcionamento.
> • Convide profissionais e aprove os pedidos de vínculo.
> • Veja as filas de todos, os atendimentos e os relatórios da loja.
> • Compartilhe o link da loja para os clientes entrarem na fila.
> • Passe a posse da loja para alguém da equipe quando quiser.
>
> Os clientes usam o app VUPTH para entrar na fila ou agendar. Você recebe tudo
> na hora, com aviso no celular.
>
> Você pode desativar a conta (e voltar quando quiser) ou excluí-la a qualquer
> momento, pelo próprio app.

## Prints (telefone, 1080×2400)

1. Fila do profissional com clientes e o "Iniciar próximo"
2. Pedido de encaixe com Aceitar / Recusar
3. Meus serviços (preço e tempo)
4. Minha agenda (a semana)
5. Início do dono (fila agora, profissionais ativos, "Abrir estabelecimento")
6. Relatórios do dia
7. Compartilhar o link da loja

A bateria Maestro já tira prints das telas (pasta `para-o-andre/`); dá para reaproveitar.

## Segurança dos dados (formulário)

**O app coleta ou compartilha dados?** Sim, coleta. **Não compartilha** com terceiros
(não há SDK de anúncios, de análise ou de erro; o push passa pelo Expo/Firebase só
para entregar o aviso).

**Criptografia em trânsito:** sim (HTTPS em todas as chamadas).
**O usuário pode pedir a exclusão:** sim — no app (Dados da conta → Conta → Excluir)
e pelo link de exclusão na web.

| Tipo de dado (Play) | Coleta? | Obrigatório? | Para quê | De onde, no código |
|---|---|---|---|---|
| Informações pessoais → Nome | sim | sim | Funcionalidade do app (o cliente vê quem atende) | cadastro do profissional, Dados cadastrais |
| Informações pessoais → E-mail | sim | sim | Gerenciamento da conta (login, código de senha) | login e cadastro |
| Informações pessoais → Telefone | sim | **não** (opcional) | Funcionalidade do app (o cliente vê o contato) | Dados cadastrais → Telefone de contato |
| Fotos e vídeos → Fotos | sim | não | Funcionalidade do app (foto de perfil e da loja) | `expo-image-picker` (galeria ou câmera) |
| Local → Local exato | sim | não | Funcionalidade do app (ponto da loja no mapa) | `expo-location`, só em primeiro plano, só ao marcar o endereço |
| Informações financeiras → Outras | sim | sim | Funcionalidade do app (preços e relatórios de receita) | serviços e relatórios (não há cartão nem conta bancária) |
| Atividade no app → Outras ações | sim | sim | Funcionalidade do app (fila, atendimentos, agenda) | backend |
| IDs do dispositivo → Outros IDs | sim | não | Funcionalidade do app (aviso no celular) | token de push do Expo |

**Não coleta:** contatos, SMS, áudio, calendário, histórico de navegação, CPF,
data de nascimento, local em segundo plano, registros de erro (não há Sentry/Crashlytics).

## Classificação de conteúdo (questionário IARC)

- Categoria: **Utilitário, produtividade, comunicação ou outro**
- Violência, sexo, linguagem, drogas, apostas: **não**
- Interação entre usuários: **não** há chat; o cliente só vê nome, foto e telefone (opcional) do profissional
- Compartilha o local do usuário: **não** com outros usuários (só o endereço da loja, que é público)
- Compras digitais: **não**
- Resultado esperado: **Livre (L) / Everyone**

## Público-alvo

- **18 anos ou mais** (é app de trabalho; não é para crianças)

## Perguntas ao Andre

1. Categoria: Empresas ou Beleza?
2. E-mail de contato da ficha (a Play exige um, mesmo com a política sem e-mail)
3. Conta da Play: organização (CNPJ) ou pessoa física?
4. URL final da política de privacidade
