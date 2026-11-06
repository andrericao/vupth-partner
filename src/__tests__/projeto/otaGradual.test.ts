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

// ci-ota-rollout-em-andamento (04/11): rollout aberto pula o OTA com aviso, sem CI vermelho.
describe("rollout em andamento nao reprova o CI", () => {
  const passo = ci.slice(ci.indexOf("name: Publish OTA (main -> production)"));

  it("so o recado do rollout em andamento vira aviso e sai 0", () => {
    expect(passo).toContain('grep -q "Cannot start a rollout while another rollout is in progress" ota.log');
    expect(passo).toContain("::warning title=OTA de producao pulado::");
    expect(passo).toMatch(/rc=\$\{PIPESTATUS\[0\]\}/);
  });

  it("qualquer outra falha do EAS continua reprovando", () => {
    expect(passo).toMatch(/exit "\$rc"/);
  });

  it("o aviso ensina promover e reverter, sem fazer nenhum dos dois", () => {
    expect(passo).toContain("eas update:edit <GRUPO> --rollout-percentage 100");
    expect(passo).toContain("eas update:revert-update-rollout");
    expect(passo).not.toMatch(/^\s*eas update:(edit|revert)/m);
  });
});
