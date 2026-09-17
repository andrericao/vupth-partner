import { render } from "@testing-library/react-native";
import { WsDiagnostics } from "../WsDiagnostics";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

const CONNECTED_OK = { "heart-beat": "10000,10000", "user-name": "03d4583f-aaaa-bbbb" };

const conectar = (headers: Record<string, string>) => {
  const s = useWsDiagnosticsStore.getState();
  s.markConnected("public", headers);
  s.markConnected("personal", headers);
};

// Mesmo desenho do painel do client (16/09): um cartao "Tempo real" com um
// veredito por canal. As frases sao as do client, para o A/B entre apps valer.
describe("WsDiagnostics (painel de tempo real)", () => {
  beforeEach(() => useWsDiagnosticsStore.getState().reset());

  it("sem conexao, os dois canais dizem que nao ha conexao", () => {
    const view = render(<WsDiagnostics />);
    expect(view.getByText("Tempo real (diagnóstico)")).toBeTruthy();
    expect(view.getAllByText(/Sem conexão/)).toHaveLength(2);
  });

  it("conectado, mostra quem e e o heart-beat que o SERVIDOR respondeu", () => {
    conectar(CONNECTED_OK);
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-personal-veredito")).toHaveTextContent(
      "Conectado como 03d4583f-aaaa-bbbb, heartbeat de 10s"
    );
    expect(view.getByTestId("ws-diag-personal-contagem")).toHaveTextContent(/heart-beat 10000,10000/);
  });

  it("SEM user-name, denuncia o canal pessoal ANONIMO (S14)", () => {
    conectar({ "heart-beat": "10000,10000" });
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-personal-veredito")).toHaveTextContent(/ANÔNIMO/);
  });

  it("heart-beat 0,0 vira aviso — nao pode passar por normal (S17)", () => {
    conectar({ "heart-beat": "0,0", "user-name": "abc" });
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-public-veredito")).toHaveTextContent(/heartbeat \(0\)/);
  });

  it("conta as mensagens dos DOIS canais separadamente", () => {
    const s = useWsDiagnosticsStore.getState();
    conectar(CONNECTED_OK);
    s.markMessage("public");
    s.markMessage("public");
    s.markMessage("personal");
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-public-contagem")).toHaveTextContent(/^2 recebidas/);
    expect(view.getByTestId("ws-diag-personal-contagem")).toHaveTextContent(/^1 recebidas/);
  });

  it("mostra o MOTIVO da falha", () => {
    useWsDiagnosticsStore.getState().markError("public", "handshake 401");
    const view = render(<WsDiagnostics />);
    expect(view.getByTestId("ws-diag-public-error")).toHaveTextContent("handshake 401");
    expect(view.getByTestId("ws-diag-public-veredito")).toHaveTextContent(/Falhou o handshake/);
  });
});

// O painel e a UNICA janela para o payload da fila em APK (sem DevTools, e com
// os logs gated por __DEV__). Se estas linhas nao aparecerem, o impasse do
// "finalizar" continua sem prova. (Exclusivo do partner.)
describe("WsDiagnostics — snapshot da fila", () => {
  beforeEach(() => useWsDiagnosticsStore.getState().reset());

  it("nao mostra nada antes do primeiro snapshot", () => {
    const { queryByTestId } = render(<WsDiagnostics />);
    expect(queryByTestId("ws-diag-snapshot-get")).toBeNull();
    expect(queryByTestId("ws-diag-snapshot-ws")).toBeNull();
  });

  it("mostra as DUAS origens — e a comparacao entre elas que responde", () => {
    useWsDiagnosticsStore.getState().marcarSnapshot("GET", "GET: IN_PROGRESS · Ana · espera 2");
    useWsDiagnosticsStore.getState().marcarSnapshot("WS", "WS: current_attendance NULO · espera 2");

    const { getByTestId } = render(<WsDiagnostics />);
    expect(getByTestId("ws-diag-snapshot-get")).toHaveTextContent(/IN_PROGRESS/);
    expect(getByTestId("ws-diag-snapshot-ws")).toHaveTextContent(/NULO/);
  });
});
