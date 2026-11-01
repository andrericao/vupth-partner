import app from "../../../app.json";

// DEC-152 (ota-so-compativel): a runtimeVersion pelo hash do projeto nativo. Se entra
// pacote nativo, o hash muda e o build antigo NAO recebe o OTA (espera o build novo),
// em vez de abrir um bundle que importa modulo que ele nao tem (01/11: app fechava).
// Com "appVersion" bastava esquecer de subir a versao. So vale a partir do build novo.
describe("runtimeVersion por fingerprint", () => {
  const expo = app.expo as {
    runtimeVersion?: { policy?: string };
    android?: { runtimeVersion?: { policy?: string } };
  };

  it("raiz e android usam a politica fingerprint", () => {
    expect(expo.runtimeVersion?.policy).toBe("fingerprint");
    expect(expo.android?.runtimeVersion?.policy).toBe("fingerprint");
  });

  it("nao volta a um texto fixo nem a appVersion", () => {
    expect(JSON.stringify(expo.runtimeVersion)).not.toMatch(/appVersion/);
    expect(typeof expo.runtimeVersion).toBe("object");
  });
});
