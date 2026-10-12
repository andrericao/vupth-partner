import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ChavePix } from "@components/ChavePix";

// pagamento-pix (contrato BAK 2a2b0ec): a chave Pix no Perfil do profissional.
const CHAVE = { key_type: "EMAIL" as const, key: "ana@exemplo.com", holder_name: "Ana Souza" };

function deps(over: Partial<Record<string, jest.Mock>> = {}) {
  return {
    obter: jest.fn().mockResolvedValue(null),
    salvar: jest.fn().mockResolvedValue(CHAVE),
    apagar: jest.fn().mockResolvedValue(undefined),
    confirmarImpl: jest.fn().mockResolvedValue(true),
    ...over,
  };
}

describe("ChavePix", () => {
  it("sem chave: o formulario, com a aleatoria escolhida e marcada como recomendada", async () => {
    const d = deps();
    const { findByTestId, getByText } = render(<ChavePix {...d} />);
    expect(await findByTestId("pix-chave")).toBeTruthy();
    expect(getByText("recomendada")).toBeTruthy();
    expect((await findByTestId("pix-tipo-RANDOM")).props.accessibilityState).toMatchObject({ selected: true });
  });

  it("o CPF mostra o aviso de nao expor o documento", async () => {
    const { findByTestId, getByText } = render(<ChavePix {...deps()} />);
    fireEvent.press(await findByTestId("pix-tipo-CPF"));
    expect(getByText(/Prefira não mostrar o seu CPF/)).toBeTruthy();
  });

  it("chave invalida nao salva e mostra o erro no campo", async () => {
    const d = deps();
    const { findByTestId, getByText } = render(<ChavePix {...d} />);
    fireEvent.press(await findByTestId("pix-tipo-EMAIL"));
    fireEvent.changeText(await findByTestId("pix-chave"), "ana@");
    fireEvent.changeText(await findByTestId("pix-titular"), "Ana Souza");
    fireEvent.press(await findByTestId("pix-salvar"));
    expect(getByText("Informe um e-mail válido.")).toBeTruthy();
    expect(d.salvar).not.toHaveBeenCalled();
  });

  it("salva e passa a mostrar a chave cadastrada", async () => {
    const d = deps();
    const { findByTestId, findByText } = render(<ChavePix {...d} />);
    fireEvent.press(await findByTestId("pix-tipo-EMAIL"));
    fireEvent.changeText(await findByTestId("pix-chave"), "ana@exemplo.com");
    fireEvent.changeText(await findByTestId("pix-titular"), "Ana Souza");
    fireEvent.press(await findByTestId("pix-salvar"));
    await waitFor(() =>
      expect(d.salvar).toHaveBeenCalledWith({ tipo: "EMAIL", chave: "ana@exemplo.com", titular: "Ana Souza" })
    );
    expect(await findByText("E-mail · ana@exemplo.com")).toBeTruthy();
  });

  it("erro da API aparece na tela", async () => {
    const d = deps({
      salvar: jest.fn().mockRejectedValue({ response: { data: { message: "Chave Pix invalida para o tipo." } } }),
    });
    const { findByTestId, findByText } = render(<ChavePix {...d} />);
    fireEvent.press(await findByTestId("pix-tipo-EMAIL"));
    fireEvent.changeText(await findByTestId("pix-chave"), "ana@exemplo.com");
    fireEvent.changeText(await findByTestId("pix-titular"), "Ana Souza");
    fireEvent.press(await findByTestId("pix-salvar"));
    expect(await findByText("Chave Pix invalida para o tipo.")).toBeTruthy();
  });

  it("com chave: mostra, troca e remove (com confirmacao)", async () => {
    const d = deps({ obter: jest.fn().mockResolvedValue(CHAVE) });
    const { findByText, findByTestId, queryByText } = render(<ChavePix {...d} />);
    expect(await findByText("E-mail · ana@exemplo.com")).toBeTruthy();
    expect(await findByText("Ana Souza")).toBeTruthy();

    fireEvent.press(await findByTestId("pix-trocar"));
    expect(await findByTestId("pix-chave")).toBeTruthy();
    fireEvent.press(await findByTestId("pix-cancelar"));
    expect(await findByText("E-mail · ana@exemplo.com")).toBeTruthy();

    fireEvent.press(await findByTestId("pix-remover"));
    await waitFor(() => expect(d.apagar).toHaveBeenCalled());
    await waitFor(() => expect(queryByText("E-mail · ana@exemplo.com")).toBeNull());
  });

  it("remover cancelado nao apaga", async () => {
    const d = deps({ obter: jest.fn().mockResolvedValue(CHAVE), confirmarImpl: jest.fn().mockResolvedValue(false) });
    const { findByTestId } = render(<ChavePix {...d} />);
    fireEvent.press(await findByTestId("pix-remover"));
    await waitFor(() => expect(d.confirmarImpl).toHaveBeenCalled());
    expect(d.apagar).not.toHaveBeenCalled();
  });

  it("falha ao carregar: avisa", async () => {
    const d = deps({ obter: jest.fn().mockRejectedValue(new Error("rede")) });
    const { findByText } = render(<ChavePix {...d} />);
    expect(await findByText(/Não foi possível carregar a chave Pix/)).toBeTruthy();
  });
});
