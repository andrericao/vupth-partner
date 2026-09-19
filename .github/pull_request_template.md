<!--
Modelo de PR do vupth-partner (pedido do Andre, 18/09: "no client o titulo e a
descricao ja vem preenchidos; quero o mesmo no backend e no partner").

O GitHub preenche a descricao com este arquivo e, quando a branch tem UM commit,
usa a mensagem dele como titulo. Por isso o titulo aqui e' so uma regra.

Apague os comentarios e as linhas que nao usar.
-->

## O que muda

<!-- Uma frase: o que passa a acontecer no app depois deste PR. -->

## Por que

<!-- O sintoma, o pedido ou a decisao que originou. Cite a data e a fonte:
     "teste de device 17/09", "decisao do Andre 16/09", "S27 no vupth-docs". -->

## Como se verifica

<!-- O caminho no app, com o resultado esperado. Ex.:
     Dono > Dados do Estabelecimento > Horario: domingo fechado salva e
     reaparece ao voltar. -->

## Checagens

- [ ] `npm run lint`, `npm run typecheck` e `npm test -- --coverage` passam (e o pre-push roda os quatro)
- [ ] Teste novo ou alterado junto com o codigo
- [ ] Registrado no [vupth-docs](https://vupth-docs.pages.dev/partner.html) — o repositorio nao guarda documentacao
- [ ] Entra lib nativa, plugin, permissao, icone ou SDK? Entao **sobe a versao** e vai para a lista do proximo build
