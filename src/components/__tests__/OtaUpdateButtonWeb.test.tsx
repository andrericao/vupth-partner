import { render } from "@testing-library/react-native";
import { Platform } from "react-native";

import { OtaUpdateButton } from "../OtaUpdateButton";

jest.mock("expo-updates", () => ({
  runtimeVersion: "1.3.0",
  channel: "staging",
  updateId: "abcdef1234567890",
  createdAt: new Date("2026-09-18T14:05:00Z"),
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

  it("mostra versão, canal e a data/hora do lançamento", () => {
    const { getByTestId } = render(<OtaUpdateButton />);
    const linha = getByTestId("version-line");
    expect(linha).toHaveTextContent(/1\.3\.0/);
    expect(linha).toHaveTextContent(/staging/);
    expect(linha).toHaveTextContent(/OTA abcdef12/);
    // data e hora do lancamento, no formato do aparelho
    expect(linha).toHaveTextContent(/2026/);
  });

  it("não mostra o botão de verificar atualização", () => {
    const { queryByTestId } = render(<OtaUpdateButton />);
    expect(queryByTestId("check-update")).toBeNull();
  });
});
