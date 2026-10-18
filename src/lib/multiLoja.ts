// multi-loja-do-dono (Andre, 15/10): o dono tem ate 5 lojas. O teto e do
// Backend (409 OWNER_STORE_LIMIT na 6a em uso); aqui ele so evita o toque
// que ja se sabe recusado.
export const TETO_DE_LOJAS = 5;

/** O dono ainda pode abrir mais uma loja? */
export function podeAdicionarLoja(total: number): boolean {
  return total < TETO_DE_LOJAS;
}

/** O erro e o do teto de lojas? */
export function ehTetoDeLojas(error: unknown): boolean {
  return (error as any)?.response?.data?.code === "OWNER_STORE_LIMIT";
}

export const MSG_TETO_DE_LOJAS = `Você já tem ${TETO_DE_LOJAS} lojas, o máximo por dono.`;
