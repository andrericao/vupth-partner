import { baseDoWebCliente, linkDaLoja, linkDoProfissional, compartilharLink } from "@lib/linkPublico";

// Compartilhar o link da loja e do profissional (pedido do Andre, 24/09). O
// Client publicou as paginas publicas em 26/09 (84983b0c) e mandou o formato:
//   loja:         {WEB}/loja/{establishmentId}
//   profissional: {WEB}/loja/{establishmentId}?profissional={professionalId}
// {WEB} = https://vupth.pages.dev (producao) ou https://dev.vupth.pages.dev (staging).
describe("links publicos", () => {
  it("staging e local usam o web de teste; producao o de producao", () => {
    expect(baseDoWebCliente("prod")).toBe("https://vupth.pages.dev");
    expect(baseDoWebCliente("staging")).toBe("https://dev.vupth.pages.dev");
    expect(baseDoWebCliente("dev")).toBe("https://dev.vupth.pages.dev");
    expect(baseDoWebCliente("local")).toBe("https://dev.vupth.pages.dev");
  });

  it("o formato combinado com o Client", () => {
    expect(linkDaLoja("prod", "e1")).toBe("https://vupth.pages.dev/loja/e1");
    expect(linkDoProfissional("staging", "e1", "p9")).toBe(
      "https://dev.vupth.pages.dev/loja/e1?profissional=p9"
    );
  });
});

describe("compartilharLink", () => {
  const texto = { titulo: "Minha loja", mensagem: "Entre na fila:" };

  it("no aparelho: abre o compartilhar do sistema com a mensagem e o link", async () => {
    const share = jest.fn(async () => ({ action: "sharedAction" }));
    const r = await compartilharLink("https://x/loja/1", texto, { plataforma: "android", share });
    expect(share).toHaveBeenCalledWith({ title: "Minha loja", message: "Entre na fila: https://x/loja/1" });
    expect(r).toBe("compartilhado");
  });

  it("na web sem compartilhar nativo: copia o link", async () => {
    const copiar = jest.fn(async () => undefined);
    const r = await compartilharLink("https://x/loja/1", texto, {
      plataforma: "web",
      navegadorCompartilha: false,
      copiar,
    });
    expect(copiar).toHaveBeenCalledWith("https://x/loja/1");
    expect(r).toBe("copiado");
  });

  it("nada deu certo: devolve o link para mostrar na tela", async () => {
    const r = await compartilharLink("https://x/loja/1", texto, {
      plataforma: "web",
      navegadorCompartilha: false,
      copiar: async () => {
        throw new Error("sem permissao");
      },
    });
    expect(r).toBe("falhou");
  });
});

describe("compartilharLink — caminhos padrao do navegador", () => {
  const texto = { titulo: "Minha loja", mensagem: "Entre na fila:" };
  const nav = globalThis.navigator as any;
  const antes = { share: nav?.share, clipboard: nav?.clipboard };
  afterEach(() => {
    nav.share = antes.share;
    Object.defineProperty(nav, "clipboard", { value: antes.clipboard, configurable: true });
  });

  it("usa o navigator.share quando o navegador tem", async () => {
    nav.share = jest.fn(async () => undefined);
    const r = await compartilharLink("https://x/loja/1", texto, { plataforma: "web" });
    expect(nav.share).toHaveBeenCalledWith({ title: "Minha loja", text: "Entre na fila:", url: "https://x/loja/1" });
    expect(r).toBe("compartilhado");
  });

  it("navigator.share cancelado: copia pela area de transferencia", async () => {
    nav.share = jest.fn(async () => {
      throw new Error("cancelado");
    });
    const writeText = jest.fn(async () => undefined);
    Object.defineProperty(nav, "clipboard", { value: { writeText }, configurable: true });
    const r = await compartilharLink("https://x/loja/1", texto, { plataforma: "web" });
    expect(writeText).toHaveBeenCalledWith("https://x/loja/1");
    expect(r).toBe("copiado");
  });

  it("sem area de transferencia: falhou", async () => {
    nav.share = undefined;
    Object.defineProperty(nav, "clipboard", { value: undefined, configurable: true });
    expect(await compartilharLink("https://x/loja/1", texto, { plataforma: "web" })).toBe("falhou");
  });

  it("no aparelho, o Share do sistema falhando: falhou", async () => {
    const share = jest.fn(async () => {
      throw new Error("x");
    });
    expect(await compartilharLink("https://x/loja/1", texto, { plataforma: "ios", share })).toBe("falhou");
  });
});
