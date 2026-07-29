import { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "../../config/gluestack-ui.config";

// Render RNTL envolto no GluestackUIProvider (mesmo `config` do app/_layout),
// necessario para componentes que usam tokens/props do gluestack.
export function renderWithProvider(ui: ReactElement) {
  return render(<GluestackUIProvider config={config}>{ui}</GluestackUIProvider>);
}
