import { fireEvent, render, screen } from "@testing-library/react-native";
import { SaldosComOApp } from "../SaldosComOApp";
import type { ProfessionalReport } from "@store/professional.store";

const base = { totalAttendances: 1, totalRevenue: 0, avgDurationMinutes: 0, topService: null } as ProfessionalReport;

describe("SaldosComOApp", () => {
  it("sem saldo e sem corte com desconto: nada na tela", () => {
    render(<SaldosComOApp report={base} />);
    expect(screen.queryByTestId("saldos-secao")).toBeNull();
    render(<SaldosComOApp report={null} />);
    expect(screen.queryByTestId("saldos-secao")).toBeNull();
  });

  it("mostra a receber, a pagar, o saldo e o calculo do corte com a flag", () => {
    const report = {
      ...base,
      to_receive_total: 7.1,
      to_pay_total: 2.9,
      net_total: 4.2,
      cuts: [
        {
          attendance_id: "c1",
          finished_at: null,
          breakdown: { discounted: true, list_price: 32.9, discount: 10, penalties: 0, client_pays: 22.9, pro_receives: 30, app_pays: 7.1 },
        },
        { attendance_id: "c2", breakdown: { discounted: false } },
      ],
    } as ProfessionalReport;
    render(<SaldosComOApp report={report} />);
    // a secao abre fechada, como as outras do Relatorios
    expect(screen.queryByTestId("saldo-a-receber")).toBeNull();
    fireEvent.press(screen.getByTestId("saldos-secao-titulo"));
    expect(screen.getByTestId("saldo-a-receber").props.children).toBe("R$ 7,10");
    expect(screen.getByTestId("saldo-a-pagar").props.children).toBe("R$ 2,90");
    expect(screen.getByTestId("saldo-liquido").props.children).toBe("R$ 4,20");
    expect(screen.getAllByTestId("saldos-calculo")).toHaveLength(1);
    expect(screen.getByText("PAGAMENTO COM DESCONTO")).toBeTruthy();
    expect(screen.getByText("O app cobre")).toBeTruthy();
  });
});
