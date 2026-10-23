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

  // DEC-124: ao ativar, a validade (hora do Painel) e o Saiba mais.
  it("ao ativar, mostra ate quando vale e o Saiba mais traz dias e regras", async () => {
    const nova = {
      ...CAMPANHA,
      id: "c2",
      ends_at: "2026-11-17T21:30:00-03:00",
      weekdays: "TUESDAY,WEDNESDAY,THURSDAY",
      description: "R$ 5 de desconto no primeiro corte.",
    };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(nova)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "lancamento");
    fireEvent.press(r.getByTestId("cupom-usar"));
    expect(await r.findByText("Válido até 17/11 às 21:30")).toBeTruthy();
    expect(r.getByText("Se não usar até lá, perde o cupom.")).toBeTruthy();
    fireEvent.press(r.getByTestId("cupom-saiba-mais-abrir"));
    expect(r.getByText("Vale terças, quartas e quintas.")).toBeTruthy();
    expect(r.getByText("R$ 5 de desconto no primeiro corte.")).toBeTruthy();
  });

  it("campanha sem fim nao mostra o aviso de validade", async () => {
    const sem = { id: "c3", name: "Aberta", type: "DISCOUNT" };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(sem)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "aberta");
    fireEvent.press(r.getByTestId("cupom-usar"));
    await r.findAllByText("Aberta");
    expect(r.queryByTestId("cupom-validade")).toBeNull();
  });
});
