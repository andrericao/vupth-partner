import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { OferecerPixDoDono } from "../OferecerPixDoDono";

// interruptor-pix-do-dono (DEC-138): padrao desligado; salva ao tocar.
describe("OferecerPixDoDono", () => {
  it("vem desligado quando o servidor diz false", async () => {
    render(<OferecerPixDoDono obter={jest.fn().mockResolvedValue(false)} salvar={jest.fn()} />);
    const chave = await screen.findByTestId("oferecer-pix-do-dono");
    expect(chave.props.value).toBe(false);
    expect(screen.getByText("O cliente paga só na sua chave Pix.")).toBeTruthy();
  });

  it("ligar salva true e mostra o texto de ligado", async () => {
    const salvar = jest.fn().mockResolvedValue(true);
    render(<OferecerPixDoDono obter={jest.fn().mockResolvedValue(false)} salvar={salvar} />);
    fireEvent(await screen.findByTestId("oferecer-pix-do-dono"), "valueChange", true);
    await waitFor(() => expect(screen.getByTestId("oferecer-pix-do-dono").props.value).toBe(true));
    expect(salvar).toHaveBeenCalledWith(true);
    expect(screen.getByText(/pagar também no Pix do dono/)).toBeTruthy();
  });

  it("se salvar falhar, mantem o valor e avisa", async () => {
    const salvar = jest.fn().mockRejectedValue(new Error("x"));
    render(<OferecerPixDoDono obter={jest.fn().mockResolvedValue(false)} salvar={salvar} />);
    fireEvent(await screen.findByTestId("oferecer-pix-do-dono"), "valueChange", true);
    expect(await screen.findByText(/Não foi possível salvar/)).toBeTruthy();
    expect(screen.getByTestId("oferecer-pix-do-dono").props.value).toBe(false);
  });

  it("se carregar falhar, avisa", async () => {
    render(<OferecerPixDoDono obter={jest.fn().mockRejectedValue(new Error("x"))} salvar={jest.fn()} />);
    expect(await screen.findByText("Não foi possível carregar esta opção.")).toBeTruthy();
  });
});
