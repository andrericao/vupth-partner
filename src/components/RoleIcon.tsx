import Svg, { Path, Circle, Ellipse } from "react-native-svg";

type Props = {
  role: "owner" | "professional";
  size?: number;
  color?: string;
};

/**
 * Silhueta monocromatica do papel ativo, no estilo do icone de usuario.
 * Mesma posicao/tamanho para qualquer papel — so muda o desenho:
 *   - owner        → predio (estabelecimento)
 *   - professional → busto com chapeu (usuario "coberto")
 */
// Verde primario da paleta do PRD (4 cores-ancora: #1A281A, #5c9c60, #3b7a3f, #F7FAF8).
// [marca-vupth] $forest — default de cor, nao aceita token de dentro do SVG.
export function RoleIcon({ role, size = 26, color = "#163300" }: Props) {
  if (role === "owner") {
    // Predio (Material "apartment"), silhueta cheia.
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm0-4H5V5h2v2zm4 12H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"
        />
      </Svg>
    );
  }

  // Profissional: busto (igual ao usuario) + chapeu por cima.
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* ombros/busto */}
      <Path
        fill={color}
        d="M4 21v-1.5C4 16 7.6 14.5 12 14.5s8 1.5 8 5V21z"
      />
      {/* cabeca */}
      <Circle cx={12} cy={10.2} r={3.4} fill={color} />
      {/* aba do chapeu */}
      <Ellipse cx={12} cy={6.8} rx={7} ry={1.1} fill={color} />
      {/* copa do chapeu */}
      <Path
        fill={color}
        d="M8.9 6.8 9.8 3.6C9.95 3 10.4 2.7 11 2.7h2c.6 0 1.05.3 1.2.9l.9 3.2z"
      />
    </Svg>
  );
}
