import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { useLimparAoSair } from "../useLimparAoSair";

// Prefixo `mock` e exigencia do jest: variavel usada dentro do factory do
// jest.mock precisa dele, senao o hoisting acusa acesso a escopo externo.
let mockFocado = true;
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockFocado,
}));

function Tela({ limpar }: { limpar: () => void }) {
  useLimparAoSair(limpar);
  return <Text>tela</Text>;
}

describe("useLimparAoSair", () => {
  beforeEach(() => {
    mockFocado = true;
  });

  it("não limpa enquanto a tela está em foco", () => {
    const limpar = jest.fn();
    const { rerender } = render(<Tela limpar={limpar} />);
    rerender(<Tela limpar={limpar} />);

    expect(limpar).not.toHaveBeenCalled();
  });

  it("limpa quando a tela PERDE o foco — é ali que o dado ficava", () => {
    const limpar = jest.fn();
    const { rerender } = render(<Tela limpar={limpar} />);

    mockFocado = false;
    rerender(<Tela limpar={limpar} />);

    expect(limpar).toHaveBeenCalledTimes(1);
  });

  it("voltar NÃO limpa de novo — quem volta já encontra a tela limpa", () => {
    const limpar = jest.fn();
    const { rerender } = render(<Tela limpar={limpar} />);
    mockFocado = false;
    rerender(<Tela limpar={limpar} />);
    mockFocado = true;
    rerender(<Tela limpar={limpar} />);

    expect(limpar).toHaveBeenCalledTimes(1);
  });

  it("sair duas vezes limpa duas vezes", () => {
    const limpar = jest.fn();
    const { rerender } = render(<Tela limpar={limpar} />);
    for (const f of [false, true, false]) {
      mockFocado = f;
      rerender(<Tela limpar={limpar} />);
    }

    expect(limpar).toHaveBeenCalledTimes(2);
  });
});
