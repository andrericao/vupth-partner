// A variante (package e nome) vem de APP_VARIANT ou, na falta, de EAS_BUILD_PROFILE.
// 01/11: so EAS_BUILD_PROFILE existia e ele so aparece DENTRO do servidor do EAS, entao
// o fingerprint local (package .vupth.partner) diferia do do EAS (.preview) e o build
// parava em "Configure expo-updates". APP_VARIANT no env do perfil (eas.json) e no passo
// do OTA do CI faz os dois lados concordarem.
import fs from "fs";
import path from "path";

const raiz = path.resolve(__dirname, "../../..");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require(path.join(raiz, "app.config.js")) as (a: { config: any }) => any;
const base = () => ({
  name: "vupth parceiros",
  android: { package: "com.vupth.partner" },
  ios: { bundleIdentifier: "com.vupth.partner" },
});

describe("app.config.js: variante", () => {
  const guardado = { ...process.env };
  afterEach(() => {
    process.env = { ...guardado };
  });
  const rodar = (env: Record<string, string | undefined>) => {
    delete process.env.APP_VARIANT;
    delete process.env.EAS_BUILD_PROFILE;
    Object.assign(process.env, env);
    return appConfig({ config: base() });
  };

  it("sem variante vale o app.json (producao)", () => {
    const c = rodar({});
    expect(c.android.package).toBe("com.vupth.partner");
    expect(c.name).toBe("vupth parceiros");
  });

  it("APP_VARIANT=preview (local, sem EAS_BUILD_PROFILE) vira o app preview", () => {
    const c = rodar({ APP_VARIANT: "preview" });
    expect(c.android.package).toBe("com.vupth.partner.preview");
    expect(c.ios.bundleIdentifier).toBe("com.vupth.partner.preview");
    expect(c.name).toBe("VUPTH preview");
  });

  it("EAS_BUILD_PROFILE continua valendo sozinho (dentro do EAS)", () => {
    expect(rodar({ EAS_BUILD_PROFILE: "preview" }).android.package).toBe("com.vupth.partner.preview");
    expect(rodar({ EAS_BUILD_PROFILE: "development" }).android.package).toBe("com.vupth.partner.dev");
  });

  it("local e EAS dao o mesmo resultado; producao nunca tem sufixo", () => {
    const local = rodar({ APP_VARIANT: "preview" });
    const eas = rodar({ EAS_BUILD_PROFILE: "preview", APP_VARIANT: "preview" });
    expect(local.android.package).toBe(eas.android.package);
    expect(rodar({ EAS_BUILD_PROFILE: "production" }).android.package).toBe("com.vupth.partner");
  });
});

describe("eas.json e CI: a variante vem do env", () => {
  const eas = JSON.parse(fs.readFileSync(path.join(raiz, "eas.json"), "utf8"));
  it("preview e development declaram APP_VARIANT; producao e prod-apk nao", () => {
    expect(eas.build.preview.env.APP_VARIANT).toBe("preview");
    expect(eas.build.development.env.APP_VARIANT).toBe("development");
    expect(eas.build.production.env.APP_VARIANT).toBeUndefined();
    expect(eas.build["prod-apk"].env.APP_VARIANT).toBeUndefined();
  });

  it("o OTA do preview no CI recebe APP_VARIANT=preview; o da main nao", () => {
    const ci = fs.readFileSync(path.join(raiz, ".github/workflows/ci.yml"), "utf8");
    const preview = ci.slice(ci.indexOf("Publish OTA (dev -> preview)"), ci.indexOf("Publish OTA (main -> production)"));
    const main = ci.slice(ci.indexOf("Publish OTA (main -> production)"));
    expect(preview).toMatch(/APP_VARIANT:\s*preview/);
    expect(main).not.toMatch(/APP_VARIANT/);
  });

  it(".fingerprintignore ignora so android/ e ios/ gerados", () => {
    const f = fs.readFileSync(path.join(raiz, ".fingerprintignore"), "utf8");
    const linhas = f.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    expect(linhas.sort()).toEqual(["/android", "/ios"]);
  });
});
