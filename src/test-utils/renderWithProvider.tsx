import { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

// Metricas de um aparelho com entalhe. Fora do teste quem entrega isso e o
// sistema; aqui precisa ser fixo, senao qualquer componente que leia
// `useSafeAreaInsets` levanta "No safe area value available" e derruba a
// arvore inteira. Mesmo tratamento ja aplicado no app do cliente.
const METRICAS = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// Render RNTL envolto no SafeAreaProvider, que o cabecalho e as folhas de baixo
// exigem. (O GluestackUIProvider saiu em 25/09, com a ultima tela do v1.)
export function renderWithProvider(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={METRICAS}>{ui}</SafeAreaProvider>
  );
}
