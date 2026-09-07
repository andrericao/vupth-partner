import { render, fireEvent } from "@testing-library/react-native";
import { SolicitacoesCard } from "../SolicitacoesCard";

// O card so existe para resolver uma coisa: o pedido chegava e o profissional
// nao via (item 1, desde 05/08 — um ponto de 12px dentro do menu). Entao o que
// se testa aqui e PRESENCA e URGENCIA, nao aparencia.
describe("SolicitacoesCard", () => {
  const resumo = { titulo: "2 solicitações de encaixe", quem: "Ana e mais 1", expiraEm: 4 };

  it("mostra quantos, quem e quanto tempo resta — as tres de uma vez", () => {
    const { getByText, getByTestId } = render(
      <SolicitacoesCard resumo={resumo} onPress={jest.fn()} />
    );

    expect(getByText("2 solicitações de encaixe")).toBeTruthy();
    expect(getByText("Ana e mais 1")).toBeTruthy();
    expect(getByTestId("solicitacoes-expira").props.children).toContain("4");
  });

  it("leva para a decisao ao ser tocado — o card inteiro e o alvo", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<SolicitacoesCard resumo={resumo} onPress={onPress} />);

    fireEvent.press(getByTestId("solicitacoes-card"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("no fim do prazo troca a contagem por 'expira agora'", () => {
    const { getByTestId } = render(
      <SolicitacoesCard resumo={{ ...resumo, expiraEm: 0 }} onPress={jest.fn()} />
    );

    expect(getByTestId("solicitacoes-expira").props.children).toBe("expira agora");
  });

  it("o rotulo de acessibilidade diz o que fazer, nao so o que e", () => {
    const { getByTestId } = render(<SolicitacoesCard resumo={resumo} onPress={jest.fn()} />);

    expect(getByTestId("solicitacoes-card").props.accessibilityLabel).toMatch(/Toque para decidir/);
  });
});
