import fs from "fs";
import path from "path";

// A tela que o profissional ve antes de pedir vinculo mostrava o PAR UNICO de
// horario. Com o contrato por dia (17/09) esse par passou a ser "o horario de
// HOJE" e vem NULO nos dias em que a loja fecha — a linha "Horário"
// simplesmente sumia, em vez de dizer "Fechada hoje".
const tela = fs
  .readFileSync(path.resolve(__dirname, "../../../app/(professional)/establishment-detail.tsx"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("o horario da loja na tela de vinculo", () => {
  it("le a semana do backend e usa o resumo do dia", () => {
    expect(tela).toContain("buscarHorarios(");
    expect(tela).toContain("resumoDoDia(");
  });

  it("o resumo do dia MANDA; o par unico e so reserva para o backend antigo", () => {
    // as frases nao sao escritas aqui: vem da lib que o client tambem usa
    expect(tela).not.toMatch(/"Fechad[ao] hoje"/);
    expect(tela).not.toMatch(/"Reabre /);
    expect(tela).toMatch(/resumo\s*\?[\s\S]{0,120}:\s*hours/);
  });
});
