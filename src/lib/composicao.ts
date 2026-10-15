import { estimateDesiredFromClient } from "@lib/pricing";

// A conta de cada atendimento do relatorio.
//
// explicar-o-relatorio (PAR-18, Andre 15/10): "o profissional (e o cliente)
// nao conseguem saber qual valor vai para o que".
// relatorio-todas-as-linhas (DEC-55, Andre 15/10): "no relatorio nao e bem
// explicacao, ele deve ter todas as linhas para que os valores batam". Cada
// atendimento e cada total listam todas as parcelas e a soma fecha no total:
//
//   cliente pagou = profissional + empresa de pagamento + app + arredondamento + outros
//
// DEC-54: as porcentagens incidem sobre o total ja arredondado (4% da empresa
// de pagamento, 2% do app); o arredondamento e o que sobra, e fecha a conta.
// Ex.: R$ 53,90 = 50,00 + 2,16 + 1,08 + 0,66.
//
// O atendimento so traz o total (`totalValue`); a parte do profissional vem do
// servico cadastrado (`pro_receives`, gravado desde 18/09). Servico com preco
// antigo ou apagado tem a parte ESTIMADA pelo preco (x1,06), e a conta avisa.

/** A empresa de pagamento (Asaas) fica com 4% do total (DEC-54). */
const TAXA_DA_EMPRESA_DE_PAGAMENTO = 0.04;
/** O app fica com 2% do total. */
const TAXA_DO_APP = 0.02;

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
  voceRecebeu: number;
  empresaDePagamento: number;
  app: number;
  /** O que sobra para fechar a conta (o X,90). Pode ser negativo em preco antigo. */
  arredondamento: number;
  /** O que o total tem alem dos servicos (multa, ajuste). */
  outros: number;
  /** Servicos com a parte do profissional estimada (preco antigo ou apagado). */
  estimados: string[];
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
  const clientePagou = centavos(atendimento.totalValue);
  const estimados: string[] = [];
  const apagados: string[] = [];
  let precoConhecido = 0;
  let recebe = 0;
  for (const servico of atendimento.services) {
    const meu = porId.get(servico.id);
    if (!meu) {
      apagados.push(servico.customName);
      continue;
    }
    precoConhecido += meu.price;
    if (temDivisao(meu)) {
      recebe += meu.pro_receives;
    } else {
      recebe += estimateDesiredFromClient(meu.price);
      estimados.push(servico.customName);
    }
  }
  // Servico apagado: o preco dele e o que falta para o total; sem "outros".
  let outros = 0;
  if (apagados.length > 0) {
    recebe += estimateDesiredFromClient(Math.max(0, clientePagou - precoConhecido));
    estimados.push(...apagados);
  } else {
    outros = Math.max(0, centavos(clientePagou - precoConhecido));
  }
  const dosServicos = centavos(clientePagou - outros);
  const voceRecebeu = centavos(recebe);
  const empresaDePagamento = centavos(dosServicos * TAXA_DA_EMPRESA_DE_PAGAMENTO);
  const app = centavos(dosServicos * TAXA_DO_APP);
  const arredondamento = centavos(dosServicos - voceRecebeu - empresaDePagamento - app);
  return { clientePagou, voceRecebeu, empresaDePagamento, app, arredondamento, outros, estimados };
}

/** A conta do periodo: a soma das linhas de cada atendimento (fecha no total). */
export function somaDasContas(contas: Composicao[]): Composicao {
  const soma = (campo: keyof Omit<Composicao, "estimados">) =>
    centavos(contas.reduce((total, c) => total + c[campo], 0));
  return {
    clientePagou: soma("clientePagou"),
    voceRecebeu: soma("voceRecebeu"),
    empresaDePagamento: soma("empresaDePagamento"),
    app: soma("app"),
    arredondamento: soma("arredondamento"),
    outros: soma("outros"),
    estimados: [...new Set(contas.flatMap((c) => c.estimados))],
  };
}

/** Os servicos cadastrados ainda com o preco antigo (sem a divisao). */
export function servicosComPrecoAntigo(meusServicos: MeuServico[]): string[] {
  return meusServicos.filter((s) => !temDivisao(s)).map((s) => s.customName ?? "").filter(Boolean);
}

/**
 * A faixa do relatorio quando ha servico com preco antigo: diz QUAL e COMO
 * atualizar (Andre, 15/10). A conta desses atendimentos sai estimada.
 */
export function avisoDoPrecoAntigo(nomes: string[]): string | null {
  if (nomes.length === 0) return null;
  const quais =
    nomes.length === 1
      ? `O serviço ${nomes[0]} está`
      : `Os serviços ${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]} estão`;
  return `${quais} com preço antigo: a sua parte nesses atendimentos é estimada. Para atualizar: Perfil → Meus serviços → Editar → Salvar.`;
}
