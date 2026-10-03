import { render } from "@testing-library/react-native";

import { CommitDoCodigo } from "../CommitDoCodigo";

const mockConstants: { expoConfig: unknown } = { expoConfig: { extra: { commit: "dc28e95" } } };
// O jest.mock e icado acima dos imports; o default le o objeto so na hora do uso.
jest.mock("expo-constants", () => ({
  __esModule: true,
  get default() {
    return mockConstants;
  },
}));

// A bateria le o app-commit na tela de entrada (bateria-confere-versao).
describe("CommitDoCodigo", () => {
  it("mostra o commit carimbado, com o testID que a bateria le", () => {
    const { getByTestId } = render(<CommitDoCodigo />);
    expect(getByTestId("app-commit")).toHaveTextContent("dc28e95");
  });

  it("sem carimbo (dev sem git): nao mostra nada", () => {
    mockConstants.expoConfig = { extra: {} };
    const { queryByTestId } = render(<CommitDoCodigo />);
    expect(queryByTestId("app-commit")).toBeNull();
  });
});
