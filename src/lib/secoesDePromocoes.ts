import { estadoDoPrazo, minhasCampanhas, type Campanha } from "@lib/campanhas";
import { formatarReais } from "@lib/dinheiro";
import { aLiberar, meuLinkDeIndicacao, type LinkDaCampanha, type MeuLink } from "@lib/indicacao";

// promocoes-em-secoes (Andre, 05/11, com o print da tela): Promoções em tres secoes.
// - Ativas: as campanhas de que a pessoa participa e que estao no prazo (o link, os
//   numeros e o "a receber" num bloco so) e os cupons ativados ainda validos.
// - Disponiveis: as campanhas no ar de que ela ainda nao participa (Participar/Ativar).
// - Passadas: encerradas, vencidas ou ja usadas, so para consulta.
// O campo Cupom e o Credito de cupom ficam fora, em blocos proprios.

export type LinkNaSecao = { link: LinkDaCampanha; base?: Campanha };

export type Secoes = {
  linksAtivos: LinkNaSecao[];
  cuponsAtivos: Campanha[];
  linksDisponiveis: Campanha[];
  cuponsDisponiveis: Campanha[];
  linksPassados: LinkNaSecao[];
  cuponsPassados: Campanha[];
};

export type DadosDasPromocoes = {
  /** GET /referrals/me (null: nao veio). */
  meu: MeuLink | null;
  /** GET /campaigns/active. */
  noAr: Campanha[];
  /** GET /campaigns/me: os cupons que a pessoa ativou. */
  cupons: Campanha[];
};

function venceu(fim: string | null | undefined, agora: Date): boolean {
  if (!fim) return false;
  const t = new Date(fim).getTime();
  return !isNaN(t) && t < agora.getTime();
}

/** Cupom ativado que ja nao vale: usado, vencido ou fora do prazo (ex.: o vencido em 28/10 do print). */
export function cupomPassado(c: Campanha, agora: Date = new Date()): boolean {
  return c.status === "EXPIRED" || c.status === "USED" || estadoDoPrazo(c, agora) === "ENCERRADA";
}

export function separarEmSecoes({ meu, noAr, cupons }: DadosDasPromocoes, agora: Date = new Date()): Secoes {
  const participo = meu?.campaigns ?? [];
  const linksAtivos: LinkNaSecao[] = [];
  const linksPassados: LinkNaSecao[] = [];
  for (const link of participo) {
    const base = noAr.find((c) => c.id === link.campaign_id);
    const item = { link, base };
    if (venceu(link.ends_at ?? base?.ends_at, agora)) linksPassados.push(item);
    else linksAtivos.push(item);
  }

  const linksDisponiveis = noAr.filter(
    (c) =>
      c.type === "REFERRAL_BONUS" &&
      !participo.some((p) => p.campaign_id === c.id) &&
      estadoDoPrazo(c, agora) !== "ENCERRADA"
  );
  const cuponsDisponiveis = noAr.filter(
    (c) => c.type !== "REFERRAL_BONUS" && !!c.code && !cupons.some((m) => m.id === c.id) && !estadoDoPrazo(c, agora)
  );

  return {
    linksAtivos,
    cuponsAtivos: cupons.filter((c) => !cupomPassado(c, agora)),
    linksDisponiveis,
    cuponsDisponiveis,
    linksPassados,
    cuponsPassados: cupons.filter((c) => cupomPassado(c, agora)),
  };
}

/**
 * O dinheiro da indicacao, sem contagem de clientes: "R$ 5,00 a receber" e
 * "R$ 5,00 a liberar pelo VUPTH". A contagem fica so no cartao de cada campanha,
 * para os numeros baterem (o print tinha "0 chegaram" no cartao e "1 cliente
 * chegou" na linha de baixo, de fontes diferentes).
 */
export function dinheiroDaIndicacao(meu: Pick<MeuLink, "to_receive" | "pending_release"> | null): {
  receber: string | null;
  liberar: string | null;
} {
  if (!meu) return { receber: null, liberar: null };
  const v = Number(meu.to_receive);
  return {
    receber: Number.isFinite(v) && v > 0 ? `${formatarReais(v)} a receber` : null,
    liberar: aLiberar(meu),
  };
}

/** Os ids das campanhas de que a pessoa ja participa (link) ou que ja ativou (cupom). */
export async function idsEmQueParticipo(
  carregar: () => Promise<MeuLink> = meuLinkDeIndicacao,
  listarCupons: () => Promise<Campanha[]> = minhasCampanhas
): Promise<string[]> {
  const [meu, cupons] = await Promise.allSettled([carregar(), listarCupons()]);
  const ids: string[] = [];
  if (meu.status === "fulfilled") ids.push(...(meu.value?.campaigns ?? []).map((c) => c.campaign_id));
  if (cupons.status === "fulfilled") ids.push(...(cupons.value ?? []).map((c) => c.id));
  return ids;
}

/** Carrossel da Home: so as Disponiveis (nem as que ja participa, nem as encerradas). */
export function soDisponiveis(noAr: Campanha[], participo: string[], agora: Date = new Date()): Campanha[] {
  return noAr.filter((c) => !participo.includes(c.id) && estadoDoPrazo(c, agora) !== "ENCERRADA");
}
