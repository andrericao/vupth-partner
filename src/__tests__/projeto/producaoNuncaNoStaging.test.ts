import fs from "fs";
import path from "path";
import { CANAL_PARA_ENV, resolveApiEnv } from "@lib/apiEnv";

// fraquezas F20: a trava que fica. A faixa visivel AMBIENTE DE TESTE saiu
// (tirar-faixa-de-ambiente, Andre 03/11: "nao pedi frase de ambiente de teste na
// parte superior da tela"); o aviso de teste e so a frase sob o V na abertura.
describe("a producao nunca aponta para o staging", () => {
  it("so o canal production vira prod, e ele vira prod com qualquer .env", () => {
    expect(Object.entries(CANAL_PARA_ENV).filter(([, e]) => e === "prod").map(([c]) => c)).toEqual(["production"]);
    for (const env of ["local", "dev", "staging", "prod", undefined]) {
      expect(resolveApiEnv("production", env)).toBe("prod");
    }
  });

  it("os canais de teste nunca viram prod", () => {
    expect(resolveApiEnv("preview", "prod")).toBe("staging");
    expect(resolveApiEnv("development", "prod")).toBe("staging");
  });
});

describe("a faixa AMBIENTE DE TESTE nao volta ao topo", () => {
  it("o layout raiz nao monta faixa de ambiente", () => {
    const raiz = path.join(__dirname, "..", "..", "..");
    const layout = fs.readFileSync(path.join(raiz, "app", "_layout.tsx"), "utf8");
    expect(layout).not.toMatch(/FaixaDeAmbiente|AMBIENTE DE TESTE/);
    expect(fs.existsSync(path.join(raiz, "src", "components", "FaixaDeAmbiente.tsx"))).toBe(false);
  });
});
