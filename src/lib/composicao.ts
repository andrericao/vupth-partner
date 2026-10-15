// explicar-o-relatorio (PAR-18, Andre 15/10): "o profissional (e o cliente)
// nao conseguem saber qual valor vai para o que". Cada atendimento do historico
// abre a composicao: o que o cliente pagou, a parte do profissional, a empresa
// de pagamento, o app (com o arredondamento) e o que sobra (multa, ajuste).
//
// O atendimento so traz o total (`totalValue`); a divisao vem do servico
// cadastrado (`base_price` e `pro_receives`, gravados desde 18/09). Os numeros
// seguem a regra de hoje (x1,06 no X,90); quando a formula nova do preco chegar
// (preco-sobre-o-total), so muda a conta aqui.

/** A empresa de pagamento fica com 4% do valor digitado (src/lib/pricing.ts). */
const TAXA_DA_EMPRESA_DE_PAGAMENTO = 0.04;

type ServicoDoAtendimento = { id: string; customName: string };
type MeuServico = {
  id: string;
  customName?: string;
  price: number;
  pro_receives?: number | null;
  base_price?: number | null;
};

export type Composicao = {
  clientePagou: number;
  /** null quando algum servico nao tem a divisao (preco antigo ou apagado). */
  voceRecebeu: number | null;
  empresaDePagamento: number | null;
  /** Os 2% do app + o arredondamento para o X,90. */
  app: number | null;
  /** O que o total tem alem dos servicos (multa, ajuste). 0 quando nao ha. */
  outros: number;
  /** Servicos do atendimento sem a divisao gravada. */
  semDivisao: string[];
};

function centavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function temDivisao(s: MeuServico | undefined): s is MeuServico & { pro_receives: number; base_price: number } {
  return !!s && s.base_price != null && s.base_price > 0 && s.pro_receives != null;
}

export function composicaoDoAtendimento(
  atendimento: { totalValue: number; services: ServicoDoAtendimento[] },
  meusServicos: MeuServico[]
): Composicao {
  const porId = new Map(meusServicos.map((s) => [s.id, s]));
  const semDivisao: string[] = [];
  let preco = 0;
  let recebe = 0;
  let digitado = 0;
  for (const servico of atendimento.services) {
    const meu = porId.get(servico.id);
    if (!temDivisao(meu)) {
      semDivisao.push(servico.customName);
      continue;
    }
    preco += meu.price;
    recebe += meu.pro_receives;
    digitado += meu.base_price;
  }
  const clientePagou = centavos(atendimento.totalValue);
  if (semDivisao.length > 0) {
    return { clientePagou, voceRecebeu: null, empresaDePagamento: null, app: null, outros: 0, semDivisao };
  }
  const empresaDePagamento = centavos(digitado * TAXA_DA_EMPRESA_DE_PAGAMENTO);
  const outros = centavos(clientePagou - preco);
  return {
    clientePagou,
    voceRecebeu: centavos(recebe),
    empresaDePagamento,
    app: centavos(preco - recebe - empresaDePagamento),
    outros: outros > 0 ? outros : 0,
    semDivisao,
  };
}

/** Os servicos cadastrados ainda com o preco antigo (sem a divisao). */
export function servicosComPrecoAntigo(meusServicos: MeuServico[]): string[] {
  return meusServicos.filter((s) => !temDivisao(s)).map((s) => s.customName ?? "").filter(Boolean);
}

/**
 * A faixa do relatorio quando ha atendimento sem a divisao: diz QUAL servico
 * esta com preco antigo e COMO atualizar (Andre, 15/10).
 */
export function avisoDoPrecoAntigo(semDivisao: number | null | undefined, nomes: string[]): string | null {
  if (!semDivisao || semDivisao <= 0) return null;
  const n = semDivisao === 1 ? "1 atendimento ficou" : `${semDivisao} atendimentos ficaram`;
  const quais =
    nomes.length === 0
      ? "um serviço com preço antigo"
      : nomes.length === 1
        ? `o serviço ${nomes[0]}, com preço antigo`
        : `os serviços ${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}, com preço antigo`;
  return `${n} fora do "Você recebeu": usa ${quais}. Para atualizar: Perfil → Meus serviços → Editar → Salvar.`;
}

/** De onde vem cada total do topo (Andre, 15/10: "por que 50,00 e não 88,80 − taxas"). */
export function explicacaoDosTotais(): string {
  return 'Você recebeu: a sua parte dos atendimentos finalizados no período. Clientes pagaram: o total desses atendimentos, com a empresa de pagamento e o app. Toque num atendimento do histórico para ver a conta.';
}
