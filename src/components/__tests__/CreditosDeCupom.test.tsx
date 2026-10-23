import { act, render } from "@testing-library/react-native";
import { CreditosDeCupom } from "@components/CreditosDeCupom";

jest.mock("@lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (_e: any, fallback: string) => fallback,
}));

const CREDITOS = {
  open_amount: 7.5,
  next_payout: "2026-10-30T12:00:00-03:00",
  items: [
    { attendance_id: "a1", campaign: "Lançamento", amount: 5, paid_at: null },
    { attendance_id: "a2", campaign: "Lançamento", amount: 2.5, paid_at: "2026-10-20T12:00:00-03:00" },
  ],
};

describe("CreditosDeCupom", () => {
  it("mostra o que falta receber, o repasse e cada credito", async () => {
    const { findByText, getAllByTestId } = render(<CreditosDeCupom listar={jest.fn().mockResolvedValue(CREDITOS)} />);
    expect(await findByText("R$ 7,50 a receber")).toBeTruthy();
    expect(await findByText("repasse em 30/10")).toBeTruthy();
    expect(getAllByTestId("credito-item")).toHaveLength(2);
    expect(await findByText("R$ 5,00 · a receber")).toBeTruthy();
    expect(await findByText("R$ 2,50 · pago")).toBeTruthy();
  });

  it("sem credito ou com falha, o bloco some", async () => {
    const vazio = render(
      <CreditosDeCupom listar={jest.fn().mockResolvedValue({ open_amount: 0, items: [] })} />,
    );
    const falha = render(<CreditosDeCupom listar={jest.fn().mockRejectedValue(new Error("x"))} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(vazio.queryByTestId("creditos-de-cupom")).toBeNull();
    expect(falha.queryByTestId("creditos-de-cupom")).toBeNull();
  });
});
