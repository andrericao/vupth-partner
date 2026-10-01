import { render, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";

import { OtaUpdateButton } from "../OtaUpdateButton";

// No navegador o expo-updates nao tem runtime, canal nem OTA.
jest.mock("expo-updates", () => ({
  runtimeVersion: null,
  channel: null,
  updateId: null,
  createdAt: null,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// 🔴 Andre, 18/09: "para web não precisa explicar que é diferente do app; ao
// clicar em qualquer botão a versão irá atualizar. Só deixe as informações
// pertinentes: versão, data, hora de lançamento". No navegador o bundle novo
// chega em qualquer navegação, então o botão "Verificar atualização" só levaria
// a um erro e a explicação do Ctrl+Shift+R era ruído.
describe("OtaUpdateButton no navegador", () => {
  const original = Platform.OS;
  beforeAll(() => {
    Object.defineProperty(Platform, "OS", { get: () => "web", configurable: true });
  });
  afterAll(() => {
    Object.defineProperty(Platform, "OS", { get: () => original, configurable: true });
  });

  // Andre, 26/09: a web mostra a versao do app e a data — do BUILD, carimbada
  // pelo build:web (EXPO_PUBLIC_BUILD_TIME) — e nao tem os 7 toques.
  const buildOriginal = process.env.EXPO_PUBLIC_BUILD_TIME;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BUILD_TIME = "2026-09-26T18:30:00Z";
  });
  afterEach(() => {
    process.env.EXPO_PUBLIC_BUILD_TIME = buildOriginal;
  });

  it("mostra a versão do app, 'web' e a data/hora do build", () => {
    const { getByTestId } = render(<OtaUpdateButton />);
    const linha = getByTestId("version-line");
    expect(linha).toHaveTextContent(/\d+\.\d+\.\d+ · web · /);
    expect(linha).toHaveTextContent(/2026/);
    expect(linha).not.toHaveTextContent(/bundle embutido/);
  });

  it("sete toques na versão não abrem o diagnóstico", () => {
    const { getByTestId, queryByText } = render(<OtaUpdateButton />);
    for (let i = 0; i < 7; i++) fireEvent.press(getByTestId("version-line"));
    expect(queryByText(/Tempo real/)).toBeNull();
    expect(queryByText(/Push/)).toBeNull();
  });

  it("não mostra o botão de verificar atualização", () => {
    const { queryByTestId } = render(<OtaUpdateButton />);
    expect(queryByTestId("check-update")).toBeNull();
  });
});
