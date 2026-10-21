import { View } from "react-native";
import { useTema } from "@hooks/useTema";

// Dot pessego discreto para sinalizar pendencia nas Configuracoes (dono: item
// "Dados do Estabelecimento"; profissional: item "Configuracoes"). Alerta
// enquanto ha QUALQUER pendencia (basico ou perfil) — ver hasAnyPending.
export function PendingDot() {
  const { cores } = useTema();
  return (
    <View
      accessibilityLabel="Pendencias no cadastro"
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: cores.pessego, // o pêssego como COR (o token warning vira fundo escuro no escuro)
      }}
    />
  );
}
