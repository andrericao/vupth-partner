import { render } from "@testing-library/react-native";
import { NotificationBadge } from "../NotificationBadge";

describe("NotificationBadge", () => {
  it("nao renderiza nada quando nao ha notificacao", () => {
    const view = render(<NotificationBadge count={0} />);
    expect(view.queryByTestId("notification-badge")).toBeNull();
  });

  it("mostra a contagem", () => {
    const view = render(<NotificationBadge count={3} />);
    expect(view.getByTestId("notification-badge")).toBeTruthy();
    expect(view.getByText("3")).toBeTruthy();
  });

  it("acima de 9 mostra '9+'", () => {
    const view = render(<NotificationBadge count={12} />);
    expect(view.getByText("9+")).toBeTruthy();
  });

  it("anuncia a contagem p/ leitor de tela (singular e plural)", () => {
    expect(render(<NotificationBadge count={1} />).getByLabelText("1 notificacao")).toBeTruthy();
    expect(render(<NotificationBadge count={4} />).getByLabelText("4 notificacoes")).toBeTruthy();
  });

  it("aceita testID proprio (p/ distinguir badges na mesma tela)", () => {
    const view = render(<NotificationBadge count={2} testID="menu-badge-requests" />);
    expect(view.getByTestId("menu-badge-requests")).toBeTruthy();
  });
});
