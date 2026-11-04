import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { ApagarLojaModal } from "../ApagarLojaModal";
import { impedimentosDaExclusao } from "@lib/impedimentosDaLoja";

const imp = impedimentosDaExclusao({
  response: {
    status: 409,
    data: {
      blockers: [
        { code: "ESTABLISHMENT_HAS_PROFESSIONALS", count: 1, items: [{ id: "p1", name: "Ana" }] },
        { code: "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES", count: 1, items: [{ id: "a1", name: "Carlos" }] },
      ],
    },
  },
});

describe("ApagarLojaModal: impedimentos (DEC-173)", () => {
  it("sem impedimentos: nao mostra a lista", () => {
    const { queryByTestId } = render(<ApagarLojaModal visible nomeDaLoja="L" onConfirm={jest.fn()} onClose={jest.fn()} />);
    expect(queryByTestId("impedimentos-da-loja")).toBeNull();
  });

  it("lista os impedimentos, remove o profissional e abre o atalho dos atendimentos", () => {
    const remover = jest.fn();
    const atalho = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <ApagarLojaModal visible nomeDaLoja="L" impedimentos={imp} onRemoverProfissional={remover} onAtalho={atalho} onConfirm={jest.fn()} onClose={jest.fn()} />
    );
    expect(getByText("1 profissional na loja")).toBeTruthy();
    expect(getByText("Ana")).toBeTruthy();
    expect(getByText("Carlos")).toBeTruthy();
    fireEvent.press(getByTestId("remover-da-loja-p1"));
    expect(remover).toHaveBeenCalledWith("p1");
    expect(queryByTestId("remover-da-loja-a1")).toBeNull();
    fireEvent.press(getByTestId("atalho-ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES"));
    expect(atalho).toHaveBeenCalledWith("/(owner)/(tabs)/attendances");
  });
});
