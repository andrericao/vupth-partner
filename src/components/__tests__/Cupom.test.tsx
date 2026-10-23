import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Cupom } from "@components/Cupom";

jest.mock("@lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (_e: any, fallback: string) => fallback,
}));

// cupom-no-app (DEC-61, DEC-63): campo, "Usar" e os cupons ja usados.
const CAMPANHA = { id: "c1", name: "Lançamento", type: "FEE_WAIVER", ends_at: "2026-11-30T12:00:00-03:00" };

describe("Cupom", () => {
  it("lista os cupons ja usados", async () => {
    const { findByText } = render(
      <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([CAMPANHA])} />
    );
    expect(await findByText("Lançamento")).toBeTruthy();
    expect(await findByText("Sem taxa · até 30/11")).toBeTruthy();
  });

  it("cupom usado ou vencido leva o rotulo", async () => {
    const { findByText } = render(
      <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([{ ...CAMPANHA, status: "EXPIRED" }])} />,
    );
    expect(await findByText("Sem taxa · até 30/11 · vencido")).toBeTruthy();
  });

  it("vazio: pede o cupom e nao chama a API", async () => {
    const usar = jest.fn();
    const { getByTestId, findByText } = render(<Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Digite o cupom.")).toBeTruthy();
    expect(usar).not.toHaveBeenCalled();
  });

  it("usou: o cupom entra na lista e o campo limpa", async () => {
    const usar = jest.fn().mockResolvedValue(CAMPANHA);
    const { getByTestId, findByText } = render(<Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(getByTestId("cupom-codigo"), "vupth10");
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Lançamento")).toBeTruthy();
    expect(usar).toHaveBeenCalledWith("vupth10");
    await waitFor(() => expect(getByTestId("cupom-codigo").props.value).toBe(""));
  });

  it("recusado: a frase curta no campo", async () => {
    const usar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_ALREADY_REDEEMED" } } });
    const { getByTestId, findByText } = render(
      <Cupom usar={usar} listar={jest.fn().mockRejectedValue(new Error("x"))} />
    );
    fireEvent.changeText(getByTestId("cupom-codigo"), "VUPTH10");
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Você já usou este cupom.")).toBeTruthy();
  });
});
