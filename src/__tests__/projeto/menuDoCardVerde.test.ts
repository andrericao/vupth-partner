import fs from "fs";
import path from "path";

// 🔴 Teste de device do Andre (24/09): o menu do card verde (Finalizar,
// Pausar/Retomar, Remover) existia, mas só abria SEGURANDO — "falta indicar que
// existe essa opção, nem eu sabia. Poderia ser um clique simples no card verde".
// O QA dizia "toquei no cliente em atendimento", e por isso parecia que a opção
// não existia. Os cards da espera já abriam com um toque; o verde era o único
// que não.
const tela = fs
  .readFileSync(path.resolve(__dirname, "../../../app/(professional)/queue.tsx"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("o card verde abre o menu com um toque", () => {
  it("o card do atendimento em curso responde a toque simples E a segurar", () => {
    const bloco = tela.slice(tela.indexOf("{currentAttendance && ("));
    const pressable = bloco.slice(0, bloco.indexOf("<ServingCard"));
    expect(pressable).toMatch(/onPress=\{\(\) => setMenuTarget\(currentAttendance\)\}/);
    expect(pressable).toMatch(/onLongPress=\{\(\) => setMenuTarget\(currentAttendance\)\}/);
  });

  it("o card mostra que há mais opções (o mesmo ⋯ da tela)", () => {
    const card = tela.slice(tela.indexOf("function ServingCard"), tela.indexOf("function QueueRow"));
    expect(card).toMatch(/<Ellipsis/);
  });
});
