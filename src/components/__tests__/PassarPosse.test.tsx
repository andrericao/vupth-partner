import { fireEvent, render } from "@testing-library/react-native";
import { PassarPosse } from "../PassarPosse";

const base = {
  pendente: null,
  candidatos: [
    { id: "p1", nome: "Bia" },
    { id: "p2", nome: "Caio" },
  ],
  ocupado: false,
  erro: null,
  onPedir: jest.fn(),
  onCancelar: jest.fn(),
};

// passar a posse (c0f5b17 + S41): o dono escolhe na equipe, ve o pendente e cancela.
describe("PassarPosse", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sem pendente: lista a equipe e pede para quem foi escolhido", () => {
    const onPedir = jest.fn();
    const { getByText } = render(<PassarPosse {...base} onPedir={onPedir} />);
    expect(getByText(/aceitar/)).toBeTruthy();
    fireEvent.press(getByText("Bia"));
    expect(onPedir).toHaveBeenCalledWith("p1");
  });

  it("sem ninguem na equipe, diz o que fazer", () => {
    const { getByText } = render(<PassarPosse {...base} candidatos={[]} />);
    expect(getByText(/Vincule um profissional/)).toBeTruthy();
  });

  it("com pendente: mostra para quem e deixa cancelar; a equipe some", () => {
    const onCancelar = jest.fn();
    const { getByText, queryByText } = render(
      <PassarPosse
        {...base}
        onCancelar={onCancelar}
        pendente={{ id: "t1", status: "PENDING", professional_id: "p1", professional_name: "Bia", created_at: "2026-10-08T12:00:00Z" }}
      />
    );
    expect(getByText(/Esperando Bia aceitar/)).toBeTruthy();
    expect(queryByText("Caio")).toBeNull();
    fireEvent.press(getByText("Cancelar pedido"));
    expect(onCancelar).toHaveBeenCalled();
  });

  it("mostra o erro e, ocupado, nao pede de novo", () => {
    const onPedir = jest.fn();
    const { getByTestId, getByText } = render(
      <PassarPosse {...base} ocupado erro="Já há um pedido pendente." onPedir={onPedir} />
    );
    expect(getByTestId("posse-erro")).toHaveTextContent("Já há um pedido pendente.");
    fireEvent.press(getByText("Bia"));
    expect(onPedir).not.toHaveBeenCalled();
  });
});
