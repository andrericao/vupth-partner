import { render, screen, fireEvent } from "@testing-library/react-native";
import { Avatar, iniciais } from "../Avatar";

// A foto do profissional (S22) — ou as iniciais, quando nao ha foto.
describe("Avatar", () => {
  it("sem foto: as iniciais", () => {
    render(<Avatar nome="Ana Maria Souza" />);
    expect(screen.getByText("AS")).toBeTruthy();
  });

  it("com foto: a imagem, sem as iniciais", () => {
    render(<Avatar nome="Ana" uri="https://pub.r2.dev/profile/a.jpg" testID="avatar" />);
    // O expo-image (FotoRemota) entrega a fonte como lista; o Image do RN, como objeto.
    expect([screen.getByTestId("avatar-foto").props.source].flat()).toEqual([
      { uri: "https://pub.r2.dev/profile/a.jpg" },
    ]);
    expect(screen.queryByText("A")).toBeNull();
  });

  it("com onPress vira botao", () => {
    const onPress = jest.fn();
    render(<Avatar nome="Ana" onPress={onPress} rotulo="Trocar foto" />);
    fireEvent.press(screen.getByLabelText("Trocar foto"));
    expect(onPress).toHaveBeenCalled();
  });

  it("iniciais: primeira e ultima; sem nome, ?", () => {
    expect(iniciais("joao")).toBe("J");
    expect(iniciais(null)).toBe("?");
    expect(iniciais("  ")).toBe("?");
  });
});
