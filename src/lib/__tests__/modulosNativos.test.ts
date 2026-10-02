import { carregarClipboard, carregarLocation, carregarImagePicker, carregarImageManipulator } from "@lib/modulosNativos";

// Modulo nativo ausente nao derruba a tela (Andre, 27/09): devolve null.
jest.mock("expo-clipboard", () => {
  throw new Error("Cannot find native module 'ExpoClipboard'");
});
jest.mock("expo-location", () => ({ getCurrentPositionAsync: jest.fn() }));

describe("modulosNativos", () => {
  it("modulo que falha ao carregar vira null, sem lancar", () => {
    expect(carregarClipboard()).toBeNull();
  });

  it("modulo presente volta normalmente", () => {
    expect(carregarLocation()).not.toBeNull();
    expect(carregarImagePicker()).not.toBeNull();
    expect(carregarImageManipulator()).not.toBeNull();
  });
});
