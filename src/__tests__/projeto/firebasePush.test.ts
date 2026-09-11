import fs from "fs";
import path from "path";

// Guarda do FCM (push no Android), 11/09.
//
// 🔴 O que ela pega: o `google-services.json` do Firebase é gerado por PROJETO,
// e cada `package` é um app Android SEPARADO lá dentro. Depois que o partner
// passou a ter TRÊS ids (`.dev`, `.preview` e o limpo, ver app.config.js),
// baixar o arquivo com só um registrado faz o push funcionar num ícone e falhar
// nos outros — e isso se parece com defeito intermitente, não com configuração
// faltando.
//
// A outra metade da configuração (a service account key FCM V1) vive na CONTA
// do Expo e não dá para testar daqui; está registrada no A6.
const RAIZ = path.resolve(__dirname, "../../..");
const arquivo = path.join(RAIZ, "google-services.json");

describe("configuração do Firebase para push", () => {
  it("o arquivo existe na raiz — sem ele o app nem obtém token", () => {
    expect(fs.existsSync(arquivo)).toBe(true);
  });

  it("o app.json APONTA para ele — arquivo solto na pasta não entra no build", () => {
    const appJson = JSON.parse(fs.readFileSync(path.join(RAIZ, "app.json"), "utf8"));
    expect(appJson.expo.android.googleServicesFile).toBe("./google-services.json");
  });

  it("🔴 os TRÊS packages do partner estão registrados", () => {
    const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    const registrados: string[] = dados.client.map(
      (c: any) => c.client_info.android_client_info.package_name
    );
    const base = "com.vupth.partner";

    for (const pkg of [base, `${base}.dev`, `${base}.preview`]) {
      expect(registrados).toContain(pkg);
    }
  });

  it("cada client tem api_key — client sem chave não registra no FCM", () => {
    const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    for (const c of dados.client) {
      expect(c.api_key?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
