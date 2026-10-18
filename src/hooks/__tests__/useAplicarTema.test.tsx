import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import { useAplicarTema } from "@hooks/useAplicarTema";
import { useTemaStore } from "@store/tema.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
let mockLiberado = true;
jest.mock("@theme/liberacao", () => ({
  get ESCURO_LIBERADO() {
    return mockLiberado;
  },
}));
const mockPedir = jest.fn();
const mockEspelhar = jest.fn();
jest.mock("@lib/aplicarTema", () => ({
  pedirEsquemaAoSistema: (...a: unknown[]) => mockPedir(...a),
  espelharNaWeb: (...a: unknown[]) => mockEspelhar(...a),
}));

describe("useAplicarTema", () => {
  const plataforma = Platform.OS;
  beforeEach(() => {
    jest.clearAllMocks();
    mockLiberado = true;
    useTemaStore.setState({ preferencia: "escuro", restaurado: true });
  });
  afterEach(() => {
    Platform.OS = plataforma;
  });

  it("leva a preferencia ao sistema", () => {
    renderHook(() => useAplicarTema());
    expect(mockPedir).toHaveBeenCalledWith("escuro");
  });

  it("so espelha no <html> na web", () => {
    renderHook(() => useAplicarTema());
    expect(mockEspelhar).not.toHaveBeenCalled();
    Platform.OS = "web";
    renderHook(() => useAplicarTema());
    expect(mockEspelhar).toHaveBeenCalledWith(
      "escuro",
      expect.objectContaining({ background: "#0B1A04" }),
      expect.objectContaining({ "--vupth-surface": "22 51 0" }),
    );
  });

  it("sem a liberacao do escuro nao toca no sistema nem na web: o app fica como era", () => {
    mockLiberado = false;
    Platform.OS = "web";
    renderHook(() => useAplicarTema());
    expect(mockPedir).not.toHaveBeenCalled();
    expect(mockEspelhar).not.toHaveBeenCalled();
  });
});
