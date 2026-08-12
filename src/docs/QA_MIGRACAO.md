# QA da migracao NativeWind — checklist de device

Bundle no canal `preview`: **"batch 8 + fluxo do dono + card do corte"** (2026-08-11).
Marque `[x]` no que passou. O que falhar, anote a linha e o que aconteceu.

```txt
// =====================================================================
// 0. PRE-REQUISITO — sem isto o resto nao vale
// =====================================================================
[ ] Configuracoes > "Verificar atualizacao"
[ ] a data/hora do OTA acima do botao bate com a publicacao de hoje
    // se mostrar o de 07/08, o update NAO aplicou e voce esta testando o bundle velho


// =====================================================================
// 1. FILA — a mais critica (830 linhas convertidas de uma vez)
// =====================================================================
[ ] card "Atendendo agora" no topo, cronometro correndo
[ ] Pausar  -> card fica AMBAR + selo "ATENDIMENTO PAUSADO"
[ ] Retomar -> volta a verde
[ ] Finalizar -> sai o card, o proximo assume
[ ] selos "atrasado" / "aguardando" nos cards da lista
[ ] card INTEIRO clicavel abre o menu de acoes    // o kebab ⋮ nao existe mais
[ ] "Iniciar proximo" FIXO no rodape
[ ] >>> role a lista ate o fim: o botao NAO pode ser empurrado <<<
[ ] chips de metrica (pessoas na fila / tempo de espera)
[ ] faixa da refeicao EM ANDAMENTO com "Encerrar", se houver
[ ] pull-to-refresh


// =====================================================================
// 2. BADGE + OPCOES DA FILA
// =====================================================================
[ ] icone de banco mostra NUMERO (nao o pontinho de antes)
[ ] some quando nao ha nada pendente
[ ] refeicao na janela sozinha = 1
[ ] solicitacao de corte SOMA ao numero
[ ] dentro do menu: numero nas Solicitacoes, dot na Refeicao
[ ] Status: trocar entre Trabalhando / Intervalo / Fora
[ ] 1o "Trabalhando" -> avisa que a loja abriu
[ ] ultimo "Fora"     -> avisa que a loja fechou
[ ] "Fechar fila" -> confirmacao -> item vira "Reabrir fila"
[ ] Solicitacoes de corte, no card:
    [ ] o SERVICO pedido aparece      // "Servico nao identificado" = bug voltou
    [ ] "pedido as HH:MM"
    [ ] countdown "expira em N min"
    [ ] Aceitar / Recusar funcionam


// =====================================================================
// 3. CONFIGURACOES — tela nova + diagnostico do WS
// =====================================================================
[ ] cards do menu, dot no card certo, badge de convites
[ ] linha do WS mostra:
    [ ] "WS conectado"
    [ ] "heart-beat 10000,10000"      // 0,0 = servidor voltou atras (S17)
    [ ] "sessao autenticada (xxxxxxxx)"  // "ANONIMA" = S14 acontecendo
    [ ] contagem "fila N · pessoal N msg"
[ ] sub-telas: Dados cadastrais / Meus servicos / Refeicoes / Vinculo
[ ] o VOLTAR de cada uma cai em Configuracoes (nao na Fila)


// =====================================================================
// 4. AREA DO DONO
// =====================================================================
[ ] pendencia "1+ profissional com servico" -> abre "Quem vai atender?"
[ ] tres caminhos aparecem: eu tambem vou atender / convidar / ver solicitacoes
[ ] "Eu tambem vou atender" -> abre o formulario (so depois da escolha)
[ ] ao criar -> o alerta oferece "Cadastrar servicos"
[ ] >>> "Adicionar Servico" NAO existe mais no menu do dono <<<
[ ] menu -> "Adicionar Profissional" cai na MESMA tela "Quem vai atender?"
[ ] dashboard, Ver Filas, Relatorios, Dados do Estabelecimento abrem


// =====================================================================
// 5. CADASTRO E FORMULARIOS
// =====================================================================
[ ] login
[ ] cadastro: checklist de senha ao vivo + "Senhas conferem"
[ ] endereco: mascara de CEP, auto-preenchimento pelo CEP, UF em maiusculo
[ ] >>> ARMADILHA: nome e endereco capitalizam SOZINHOS a 1a letra <<<
    // regressao de COMPORTAMENTO, nao de visual — passa despercebida


// =====================================================================
// 6. WEBSOCKET (com a linha de diagnostico a vista)
// =====================================================================
[ ] alguem entra/sai da fila       -> contador "fila" sobe
[ ] pedir corte pelo app cliente   -> contador "pessoal" sobe
[ ] background 2 min e voltar      -> reconecta (contador volta a subir)
[ ] 20-30 min ocioso, ai mexer     -> chega
[ ] trocar Wi-Fi <-> 4G            -> reconecta sozinho
    // publico sobe e pessoal NAO = o bug que perseguimos desde 01/08


// =====================================================================
// 7. TRANSVERSAL — olhar durante tudo
// =====================================================================
[ ] DOIS VERDES: 21 telas ainda sao gluestack e convivem com as convertidas
[ ] botao voltar nunca cai na tela de login
[ ] nenhuma tela em branco / sem estilo


// =====================================================================
// JA SABEMOS QUE ESTA QUEBRADO — nao reportar como novo
// =====================================================================
// - "esqueci minha senha": e-mail nao chega        (S7, backend)
// - segue para o codigo com e-mail inexistente     (S21, backend)
// - nao da p/ ter horario por dia da semana        (S27, backend)
// - solicitacao de corte nao diz PARA QUANDO       (S26, backend)
```
