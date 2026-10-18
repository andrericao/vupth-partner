import fs from "fs";
import path from "path";

// v-estilizado-pelo-front (Andre, 18/10): o V da marca em assets/marca/, o
// favicon na web e o icone e a cor da notificacao do Android. O icone e peca
// NATIVA: so vale com build novo, e sem esta guarda um arquivo apagado so
// apareceria no build.
const ROOT = path.resolve(__dirname, "../../..");
const arq = (p: string) => path.join(ROOT, p);
const png = (p: string) => {
  const b = fs.readFileSync(arq(p));
  // assinatura PNG e o IHDR: largura e altura em 16..24
  expect(b.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), alfa: b[25] === 6 };
};

describe("marca — V estilizado", () => {
  it("icone da notificacao: 96x96 com transparencia", () => {
    const i = png("assets/marca/v-notificacao-96.png");
    expect([i.w, i.h]).toEqual([96, 96]);
    expect(i.alfa).toBe(true);
  });

  it("favicons PNG nos tamanhos pedidos (16, 32, 180 e 512)", () => {
    expect(png("assets/marca/favicon-16.png").w).toBe(16);
    expect(png("assets/marca/favicon-32.png").w).toBe(32);
    expect(png("assets/marca/apple-touch-icon-180.png").w).toBe(180);
    expect(png("assets/marca/favicon-512.png").w).toBe(512);
  });

  it("SVG do V e do favicon existem e sao vetor", () => {
    expect(fs.readFileSync(arq("assets/marca/v.svg"), "utf8")).toContain("<path");
    expect(fs.readFileSync(arq("assets/marca/favicon.svg"), "utf8")).toContain("<path");
  });

  it("o app.json poe o icone e a cor no plugin do expo-notifications", () => {
    const plugins = JSON.parse(fs.readFileSync(arq("app.json"), "utf8")).expo.plugins;
    const par = plugins.find((p: unknown) => Array.isArray(p) && p[0] === "expo-notifications");
    expect(par?.[1]).toEqual({ icon: "./assets/marca/v-notificacao-96.png", color: "#163300" });
    expect(fs.existsSync(arq("assets/marca/v-notificacao-96.png"))).toBe(true);
  });

  it("a web serve o favicon: arquivos em public/ e as tags no index.html", () => {
    const html = fs.readFileSync(arq("public/index.html"), "utf8");
    for (const f of ["favicon.svg", "favicon-16.png", "favicon-32.png", "favicon-512.png", "apple-touch-icon.png"]) {
      expect(fs.existsSync(arq(`public/${f}`))).toBe(true);
      expect(html).toContain(`/${f}`);
    }
  });
});
