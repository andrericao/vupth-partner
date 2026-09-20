import { pedirParaNaoTraduzir } from "@lib/naoTraduzir";

function docFalso() {
  const criados: any[] = [];
  const atributos: Record<string, string> = {};
  const classes: string[] = [];
  const filhos: any[] = [];
  return {
    criados,
    atributos,
    classes,
    filhos,
    documentElement: {
      setAttribute: (k: string, v: string) => (atributos[k] = v),
      classList: { add: (c: string) => classes.push(c) },
    },
    head: { appendChild: (n: any) => filhos.push(n) },
    querySelector: () => (filhos.length ? filhos[0] : null),
    createElement: () => {
      const attrs: Record<string, string> = {};
      const el = { attrs, setAttribute: (k: string, v: string) => (attrs[k] = v) };
      criados.push(el);
      return el;
    },
  } as any;
}

describe("pedirParaNaoTraduzir", () => {
  it("marca a página nas três formas que os navegadores leem", () => {
    const d = docFalso();
    expect(pedirParaNaoTraduzir(d)).toBe(true);
    expect(d.atributos.translate).toBe("no");
    expect(d.classes).toContain("notranslate");
    expect(d.criados[0].attrs).toEqual({ name: "google", content: "notranslate" });
    expect(d.filhos).toHaveLength(1);
  });

  it("não duplica a meta se ela já existe", () => {
    const d = docFalso();
    pedirParaNaoTraduzir(d);
    pedirParaNaoTraduzir(d);
    expect(d.filhos).toHaveLength(1);
  });

  it("sem document (aparelho), não faz nada e não quebra", () => {
    expect(pedirParaNaoTraduzir(null)).toBe(false);
  });
});
