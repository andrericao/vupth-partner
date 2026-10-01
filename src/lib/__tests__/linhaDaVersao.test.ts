import { linhaDaVersao } from "@lib/linhaDaVersao";

// Andre, 26/09: "na versao web deve aparecer sim a versao do app e a data".
// No navegador o expo-updates nao tem runtime, canal nem OTA — a linha saia
// "bundle embutido (nenhum OTA aplicado)". A web mostra a versao do app.json e
// a data/hora do build (carimbada pelo build:web).
describe("linhaDaVersao", () => {
  const ota = {
    runtimeVersion: "1.4.0",
    channel: "preview",
    updateId: "abcdef1234567890",
    createdAt: new Date(2026, 8, 26, 15, 30),
  };

  it("no aparelho: runtime, canal e o OTA com data e hora", () => {
    const l = linhaDaVersao({ plataforma: "android", versaoApp: "1.4.0", updates: ota });
    expect(l).toMatch(/^1\.4\.0 · preview · OTA abcdef12 · /);
    expect(l).toMatch(/26\/09\/2026|9\/26\/2026|2026/);
  });

  it("no aparelho sem OTA: diz que e o bundle embutido", () => {
    const l = linhaDaVersao({
      plataforma: "android",
      versaoApp: "1.4.0",
      updates: { runtimeVersion: "1.4.0", channel: "preview", updateId: null, createdAt: null },
    });
    expect(l).toBe("1.4.0 · preview · bundle embutido (nenhum OTA aplicado)");
  });

  it("na web: versao do app e a data do build", () => {
    const l = linhaDaVersao({
      plataforma: "web",
      versaoApp: "1.4.0",
      updates: { runtimeVersion: null, channel: null, updateId: null, createdAt: null },
      dataDoBuild: "2026-09-26T18:30:00Z",
    });
    expect(l).toMatch(/^1\.4\.0 · web · /);
    expect(l).toMatch(/2026/);
    expect(l).not.toMatch(/bundle embutido/);
  });

  it("na web sem a data do build (dev local): so a versao", () => {
    const l = linhaDaVersao({
      plataforma: "web",
      versaoApp: "1.4.0",
      updates: { runtimeVersion: null, channel: null, updateId: null, createdAt: null },
    });
    expect(l).toBe("1.4.0 · web");
  });
});
