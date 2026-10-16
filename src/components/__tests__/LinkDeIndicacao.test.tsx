import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { LinkDeIndicacao } from "@components/LinkDeIndicacao";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// link-de-indicacao (DEC-70): o link, quantos chegaram e o Compartilhar.
const MEU = { code: "ABC234", link: "https://vupth.pages.dev/i/ABC234", referred_clients: 1 };

describe("LinkDeIndicacao", () => {
  it("mostra o link e quantos clientes chegaram", async () => {
    const { findByTestId, getByTestId } = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} />);
    expect((await findByTestId("link-indicacao-link")).props.children).toBe(MEU.link);
    expect(getByTestId("link-indicacao-clientes").props.children).toBe("1 cliente chegou pelo seu link.");
  });

  it("com o a receber, mostra a linha; sem, esconde", async () => {
    const com = { ...MEU, credited_clients: 1, to_receive: 5 };
    const r1 = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(com)} />);
    expect((await r1.findByTestId("link-indicacao-receber")).props.children).toBe(
      "1 concluiu o corte · R$ 5,00 a receber"
    );
    r1.unmount();
    const r2 = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} />);
    await r2.findByTestId("link-indicacao-link");
    expect(r2.queryByTestId("link-indicacao-receber")).toBeNull();
  });

  it("Compartilhar manda o link", async () => {
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const { findByTestId } = render(
      <LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} compartilhar={compartilhar} />
    );
    fireEvent.press(await findByTestId("link-indicacao-compartilhar"));
    expect(compartilhar).toHaveBeenCalledWith(MEU.link, expect.objectContaining({ titulo: "Vupth" }));
  });

  it("sem resposta da API, o bloco nao aparece", async () => {
    const carregar = jest.fn().mockRejectedValue(new Error("403"));
    const { queryByTestId } = render(<LinkDeIndicacao carregar={carregar} />);
    await waitFor(() => expect(carregar).toHaveBeenCalled());
    expect(queryByTestId("link-indicacao")).toBeNull();
  });
});
