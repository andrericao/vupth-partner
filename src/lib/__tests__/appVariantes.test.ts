import path from "path";

// Tres apps convivendo no mesmo aparelho, cada um no seu papel:
//
//   dev client (perfil development) -> Render, JS servido pelo Metro local
//   APK de teste (perfil preview)   -> Render, JS vindo do OTA da branch dev
//   APK de producao (prod-apk)      -> Railway, JS vindo do OTA da main
//
// O Android identifica app por `package`: dois builds com o MESMO id sao o
// mesmo app, e instalar um desinstala o outro. Por isso as variantes de teste
// ganham sufixo — e a de producao NAO, porque ela e o app de verdade.
//
// O `app.json` continua sendo a fonte (o webConfig.test.ts le ele direto); o
// `app.config.js` so aplica o sufixo por cima, olhando o EAS_BUILD_PROFILE que
// o EAS carimba durante o build.
const aplicar = (perfil?: string) => {
  const anterior = process.env.EAS_BUILD_PROFILE;
  if (perfil) process.env.EAS_BUILD_PROFILE = perfil;
  else delete process.env.EAS_BUILD_PROFILE;

  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gerar = require(path.resolve(__dirname, "../../../app.config.js"));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const base = require(path.resolve(__dirname, "../../../app.json")).expo;
  const saida = gerar({ config: JSON.parse(JSON.stringify(base)) });

  if (anterior === undefined) delete process.env.EAS_BUILD_PROFILE;
  else process.env.EAS_BUILD_PROFILE = anterior;
  return saida;
};

describe("identidade de cada variante do app", () => {
  it("producao fica com o id limpo — e o app de verdade", () => {
    expect(aplicar("prod-apk").android.package).toBe("com.vupth.partner");
    expect(aplicar("production").android.package).toBe("com.vupth.partner");
  });

  it("as variantes de teste ganham sufixo, entao convivem no aparelho", () => {
    expect(aplicar("development").android.package).toBe("com.vupth.partner.dev");
    expect(aplicar("preview").android.package).toBe("com.vupth.partner.preview");
  });

  it("os tres ids sao distintos — e isso que permite os tres icones", () => {
    const ids = [aplicar("prod-apk"), aplicar("development"), aplicar("preview")].map(
      (c) => c.android.package,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it("o nome na tela diz qual variante e, para nao testar no app errado", () => {
    expect(aplicar("development").name).toMatch(/dev/i);
    expect(aplicar("preview").name).toMatch(/preview/i);
    expect(aplicar("prod-apk").name).toBe("vupth parceiros");
  });

  it("rodando local (sem perfil de build) vale o app.json como esta", () => {
    expect(aplicar().android.package).toBe("com.vupth.partner");
    expect(aplicar().name).toBe("vupth parceiros");
  });

  it("o iOS acompanha o mesmo sufixo", () => {
    expect(aplicar("development").ios.bundleIdentifier).toBe("com.vupth.partner.dev");
    expect(aplicar("prod-apk").ios.bundleIdentifier).toBe("com.vupth.partner");
  });

  it("nada mais do app.json e alterado — versao, plugins e projectId seguem", () => {
    const base = aplicar();
    const dev = aplicar("development");
    expect(dev.version).toBe(base.version);
    expect(dev.plugins).toEqual(base.plugins);
    expect(dev.extra.eas.projectId).toBe(base.extra.eas.projectId);
    expect(dev.android.runtimeVersion).toEqual(base.android.runtimeVersion);
  });
});
