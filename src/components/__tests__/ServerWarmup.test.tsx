import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { ServerWarmup } from "../ServerWarmup";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { commit: "abc1234" } } },
}));

// abertura-profissional (PAR-10, DEC-40): a abertura e a da marca — o V e um
// indicador discreto, sem citar servidor nem tempo de espera.
describe("ServerWarmup", () => {
  it("abrindo: o V e o indicador, sem falar de servidor", () => {
    const { getByTestId, queryByText } = render(<ServerWarmup />);
    expect(getByTestId("abertura-v")).toBeTruthy();
    expect(getByTestId("abertura-carregando")).toBeTruthy();
    expect(queryByText(/servidor/i)).toBeNull();
    expect(queryByText(/50s/)).toBeNull();
  });

  it("falhou: explica sem falar de servidor e oferece tentar de novo", () => {
    const onRetry = jest.fn();
    const { getByText, queryByText, queryByTestId } = render(
      <ServerWarmup failed onRetry={onRetry} />
    );
    expect(getByText("Não foi possível abrir o app")).toBeTruthy();
    expect(queryByText(/servidor/i)).toBeNull();
    expect(queryByTestId("abertura-carregando")).toBeNull();
    fireEvent.press(getByText("Tentar de novo"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("falhou sem onRetry: sem o botao", () => {
    const { queryByText } = render(<ServerWarmup failed />);
    expect(queryByText("Tentar de novo")).toBeNull();
  });

  // commit-visivel (Andre, 03/10): o commit a vista antes de qualquer login.
  it("mostra o commit do codigo ja na abertura", () => {
    const { getByTestId } = render(<ServerWarmup />);
    expect(getByTestId("app-commit")).toHaveTextContent("abc1234");
  });
});
