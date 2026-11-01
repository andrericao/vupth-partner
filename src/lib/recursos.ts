// Chaves de recursos que estao prontos no codigo mas FORA do app por decisao
// (liga-se aqui, num lugar so, quando chegar a hora).

/**
 * Encaixe novo (aceitar-encaixe, DEC-136 a 141). Desligado por ora (Andre,
 * DEC-144): o Client nao vai implementar o pedido de encaixe agora, entao o
 * cartao "Encaixe" nao aparece em Solicitacoes, nao soma no badge e nao pede a
 * lista ao servidor. O codigo e os testes ficam; os pedidos de corte seguem
 * normais.
 */
export const ENCAIXE_NOVO_LIGADO = false;
