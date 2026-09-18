import { fireEvent, render } from "@testing-library/react-native";
import { DiaDaSemanaLinha, DataEspecialForm, ListaDeExcecoes } from "../HorarioSemana";

describe("DiaDaSemanaLinha", () => {
  it("aberto mostra os dois horarios; digitar aplica a mascara", () => {
    const onChange = jest.fn();
    const { getByText, getByLabelText } = render(
      <DiaDaSemanaLinha dia={{ day: "MONDAY", closed: false, opens: "", closes: "" }} onChange={onChange} />
    );
    expect(getByText("Segunda")).toBeTruthy();
    fireEvent.changeText(getByLabelText("Segunda abre"), "0830");
    expect(onChange).toHaveBeenCalledWith({ day: "MONDAY", closed: false, opens: "08:30", closes: "" });
  });

  it("desligar o dia o fecha e esconde os horarios", () => {
    const onChange = jest.fn();
    const view = render(
      <DiaDaSemanaLinha dia={{ day: "SUNDAY", closed: false, opens: "08:00", closes: "12:00" }} onChange={onChange} />
    );
    fireEvent(view.getByLabelText("Domingo aberto"), "valueChange", false);
    expect(onChange).toHaveBeenCalledWith({ day: "SUNDAY", closed: true, opens: "08:00", closes: "12:00" });

    view.rerender(
      <DiaDaSemanaLinha dia={{ day: "SUNDAY", closed: true, opens: null, closes: null }} onChange={onChange} />
    );
    expect(view.getByText("Fechado")).toBeTruthy();
    expect(view.queryByLabelText("Domingo abre")).toBeNull();
  });
});

describe("DataEspecialForm", () => {
  const HOJE = "2026-09-17";

  it("recusa data passada sem chamar o backend", () => {
    const onAdicionar = jest.fn();
    const { getByLabelText, getByText } = render(
      <DataEspecialForm hoje={HOJE} onAdicionar={onAdicionar} />
    );
    fireEvent.changeText(getByLabelText("Data"), "16092026");
    fireEvent(getByLabelText("Fechado nesse dia"), "valueChange", true);
    fireEvent.press(getByLabelText("Adicionar data especial"));
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(getByText(/de hoje em diante/)).toBeTruthy();
  });

  it("data fechada: manda sem horario", () => {
    const onAdicionar = jest.fn();
    const { getByLabelText } = render(<DataEspecialForm hoje={HOJE} onAdicionar={onAdicionar} />);
    fireEvent.changeText(getByLabelText("Data"), "28092026");
    fireEvent(getByLabelText("Fechado nesse dia"), "valueChange", true);
    fireEvent.press(getByLabelText("Adicionar data especial"));
    expect(onAdicionar).toHaveBeenCalledWith("2026-09-28", { closed: true, opens: "", closes: "" });
  });

  it("data com horario proprio exige os dois horarios", () => {
    const onAdicionar = jest.fn();
    const { getByLabelText, getByText } = render(<DataEspecialForm hoje={HOJE} onAdicionar={onAdicionar} />);
    fireEvent.changeText(getByLabelText("Data"), "21092026");
    fireEvent.changeText(getByLabelText("Data especial abre"), "1000");
    fireEvent.press(getByLabelText("Adicionar data especial"));
    expect(onAdicionar).not.toHaveBeenCalled();
    expect(getByText(/fechamento/)).toBeTruthy();

    fireEvent.changeText(getByLabelText("Data especial fecha"), "1400");
    fireEvent.press(getByLabelText("Adicionar data especial"));
    expect(onAdicionar).toHaveBeenCalledWith("2026-09-21", { closed: false, opens: "10:00", closes: "14:00" });
  });
});

describe("ListaDeExcecoes", () => {
  it("vazia diz que nao ha", () => {
    const { getByText } = render(<ListaDeExcecoes excecoes={[]} onRemover={jest.fn()} />);
    expect(getByText(/Nenhuma data especial/)).toBeTruthy();
  });

  it("mostra a data em DD/MM/AAAA, o horario, e remove", () => {
    const onRemover = jest.fn();
    const { getByText, getByLabelText } = render(
      <ListaDeExcecoes
        excecoes={[
          { date: "2026-09-21", closed: false, opens: "10:00", closes: "14:00" },
          { date: "2026-09-28", closed: true },
        ]}
        onRemover={onRemover}
      />
    );
    expect(getByText("21/09/2026")).toBeTruthy();
    expect(getByText("10:00 às 14:00")).toBeTruthy();
    expect(getByText("Fechado")).toBeTruthy();
    fireEvent.press(getByLabelText("Remover 28/09/2026"));
    expect(onRemover).toHaveBeenCalledWith("2026-09-28");
  });
});
