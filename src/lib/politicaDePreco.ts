import { escolherOpcao } from "@lib/confirmar";
import { abrirLink, linkDoSuporte } from "@lib/suporte";

// politica-de-preco-saiba-mais (DEC-91, Andre 18/10): no cadastro do servico a
// previa mostra a composicao do preco (empresa de pagamento + app) e um "Saiba
// mais" que explica as taxas do Asaas, com o site do Asaas e o Suporte.
// A formula mora no pricing.ts (max(R$ 1,99; R$ 0,49 + 2,99% do preco)).

/** A pagina de taxas do Asaas (o gateway). */
export const ASAAS_TAXAS_URL = "https://www.asaas.com/precos-e-taxas";

export const SAIBA_MAIS_PRECO = {
  titulo: "Como o preço é composto",
  mensagem:
    "O cliente paga o preço do serviço. Dele saem a taxa da empresa de pagamento (o Asaas: o maior entre R$ 1,99 e R$ 0,49 + 2,99%) e 2% do app. O que sobra é o que você recebe.",
} as const;

/** Mostra a explicacao e abre o site do Asaas ou o Suporte, se a pessoa quiser. */
export async function explicarPrecoDoServico(): Promise<void> {
  const destino = await escolherOpcao<"asaas" | "suporte">({
    ...SAIBA_MAIS_PRECO,
    opcoes: [
      { texto: "Site do Asaas", valor: "asaas" },
      { texto: "Suporte", valor: "suporte" },
    ],
  });
  if (destino === "asaas") await abrirLink(ASAAS_TAXAS_URL);
  if (destino === "suporte") await abrirLink(linkDoSuporte("profissional"));
}
