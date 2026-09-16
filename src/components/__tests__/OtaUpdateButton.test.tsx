import { fireEvent, render } from "@testing-library/react-native";

import { OtaUpdateButton } from "../OtaUpdateButton";

// jest.mock e icado pelo babel: vale mesmo abaixo do import.

jest.mock("expo-updates", () => ({
  runtimeVersion: "1.3.0",
  channel: "staging",
  updateId: "abcdef1234567890",
  createdAt: null,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// O painel dos 7 toques e o mesmo gesto do client (Alexia 21/08) e, desde
// 16/09, o mesmo conteudo: tempo real + push.
describe("OtaUpdateButton", () => {
  it("mostra versao, canal e OTA numa linha so", () => {
    const { getByTestId } = render(<OtaUpdateButton />);
    expect(getByTestId("version-line")).toHaveTextContent("1.3.0 · staging · OTA abcdef12");
  });

  it("o painel so abre no 7o toque, com os DOIS cartoes", () => {
    const { getByTestId, queryByTestId } = render(<OtaUpdateButton />);
    for (let i = 0; i < 6; i++) fireEvent.press(getByTestId("version-line"));
    expect(queryByTestId("ws-diagnostics")).toBeNull();

    fireEvent.press(getByTestId("version-line"));
    expect(getByTestId("ws-diagnostics")).toBeTruthy();
    expect(getByTestId("push-diagnostics")).toBeTruthy();
  });
});
