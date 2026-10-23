import { render, fireEvent } from "@testing-library/react-native";
import { PromocaoEncerradaModal } from "@components/PromocaoEncerradaModal";

// DEC-124: duas mensagens distintas, encerrada e esgotada.
describe("PromocaoEncerradaModal", () => {
  it("encerrada e esgotada dizem coisas diferentes", () => {
    const a = render(<PromocaoEncerradaModal motivo="ENCERRADA" aoFechar={jest.fn()} />);
    expect(a.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção encerrada");
    a.unmount();
    const b = render(<PromocaoEncerradaModal motivo="ESGOTADA" aoFechar={jest.fn()} />);
    expect(b.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção esgotada");
  });

  it("sem motivo, nao aparece; Entendi fecha", () => {
    const fechar = jest.fn();
    const r = render(<PromocaoEncerradaModal motivo={null} aoFechar={fechar} />);
    expect(r.queryByTestId("promocao-modal")).toBeNull();
    r.rerender(<PromocaoEncerradaModal motivo="ESGOTADA" aoFechar={fechar} />);
    fireEvent.press(r.getByTestId("promocao-modal-fechar"));
    expect(fechar).toHaveBeenCalled();
  });
});
