import fs from "fs";
import path from "path";

// api-no-dominio-nos-perfis (DEC-180, 05/11): os perfis production e prod-apk falam com
// https://api.vupth.com; preview e development seguem no staging. Nenhum host do Railway.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("API de producao no dominio proprio", () => {
  it("o ambiente prod aponta para https://api.vupth.com", () => {
    expect(ler("src/lib/api.ts")).toContain('prod: "https://api.vupth.com"');
  });

  it("production e prod-apk usam o ambiente prod; preview e development, o staging", () => {
    const build = JSON.parse(ler("eas.json")).build;
    expect(build.production.env.EXPO_PUBLIC_API_ENV).toBe("prod");
    expect(build["prod-apk"].env.EXPO_PUBLIC_API_ENV).toBe("prod");
    expect(build.preview.env.EXPO_PUBLIC_API_ENV).toBe("staging");
    expect(build.development.env.EXPO_PUBLIC_API_ENV).toBe("staging");
  });

  it("nenhum endereco do Railway sobra no app nem no CSP da web", () => {
    expect(ler("src/lib/api.ts")).not.toMatch(/railway/i);
    const csp = ler("public/_headers");
    expect(csp).not.toMatch(/railway/i);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/api\.vupth\.com/);
    expect(csp).toMatch(/connect-src [^;]*wss:\/\/api\.vupth\.com/);
  });
});
