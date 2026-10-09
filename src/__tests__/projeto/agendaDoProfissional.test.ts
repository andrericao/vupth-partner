import fs from "fs";
import path from "path";

// agenda-do-profissional (Andre, 05/10): o profissional chega a propria agenda
// pelo Perfil, e ela salva no /professional/me (o dono nao edita a dos outros).
const RAIZ = path.resolve(__dirname, "../../..");
const ler = (p: string) => fs.readFileSync(path.join(RAIZ, p), "utf8");

describe("agenda do profissional", () => {
  it("o Perfil leva a Minha agenda", () => {
    expect(ler("app/(professional)/settings.tsx")).toContain('router.push("/(professional)/agenda"');
  });

  it("a tela usa o editor com as chamadas do /professional/me", () => {
    const tela = ler("app/(professional)/agenda.tsx");
    expect(tela).toContain("<EditorDeHorarios");
    expect(tela).toContain("salvarSemanaDaAgenda");
    expect(tela).toContain("buscarAgenda(");
  });

  it("o horario da loja usa o mesmo editor", () => {
    expect(ler("app/(owner)/(tabs)/establishment-hours.tsx")).toContain("<EditorDeHorarios");
  });
});
