import { render, fireEvent, screen } from "@testing-library/react-native";
import { FotoEditavel } from "../FotoEditavel";

// Foto com o selo de camera no canto (Andre, 26/09).
describe("FotoEditavel", () => {
  it("mostra a foto com o selo e tocar chama a edicao", () => {
    const onEditar = jest.fn();
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEditar={onEditar} rotulo="Trocar foto de perfil" />);
    expect(screen.getByTestId("foto-editavel-selo")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Trocar foto de perfil"));
    expect(onEditar).toHaveBeenCalled();
  });

  it("sem foto: as iniciais, com o mesmo selo", () => {
    render(<FotoEditavel nome="Barbearia Central" onEditar={jest.fn()} rotulo="Pôr foto da loja" />);
    expect(screen.getByText("BC")).toBeTruthy();
  });
});
