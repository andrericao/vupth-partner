import fs from "fs";
import path from "path";

// Guarda de PROJETO, espelhando a que o Front-Client escreveu (A5, 07/09).
//
// O shim de Alert so vale se ele for INSTALADO. Um shim perfeito que ninguem
// chama deixa o app exatamente tao mudo quanto antes — e nada no typecheck, no
// lint ou nos testes de unidade acusaria isso. Foi assim que o proprio fato
// ("Alert e no-op no web") ficou meses escrito num comentario sem virar item.
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("o shim de Alert para web", () => {
  it("existe como modulo proprio — trocar o dialogo mexe em UM arquivo", () => {
    expect(fs.existsSync(path.join(RAIZ, "src/lib/alertWeb.ts"))).toBe(true);
  });

  it("o boot do app REALMENTE instala — sem isso o shim e decorativo", () => {
    const layout = ler("app/_layout.tsx");

    expect(layout).toMatch(/import \{ instalarAlertWeb \}/);
    expect(layout).toMatch(/instalarAlertWeb\(\)/);
  });

  it("instala no escopo do modulo, nao dentro de um efeito", () => {
    const layout = ler("app/_layout.tsx");
    const posInstalacao = layout.indexOf("instalarAlertWeb()");
    const posComponente = layout.indexOf("export default function RootLayout");

    // Erro mostrado durante o primeiro render chega ANTES de qualquer
    // useEffect: instalar depois perderia justamente o aviso do boot.
    expect(posInstalacao).toBeGreaterThan(-1);
    expect(posInstalacao).toBeLessThan(posComponente);
  });

  it("o confirmar() usa o mesmo dialogo quando o shim esta instalado", () => {
    const confirmar = ler("src/lib/confirmar.ts");

    // Duas caixas diferentes no mesmo app (a nossa e a do navegador) e o tipo
    // de divergencia que ninguem ve ate um usuario reclamar.
    expect(confirmar).toMatch(/alertWebInstalado/);
  });
});
