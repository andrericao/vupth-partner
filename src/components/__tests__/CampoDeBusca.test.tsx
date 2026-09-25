import { render, fireEvent, screen } from "@testing-library/react-native";
import { CampoDeBusca } from "../nw/CampoDeBusca";

// 🔴 Andre, 25/09: "o campo de procurar estabelecimento espreme as letras". Era
// defeito da migracao: as duas buscas (estabelecimento e convite) tinham altura
// CRAVADA e TextInput sem o reset de web — o mesmo "duas bordas, espremido" do
// login em 08/09. Agora as duas usam este campo, que herda o que o NwInput ja
// resolveu (min-h + reset).
describe("CampoDeBusca", () => {
  const montar = (valor: string) => {
    const onChangeText = jest.fn();
    const onBuscar = jest.fn();
    const onLimpar = jest.fn();
    render(
      <CampoDeBusca
        value={valor}
        placeholder="Nome do estabelecimento"
        onChangeText={onChangeText}
        onBuscar={onBuscar}
        onLimpar={onLimpar}
      />
    );
    return { onChangeText, onBuscar, onLimpar };
  };

  it("propaga a digitacao e o enter busca", () => {
    const { onChangeText, onBuscar } = montar("bar");
    const campo = screen.getByPlaceholderText("Nome do estabelecimento");
    fireEvent.changeText(campo, "barb");
    expect(onChangeText).toHaveBeenCalledWith("barb");
    fireEvent(campo, "submitEditing");
    expect(onBuscar).toHaveBeenCalled();
  });

  it("vazio: o icone busca", () => {
    const { onBuscar, onLimpar } = montar("  ");
    fireEvent.press(screen.getByLabelText("Buscar"));
    expect(onBuscar).toHaveBeenCalled();
    expect(onLimpar).not.toHaveBeenCalled();
  });

  it("com texto: o icone limpa", () => {
    const { onBuscar, onLimpar } = montar("barbearia");
    fireEvent.press(screen.getByLabelText("Limpar busca"));
    expect(onLimpar).toHaveBeenCalled();
    expect(onBuscar).not.toHaveBeenCalled();
  });

  it("a caixa cresce com a fonte (min-h), nunca altura cravada", () => {
    montar("");
    const caixa = screen.getByTestId("campo-de-busca");
    expect(caixa.props.className).toMatch(/min-h-/);
    expect(caixa.props.className).not.toMatch(/(^|\s)h-\d/);
  });
});
