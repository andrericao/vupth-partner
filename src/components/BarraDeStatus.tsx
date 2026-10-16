import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";

// status-bar-visivel (PAR-3, Andre 15/10): "nos menus não dá para ver os ícones
// de notificação/hora no topo — tudo fica escuro". O app inteiro usa ícones
// escuros (fundo branco, app/_layout.tsx); a tela com o topo escuro (o Perfil
// do profissional, cabeçalho forest) põe esta barra com ícones CLAROS. Só
// enquanto está em foco: as abas continuam montadas, e a de fora não manda.
export function BarraDeStatusClara() {
  const focada = useIsFocused();
  return focada ? <StatusBar style="light" /> : null;
}
