import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

// maestro-publica-o-ota (Andre, 22/10): a bateria pode publicar o OTA da dev antes
// de comecar, sem o Andre. Opt-in (--publicar-ota); falhou, para e diz como fazer a mao.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("publicar-ota.sh", () => {
  const script = ler(".maestro/publicar-ota.sh");

  it("a sintaxe do bash fecha (publicar-ota.sh e setup.sh)", () => {
    expect(() => execFileSync("bash", ["-n", path.join(RAIZ, ".maestro/publicar-ota.sh")])).not.toThrow();
    expect(() => execFileSync("bash", ["-n", path.join(RAIZ, ".maestro/setup.sh")])).not.toThrow();
  });

  it("publica o mesmo OTA do job ota do ci.yml (canal preview, ambiente preview, sem perguntas)", () => {
    expect(script).toContain('update --branch preview --environment preview --message "$MSG" --non-interactive');
    expect(ler(".github/workflows/ci.yml")).toContain(
      'eas update --branch preview --environment preview --message "$MSG" --non-interactive'
    );
  });

  it("traz o comando manual em uma linha e nunca instala nada", () => {
    expect(script).toContain('#   eas update --branch preview --environment preview --message "bateria" --non-interactive');
    expect(script).not.toMatch(/npm (i|install)|npx|apt|brew/);
  });

  it("para com mensagem clara: sem eas, pasta fora da origin/dev, sem login e OTA que falha", () => {
    for (const trecho of ["eas-cli nao esta instalado", "nao esta no commit da origin/dev", "nao esta logado", "A bateria NAO vai rodar"]) {
      expect(script).toContain(trecho);
    }
  });
});

describe("setup.sh --publicar-ota", () => {
  const setup = ler(".maestro/setup.sh");

  it("a flag existe, vem desligada e roda o script antes do commit esperado", () => {
    expect(setup).toContain("PUBLICAR_OTA=0");
    expect(setup).toContain("--publicar-ota) PUBLICAR_OTA=1");
    expect(setup.indexOf("publicar-ota.sh")).toBeGreaterThan(0);
    expect(setup.indexOf("publicar-ota.sh")).toBeLessThan(setup.indexOf("# 6. O commit esperado"));
  });

  it("se o OTA falha, a bateria para", () => {
    expect(setup).toContain("OTA nao publicado — a bateria parou.");
  });
});
