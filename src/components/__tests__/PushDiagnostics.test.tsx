import { fireEvent, render } from "@testing-library/react-native";
import { PushDiagnostics } from "../PushDiagnostics";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

const TOKEN = "ExponentPushToken[abcdefghijkl]";

const mockCopiar = jest.fn(async () => undefined);
jest.mock("@lib/copiar", () => ({ copiarComAviso: (...a: unknown[]) => mockCopiar(...(a as [])) }));

// Espelho do cartao "Push" do client. A ordem das linhas e a ordem em que as
// coisas falham: a primeira que nao estiver OK e onde parou.
describe("PushDiagnostics", () => {
  beforeEach(() => useWsDiagnosticsStore.getState().reset());

  it("antes de qualquer tentativa, diz que ainda nao tentou (nao parece 'tudo certo')", () => {
    const { getByText } = render(<PushDiagnostics />);
    expect(getByText(/Ainda não tentou registrar/)).toBeTruthy();
  });

  it("traduz o motivo com a mesma frase do client", () => {
    useWsDiagnosticsStore.getState().marcarPush("falhou", "Default FirebaseApp is not initialized");
    const { getByText } = render(<PushDiagnostics />);
    expect(getByText("a chamada nativa falhou (ver detalhe)")).toBeTruthy();
    expect(getByText(/FirebaseApp/)).toBeTruthy();
  });

  it("mostra so o fim do token e revela o inteiro, selecionavel, sob toque", () => {
    const s = useWsDiagnosticsStore.getState();
    s.marcarPush("obtido");
    s.marcarToken(TOKEN);
    const { getByText, queryByText } = render(<PushDiagnostics />);

    expect(queryByText(TOKEN)).toBeNull();
    fireEvent.press(getByText(/…efghijkl · toque p\/ ver/));
    const inteiro = getByText(TOKEN);
    expect(inteiro.props.selectable).toBe(true);
  });

  it("o token revelado tem o botao de copiar (build 1.4.0)", () => {
    const s = useWsDiagnosticsStore.getState();
    s.marcarPush("obtido");
    s.marcarToken(TOKEN);
    const { getByText } = render(<PushDiagnostics />);
    fireEvent.press(getByText(/…efghijkl · toque p\/ ver/));
    fireEvent.press(getByText("Copiar token"));
    expect(mockCopiar).toHaveBeenCalledWith(TOKEN, "Token");
  });

  it("diz se o backend sabe do aparelho", () => {
    const s = useWsDiagnosticsStore.getState();
    s.marcarPush("obtido");
    const view = render(<PushDiagnostics />);
    expect(view.getByText("não tentado")).toBeTruthy();

    s.marcarEnvio("ok");
    view.rerender(<PushDiagnostics />);
    expect(view.getByText("sim (POST /devices)")).toBeTruthy();
  });

  it("envio que falhou aparece com o erro", () => {
    const s = useWsDiagnosticsStore.getState();
    s.marcarPush("obtido");
    s.marcarEnvio("falhou", "Request failed with status code 500");
    const { getByText } = render(<PushDiagnostics />);
    expect(getByText("NÃO — envio falhou")).toBeTruthy();
    expect(getByText(/status code 500/)).toBeTruthy();
  });
});
