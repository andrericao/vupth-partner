import { fireEvent, render } from "@testing-library/react-native";
import { ConvitesDePosse } from "../ConvitesDePosse";

const convite = {
  id: "t1",
  establishment_id: "e1",
  establishment_name: "Barbearia Ana",
  from_owner_name: "Ana",
  created_at: "2026-10-08T12:00:00Z",
  status: "PENDING",
};

// O convidado aceita ou recusa a posse (S41-2).
describe("ConvitesDePosse", () => {
  it("sem convites, nao aparece", () => {
    const { toJSON } = render(<ConvitesDePosse convites={[]} ocupadoId={null} onAceitar={jest.fn()} onRecusar={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it("mostra quem oferece qual loja e responde", () => {
    const onAceitar = jest.fn();
    const onRecusar = jest.fn();
    const { getByText } = render(
      <ConvitesDePosse convites={[convite]} ocupadoId={null} onAceitar={onAceitar} onRecusar={onRecusar} />
    );
    expect(getByText(/Ana quer passar a posse de Barbearia Ana para você/)).toBeTruthy();
    fireEvent.press(getByText("Aceitar"));
    fireEvent.press(getByText("Recusar"));
    expect(onAceitar).toHaveBeenCalledWith("t1");
    expect(onRecusar).toHaveBeenCalledWith("t1");
  });

  it("respondendo, os botoes daquele convite ficam travados", () => {
    const onAceitar = jest.fn();
    const { getByText } = render(
      <ConvitesDePosse convites={[convite]} ocupadoId="t1" onAceitar={onAceitar} onRecusar={jest.fn()} />
    );
    fireEvent.press(getByText("Aceitar"));
    expect(onAceitar).not.toHaveBeenCalled();
  });
});
