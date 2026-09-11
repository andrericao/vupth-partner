import { render } from "@testing-library/react-native";
import { WsDiagnostics } from "../WsDiagnostics";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

const CONNECTED_OK = { "heart-beat": "10000,10000", "user-name": "03d4583f-aaaa-bbbb" };

describe("WsDiagnostics (linha de QA do WebSocket)", () => {
  beforeEach(() => useWsDiagnosticsStore.getState().reset());

  it("desconectado, avisa que não há sessão", () => {
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/desconectado/i)).toBeTruthy();
  });

  it("conectado, mostra o heart-beat que o SERVIDOR respondeu", () => {
    useWsDiagnosticsStore.getState().markConnected("public", CONNECTED_OK);
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/10000,10000/)).toBeTruthy();
  });

  it("com user-name, marca a sessão como autenticada", () => {
    useWsDiagnosticsStore.getState().markConnected("public", CONNECTED_OK);
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/autenticada/i)).toBeTruthy();
  });

  it("SEM user-name, denuncia a sessão ANONIMA (e o sintoma do S14)", () => {
    useWsDiagnosticsStore.getState().markConnected("public", { "heart-beat": "10000,10000" });
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/anonima/i)).toBeTruthy();
  });

  it("heart-beat 0,0 aparece como tal — não pode passar por normal", () => {
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
    // O matcher compara o texto INTEIRO do elemento, nao um pedaco.
    expect(view.getByTestId("ws-diag-public")).toHaveTextContent("fila 2");
    expect(view.getByTestId("ws-diag-personal")).toHaveTextContent("pessoal 1");
  });

  it("mostra o último erro quando ha", () => {
    useWsDiagnosticsStore.getState().markError("public", "handshake 401");
    const view = render(<WsDiagnostics />);
    expect(view.getByText(/handshake 401/)).toBeTruthy();
  });
});

// O painel e a UNICA janela para o payload da fila em APK (sem DevTools, e com
// os logs gated por __DEV__). Se estas linhas nao aparecerem, o impasse do
// "finalizar" continua sem prova.
describe("WsDiagnostics — snapshot da fila", () => {
  it("nao mostra nada antes do primeiro snapshot", () => {
    useWsDiagnosticsStore.getState().reset();
    const { queryByTestId } = render(<WsDiagnostics />);

    expect(queryByTestId("ws-diag-snapshot-get")).toBeNull();
    expect(queryByTestId("ws-diag-snapshot-ws")).toBeNull();
  });

  it("mostra as DUAS origens — e a comparacao entre elas que responde", () => {
    useWsDiagnosticsStore.getState().reset();
    useWsDiagnosticsStore.getState().marcarSnapshot("GET", "GET: IN_PROGRESS · Ana · espera 2");
    useWsDiagnosticsStore.getState().marcarSnapshot("WS", "WS: current_attendance NULO · espera 2");

    const { getByTestId } = render(<WsDiagnostics />);

    expect(getByTestId("ws-diag-snapshot-get").props.children).toContain("IN_PROGRESS");
    expect(getByTestId("ws-diag-snapshot-ws").props.children).toContain("NULO");
  });
});

// A6: o painel e a UNICA janela para saber por que o push nao chegou — no APK
// nao ha DevTools, e o hook engole a excecao de proposito.
describe("WsDiagnostics — a linha do push", () => {
  it("nao mostra nada antes de qualquer tentativa", () => {
    useWsDiagnosticsStore.getState().reset();
    const { queryByTestId } = render(<WsDiagnostics />);

    expect(queryByTestId("ws-diag-push")).toBeNull();
  });

  it("traduz 'falhou' para a frase que o time do client tambem usa", () => {
    // Mesma frase nos dois apps: e o que permite comparar um com o outro sem
    // traduzir nada no meio.
    useWsDiagnosticsStore.getState().reset();
    useWsDiagnosticsStore.getState().marcarPush("falhou", "Default FirebaseApp is not initialized");

    const { getByTestId } = render(<WsDiagnostics />);
    const texto = getByTestId("ws-diag-push").props.children.join("");

    expect(texto).toContain("a chamada nativa falhou");
    expect(texto).toContain("FirebaseApp");
  });

  it("separa permissao negada de falha tecnica", () => {
    useWsDiagnosticsStore.getState().reset();
    useWsDiagnosticsStore.getState().marcarPush("sem-permissao", "denied");

    const { getByTestId } = render(<WsDiagnostics />);
    expect(getByTestId("ws-diag-push").props.children.join("")).toContain("permissão negada");
  });

  it("diz quando deu certo — o sinal de que o Firebase entrou", () => {
    useWsDiagnosticsStore.getState().reset();
    useWsDiagnosticsStore.getState().marcarPush("registrado");

    const { getByTestId } = render(<WsDiagnostics />);
    expect(getByTestId("ws-diag-push").props.children.join("")).toContain("token obtido");
  });
});
