import { commitDoCodigo } from "@lib/commitDoCodigo";

// Andre, 03/10 (bateria-confere-versao): a bateria confere, antes de comecar,
// que o app instalado e o codigo certo. O app.config.js carimba o commit em
// extra.commit — no build (EAS) e no OTA (eas update, local).
describe("commitDoCodigo", () => {
  it("le o commit carimbado em extra.commit", () => {
    expect(commitDoCodigo({ extra: { commit: "dc28e95" } })).toBe("dc28e95");
  });

  it("sem config, sem extra ou sem commit: null", () => {
    expect(commitDoCodigo(null)).toBeNull();
    expect(commitDoCodigo(undefined)).toBeNull();
    expect(commitDoCodigo({})).toBeNull();
    expect(commitDoCodigo({ extra: {} })).toBeNull();
  });

  it("commit que nao e texto ou vem vazio: null", () => {
    expect(commitDoCodigo({ extra: { commit: 42 } })).toBeNull();
    expect(commitDoCodigo({ extra: { commit: "  " } })).toBeNull();
  });
});
