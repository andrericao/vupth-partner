import { View } from "react-native";

// Dot pessego discreto para sinalizar pendencia nas Configuracoes (dono: item
// "Dados do Estabelecimento"; profissional: item "Configuracoes"). Alerta
// enquanto ha QUALQUER pendencia (basico ou perfil) — ver hasAnyPending.
export function PendingDot() {
  return (
    <View
      accessibilityLabel="Pendencias no cadastro"
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#FFC091", // [marca-vupth] $brandWarning
      }}
    />
  );
}
