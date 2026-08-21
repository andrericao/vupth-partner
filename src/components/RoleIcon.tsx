import { Store, User } from "lucide-react-native";

type Props = {
  role: "owner" | "professional";
  size?: number;
  color?: string;
};

/**
 * Icone do papel ativo no cabecalho. Mesma posicao para qualquer papel — so
 * muda o glifo:
 *   - owner        → loja (estabelecimento)
 *   - professional → pessoa
 *
 * [marca-vupth] Era uma silhueta PREENCHIDA desenhada a mao (Material
 * "apartment"/busto+chapeu, paleta antiga), depois um par Ionicons outline
 * (aproximacao — o pacote lucide-react-native tinha sido dado como
 * inexistente por engano). O Pencil (doc pencil-new.pen, cabecalho de toda
 * tela — icon "Perfil", 22x22) especifica o GLIFO exato via campo
 * icon+library do no: "store"/lucide no header do dono (OWNER · 01/02/03),
 * "user"/lucide no do profissional (PROF · 02/03). Instalado lucide-react-native
 * (peer react-native-svg ja presente) pra usar o icone identico, nao so
 * equivalente.
 */
const ROLE_ICON = { owner: Store, professional: User } as const;

// Verde primario da marca ($forest). Default de cor — lucide usa `color` como
// stroke (currentColor via react-native-svg), nao aceita token do
// NativeWind/gluestack diretamente.
export function RoleIcon({ role, size = 22, color = "#163300" }: Props) {
  const Icon = ROLE_ICON[role];
  return <Icon size={size} color={color} />;
}
