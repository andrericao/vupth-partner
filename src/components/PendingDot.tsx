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
        width: 12,
        height: 12,
        borderRadius: 6,
        // cadastro-pendente-no-partner (Andre, 22/10): o pessego #FFC091 sozinho
        // some sobre o surface do card (#F3F5F1, ~1,4:1). O aro no texto da tela
        // da o contorno que o ponto precisava para aparecer nos dois temas.
        borderWidth: 1.5,
        borderColor: cores.textPrimary,
        backgroundColor: cores.pessego, // o pêssego como COR (o token warning vira fundo escuro no escuro)
      }}
    />
  );
}
