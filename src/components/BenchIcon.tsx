import Svg, { Rect } from "react-native-svg";

/**
 * Banco (sala de espera) — gatilho do menu de opcoes da fila.
 * Escolha do Andre (2026-07-20) entre 6 candidatos: banco remete a ESPERA/FILA,
 * que e o que o menu governa, e a silhueta larga le bem em 24px.
 * (Provisorio por decisao dele: "outra hora a gente muda".)
 */
// [marca-vupth] $forest — default de cor, nao aceita token de dentro do SVG.
export function BenchIcon({ size = 24, color = "#163300" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* ripas do encosto (a de baixo mais clara, da profundidade) */}
      <Rect x={2.6} y={5.2} width={18.8} height={2.2} rx={1.1} fill={color} />
      <Rect x={2.6} y={8.6} width={18.8} height={2.2} rx={1.1} fill={color} opacity={0.55} />
      {/* assento */}
      <Rect x={2.6} y={12.4} width={18.8} height={2.6} rx={1.3} fill={color} />
      {/* pes */}
      <Rect x={4.6} y={15} width={2.3} height={5.4} rx={1} fill={color} />
      <Rect x={17.1} y={15} width={2.3} height={5.4} rx={1} fill={color} />
    </Svg>
  );
}
