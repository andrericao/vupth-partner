import { abrirLink, linkDoSuporte } from "@lib/suporte";

// politica-de-preco-saiba-mais (DEC-91) + saiba-mais-leva-ao-suporte (DEC-96,
// Andre 18/10): no cadastro do servico a previa mostra a composicao do preco
// (empresa de pagamento + app) e um "Saiba mais" que leva SO ao nosso Suporte.
// A explicacao e a citacao do Asaas, com o link, ficam la dentro — o app nao
// aponta direto para o Asaas.
// A formula mora no pricing.ts (max(R$ 1,99; R$ 0,49 + 2,99% do preco)).

/**
 * Onde o "Saiba mais" do preco abre. O artigo "Por que o preco muda conforme o
 * valor" ainda nao tem URL estavel (pedida ao Suporte, Solicitadas S54): ate
 * chegar, abre a home do profissional. Trocar so esta linha.
 */
export function linkDoSaibaMaisDoPreco(): string {
  return linkDoSuporte("profissional");
}

export function explicarPrecoDoServico(): Promise<void> {
  return abrirLink(linkDoSaibaMaisDoPreco());
}
