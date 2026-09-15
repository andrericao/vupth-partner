/**
 * O rótulo da aba ainda cabe, com a fonte que o aparelho está usando?
 *
 * 🔴 ACHADO REAL (Andre, 2026-09-14, Xiaomi): "o app ficou muito diferente".
 * Aparelho com fonte/exibição ampliada — e o comentário do próprio
 * `_layout.tsx` já previa: *"a folga some se alguém crescer o ícone ou a
 * fonte"*.
 *
 * DECISÃO DO DS4 (31/08): **a tab bar não cresce.** Ela guarda a altura do
 * desenho, e quando o rótulo deixa de caber o rótulo SAI — fica o ícone, que é
 * o que iOS e Android fazem. Isso só é possível porque a **pílula do DS5.1**
 * marca a aba ativa: sem rótulo, é ela que diz onde você está. Se alguém tirar
 * a pílula um dia, este comportamento cai junto.
 *
 * ⚠️ POR QUE NÃO UM LIMIAR FIXO. "Acima de 185% esconde" parece simples e está
 * errado: a barra mede a LARGURA DA TELA, não uma constante. Os mesmos quatro
 * rótulos que cabem num aparelho de 390pt estouram num de 360pt com a mesma
 * fonte. Um número cravado acerta um aparelho e erra os outros.
 *
 * Os valores abaixo são MEDIDOS no arquivo de design, a 100% e a 200% — o que
 * cresce é o texto, não o ícone.
 */
type Papel = "profissional" | "dono";

const MEDIDAS: Record<Papel, { base: number; crescimento: number; abas: number }> = {
  // Fila · Encaixes · Relatórios · Perfil — somam 251pt a 100% e 380pt a 200%.
  profissional: { base: 251, crescimento: 129, abas: 4 },
  // Início · Filas · Menu — rótulos mais curtos, então crescem menos.
  dono: { base: 161, crescimento: 69, abas: 3 },
};

/** Padding horizontal do `Tab Wrap` (16 de cada lado). */
const RESPIRO_DO_WRAP = 32;
/** Mínimo entre duas abas. Encostadas já é defeito, mesmo sem cortar. */
const FOLGA_ENTRE_ABAS = 8;

export function rotulosCabem(
  larguraDaTela: number,
  fontScale: number,
  papel: Papel
): boolean {
  const { base, crescimento, abas } = MEDIDAS[papel];

  // Aparelho sem informação de escala (ou valor absurdo) não deve esconder
  // rótulo: na dúvida, mostrar — o rótulo é informação, esconder é o remédio.
  const escala = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;

  const disponivel =
    larguraDaTela - RESPIRO_DO_WRAP - FOLGA_ENTRE_ABAS * (abas - 1);
  const projetado = base + crescimento * (escala - 1);

  return projetado <= disponivel;
}
