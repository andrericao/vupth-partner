import { render } from "@testing-library/react-native";
import { BarraDeStatusClara } from "../BarraDeStatus";

const mockFocada = jest.fn();
jest.mock("@react-navigation/native", () => ({ useIsFocused: () => mockFocada() }));
jest.mock("expo-status-bar", () => {
  const { Text } = jest.requireActual("react-native");
  return { StatusBar: ({ style }: { style: string }) => <Text testID="barra">{style}</Text> };
});

// status-bar-visivel (PAR-3): o topo escuro pede ícones claros, só em foco.
describe("BarraDeStatusClara", () => {
  it("em foco: ícones claros", () => {
    mockFocada.mockReturnValue(true);
    const { getByTestId } = render(<BarraDeStatusClara />);
    expect(getByTestId("barra")).toHaveTextContent("light");
  });

  it("fora de foco: não mexe na barra (vale a do app, escura)", () => {
    mockFocada.mockReturnValue(false);
    const { queryByTestId } = render(<BarraDeStatusClara />);
    expect(queryByTestId("barra")).toBeNull();
  });
});
