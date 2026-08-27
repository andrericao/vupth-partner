import { Alert } from "react-native";
import { comingSoon } from "../comingSoon";

describe("comingSoon", () => {
  afterEach(() => jest.restoreAllMocks());

  it("mostra alerta 'Em breve' com o nome da feature", () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    comingSoon("O controle de status");
    expect(spy).toHaveBeenCalledWith("Em breve", expect.stringContaining("O controle de status"));
  });

  it("usa texto padrao quando chamado sem argumento", () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    comingSoon();
    expect(spy).toHaveBeenCalledWith("Em breve", expect.stringContaining("Essa funcionalidade"));
  });
});
