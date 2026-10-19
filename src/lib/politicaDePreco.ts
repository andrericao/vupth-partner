import { abrirLink, SUPORTE_URL } from "@lib/suporte";

// politica-de-preco-saiba-mais (DEC-91) + saiba-mais-leva-ao-suporte (DEC-96,
// Andre 18/10): no cadastro do servico a previa mostra a composicao do preco
// (empresa de pagamento + app) e um "Saiba mais" que leva SO ao nosso Suporte.
// A explicacao e a citacao do Asaas, com o link, ficam la dentro — o app nao
// aponta direto para o Asaas.
// A formula mora no pricing.ts (max(R$ 1,99; R$ 0,49 + 2,99% do preco)).

/**
 * O artigo "Por que o preco muda conforme o valor", na versao do Parceiro. A URL
 * e estavel (Suporte, S54): se o artigo mudar de lugar, o link quebra sem que o
 * app avise, entao o endereco mora em UMA constante e o teste o trava por inteiro.
 */
export const ARTIGO_DO_PRECO = `${SUPORTE_URL}artigos/parceiro/por-que-o-preco-muda.html`;

/** Onde o "Saiba mais" do preco abre. */
export function linkDoSaibaMaisDoPreco(): string {
  return ARTIGO_DO_PRECO;
}

export function explicarPrecoDoServico(): Promise<void> {
  return abrirLink(linkDoSaibaMaisDoPreco());
}
