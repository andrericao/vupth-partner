import { render, fireEvent, screen } from "@testing-library/react-native";
import { ConvitePorEmail, emailParece } from "../ConvitePorEmail";

// convite-sem-conta (S30, BAK 0774ad2): quem ainda nao tem conta e convidado
// por e-mail; a lista mostra os que esperam a conta, com Cancelar.
const PENDENTE = {
  id: "inv-1",
  establishmentId: "e1",
  email: "nova@teste.com",
  status: "PENDING",
  createdAt: "2026-10-05T08:00:00",
  convertedAt: null,
  affiliationId: null,
};

describe("emailParece", () => {
  it("aceita nome@dominio.tld e recusa o resto", () => {
    expect(emailParece(" a@b.co ")).toBe(true);
    expect(emailParece("a@b")).toBe(false);
    expect(emailParece("ab.co")).toBe(false);
    expect(emailParece("a b@c.co")).toBe(false);
    expect(emailParece("")).toBe(false);
  });
});

describe("ConvitePorEmail", () => {
  it("com e-mail valido, convida com o texto digitado", () => {
    const onConvidar = jest.fn();
    render(<ConvitePorEmail pendentes={[]} onConvidar={onConvidar} onCancelar={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId("convite-email"), "nova@teste.com");
    fireEvent.press(screen.getByTestId("convite-email-enviar"));
    expect(onConvidar).toHaveBeenCalledWith("nova@teste.com");
  });

  it("com e-mail invalido, o botao nao convida", () => {
    const onConvidar = jest.fn();
    render(<ConvitePorEmail pendentes={[]} onConvidar={onConvidar} onCancelar={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId("convite-email"), "nova@");
    fireEvent.press(screen.getByTestId("convite-email-enviar"));
    expect(onConvidar).not.toHaveBeenCalled();
  });

  it("lista quem espera a conta e cancela pelo id", () => {
    const onCancelar = jest.fn();
    render(<ConvitePorEmail pendentes={[PENDENTE]} onConvidar={jest.fn()} onCancelar={onCancelar} />);
    expect(screen.getByText("nova@teste.com")).toBeTruthy();
    fireEvent.press(screen.getByTestId("convite-email-cancelar-inv-1"));
    expect(onCancelar).toHaveBeenCalledWith(PENDENTE);
  });

  it("sem pendentes, nao mostra a lista", () => {
    render(<ConvitePorEmail pendentes={[]} onConvidar={jest.fn()} onCancelar={jest.fn()} />);
    expect(screen.queryByText("Esperando criar a conta")).toBeNull();
  });
});
