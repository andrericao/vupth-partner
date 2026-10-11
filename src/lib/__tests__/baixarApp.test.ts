import { ehIOS, linkDeBaixar, raizDoSitePartner, APK_PARCEIRO } from "@lib/baixarApp";

// baixar-do-parceiro (Andre, 11/10): "so vale oferecer para Android, pois nao
// criamos para iOS, e o link deve levar certo para o cliente e para parceiros".
describe("baixarApp", () => {
  it("reconhece iPhone, iPad e iPod", () => {
    expect(ehIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(ehIOS("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
    expect(ehIOS("Mozilla/5.0 (iPod touch)")).toBe(true);
  });

  it("Android e computador nao sao iOS; sem user agent tambem nao", () => {
    expect(ehIOS("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
    expect(ehIOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(ehIOS(undefined)).toBe(false);
    expect(ehIOS(null)).toBe(false);
  });

  it("o site do Partner: producao e preview", () => {
    expect(raizDoSitePartner("prod")).toBe("https://vupth-partner.pages.dev");
    expect(raizDoSitePartner("staging")).toBe("https://dev.vupth-partner.pages.dev");
    expect(raizDoSitePartner("dev")).toBe("https://dev.vupth-partner.pages.dev");
  });

  it("o /baixar fica na raiz do site, sem barra dobrada", () => {
    expect(linkDeBaixar("https://vupth-partner.pages.dev/")).toBe("https://vupth-partner.pages.dev/baixar");
    expect(linkDeBaixar("https://dev.vupth-partner.pages.dev")).toBe("https://dev.vupth-partner.pages.dev/baixar");
  });

  it("o APK do parceiro tem nome proprio no bucket (nao o do cliente)", () => {
    expect(APK_PARCEIRO).toBe("apk/vupth-parceiro.apk");
  });
});
