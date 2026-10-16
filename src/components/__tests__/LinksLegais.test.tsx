import { Linking } from "react-native";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { LinksLegais, linkLegal } from "../LinksLegais";

jest.mock("@lib/api", () => ({ API_ENV: "staging" }));

// termos-no-rodape (PAR-4, Andre 15/10): Termos de uso e Política de
// privacidade no rodapé, nas páginas legais do web do Client.
describe("LinksLegais", () => {
  it("os links: produção no vupth.pages.dev, o resto no dev", () => {
    expect(linkLegal("termos", "prod")).toBe("https://vupth.pages.dev/termos");
    expect(linkLegal("privacidade", "prod")).toBe("https://vupth.pages.dev/privacidade");
    expect(linkLegal("termos")).toBe("https://dev.vupth.pages.dev/termos");
  });

  it("cada texto abre a sua página", async () => {
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    render(<LinksLegais />);
    fireEvent.press(screen.getByText("Termos de uso"));
    fireEvent.press(screen.getByText("Política de privacidade"));
    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(2));
    expect(abrir).toHaveBeenNthCalledWith(1, "https://dev.vupth.pages.dev/termos");
    expect(abrir).toHaveBeenNthCalledWith(2, "https://dev.vupth.pages.dev/privacidade");
  });

  it("sem navegador: não derruba a tela", async () => {
    const abrir = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("sem"));
    render(<LinksLegais className="mt-2" />);
    fireEvent.press(screen.getByTestId("link-termos"));
    await waitFor(() => expect(abrir).toHaveBeenCalled());
    expect(screen.getByTestId("links-legais")).toBeTruthy();
  });
});
