import { render } from "@testing-library/react-native";
import { WsDiagnostics } from "../WsDiagnostics";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

const CONNECTED_OK = { "heart-beat": "10000,10000", "user-name": "03d4583f-aaaa-bbbb" };

describe("WsDiagnostics (linha de QA do WebSocket)", () => {
  beforeEach(() => useWsDiagnosticsStore.getState().reset());

  it("desconectado, avisa que nao ha sessao", () => {
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/desconectado/i)).toBeTruthy();
  });

  it("conectado, mostra o heart-beat que o SERVIDOR respondeu", () => {
    useWsDiagnosticsStore.getState().markConnected("public", CONNECTED_OK);
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/10000,10000/)).toBeTruthy();
  });

  it("com user-name, marca a sessao como autenticada", () => {
    useWsDiagnosticsStore.getState().markConnected("public", CONNECTED_OK);
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/autenticada/i)).toBeTruthy();
  });

  it("SEM user-name, denuncia a sessao ANONIMA (e o sintoma do S14)", () => {
    useWsDiagnosticsStore.getState().markConnected("public", { "heart-beat": "10000,10000" });
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/anonima/i)).toBeTruthy();
  });

  it("heart-beat 0,0 aparece como tal — nao pode passar por normal", () => {
    useWsDiagnosticsStore.getState().markConnected("public", { "heart-beat": "0,0" });
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/0,0/)).toBeTruthy();
  });

  it("conta as mensagens dos DOIS canais separadamente", () => {
    const s = useWsDiagnosticsStore.getState();
    s.markConnected("public", CONNECTED_OK);
    s.markMessage("public");
    s.markMessage("public");
    s.markMessage("personal");
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-public")).toHaveTextContent("2");
    expect(view.getByTestId("ws-diag-personal")).toHaveTextContent("1");
  });

  it("mostra o ultimo erro quando ha", () => {
    useWsDiagnosticsStore.getState().markError("public", "handshake 401");
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/handshake 401/)).toBeTruthy();
  });
});
