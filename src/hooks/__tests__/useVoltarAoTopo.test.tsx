import { render } from "@testing-library/react-native";
import { ScrollView, Text } from "react-native";

import { useVoltarAoTopo } from "../useVoltarAoTopo";

const mockUseScrollToTop = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useScrollToTop: (ref: unknown) => mockUseScrollToTop(ref),
}));

function Tela() {
  const rolagemRef = useVoltarAoTopo();
  return (
    <ScrollView ref={rolagemRef}>
      <Text>conteúdo</Text>
    </ScrollView>
  );
}

describe("useVoltarAoTopo", () => {
  it("registra o container no useScrollToTop da navegacao", () => {
    render(<Tela />);
    expect(mockUseScrollToTop).toHaveBeenCalledTimes(1);
    const ref = mockUseScrollToTop.mock.calls[0][0];
    // e o MESMO ref que foi para o ScrollView — sem isso o gesto nao rola nada
    expect(ref.current).not.toBeNull();
  });
});
