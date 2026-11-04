import fs from "fs";
import path from "path";

// ota-gradual (DEC-174): o OTA da producao sai para 10% primeiro; a preview segue a 100%.
const ci = fs.readFileSync(path.resolve(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

describe("OTA gradual da producao", () => {
  it("main -> production sai com --rollout-percentage 10", () => {
    const linha = ci.split("\n").find((l) => l.includes("eas update --branch production"));
    expect(linha).toBeDefined();
    expect(linha).toContain("--rollout-percentage 10");
  });

  it("dev -> preview continua a 100% (sem rollout)", () => {
    const linha = ci.split("\n").find((l) => l.includes("eas update --branch preview"));
    expect(linha).not.toContain("--rollout-percentage");
  });

  it("nao usa --force (um rollout em andamento barra o proximo publish)", () => {
    expect(ci).not.toMatch(/eas update[^\n]*--force/);
  });
});
