import { carregarExpoImage } from "@lib/modulosNativos";

// expo-image (melhoria de 02/10) e NATIVO: o binario 1.4.0 nao tem o ExpoImage.
// O require do JS nao basta para saber — por isso a pergunta vai ao
// expo-modules-core antes. Ausente: null, e a foto cai no Image do RN.
const mockOptional = jest.fn();
jest.mock("expo-modules-core", () => ({
  ...jest.requireActual("expo-modules-core"),
  requireOptionalNativeModule: (nome: string) => mockOptional(nome),
}));
jest.mock("expo-image", () => ({ Image: "ExpoImage" }));


describe("carregarExpoImage", () => {
  it("binario sem o ExpoImage: null, sem nem carregar o JS", () => {
    mockOptional.mockReturnValue(null);
    expect(carregarExpoImage()).toBeNull();
    expect(mockOptional).toHaveBeenCalledWith("ExpoImage");
  });

  it("binario com o ExpoImage: o modulo", () => {
    mockOptional.mockReturnValue({});
    expect(carregarExpoImage()?.Image).toBe("ExpoImage");
  });
});
