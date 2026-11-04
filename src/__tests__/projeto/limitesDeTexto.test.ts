import { readFileSync } from "fs";
import { join } from "path";
import { INSTAGRAM_MAX, NOME_MAX } from "@lib/limitesDeTexto";

// fraquezas F12: os campos de nome tem teto de tamanho; a foto sobe sempre reencodada.
const raiz = join(__dirname, "..", "..", "..");
const ler = (p: string) => readFileSync(join(raiz, p), "utf8");

describe("limites de texto (F12)", () => {
  it("os tetos sao razoaveis", () => {
    expect(NOME_MAX).toBeLessThanOrEqual(120);
    expect(INSTAGRAM_MAX).toBeLessThanOrEqual(60);
  });

  it.each([
    ["app/(owner)/nova-loja.tsx", 1],
    ["app/(owner)/onboarding/establishment.tsx", 2],
    ["app/(owner)/(tabs)/establishment-registration.tsx", 2],
  ])("%s: campos de nome com maxLength", (arq, qtd) => {
    const usos = ler(arq).match(/maxLength=\{(NOME_MAX|INSTAGRAM_MAX)\}/g) ?? [];
    expect(usos.length).toBe(qtd);
  });

  it("a foto e sempre reencodada em JPEG (o EXIF, com a localizacao, nao sobe)", () => {
    const src = ler("src/lib/fotoDePerfil.ts");
    expect(src).toMatch(/manipulateAsync\(uri, acoes, \{[^}]*format: M\.SaveFormat\.JPEG/s);
  });
});
