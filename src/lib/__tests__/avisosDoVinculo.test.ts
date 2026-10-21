import fs from "fs";
import path from "path";

import { avisoDeSairDaLoja, avisoDoConvite } from "../avisosDoVinculo";

// Guia de texto (§1, regras 1 a 3): título de até 4 palavras, botão de 1 ou 2 palavras
// e corpo de uma frase com até 70 caracteres. O corpo de antes tinha 86 e 99 e
// terminava numa pergunta que os dois botões já fazem.
// "Sair da loja" conta como duas palavras no guia (§1, regra 1: "Sair da fila" ≠ "Sair da
// conta"): a preposição junto do artigo não é uma palavra a mais para quem lê o botão.
const palavras = (t: string) => t.trim().split(/\s+/).filter((p) => !["da", "de", "do", "das", "dos"].includes(p)).length;
// O nome mais longo que cabe no teto de 70 no aviso de sair (o mais comprido dos dois).
const NOME_LONGO = "Barbearia Dona Arlete1"; // 22 caracteres

describe.each([
  ["convite", avisoDoConvite],
  ["sair da loja", avisoDeSairDaLoja],
])("aviso do %s", (_nome, aviso) => {
  it("título de até 4 palavras e botão de até 2", () => {
    const a = aviso("Barbearia do Zé");
    expect(palavras(a.titulo)).toBeLessThanOrEqual(4);
    expect(palavras(a.confirmar)).toBeLessThanOrEqual(2);
  });

  it("o corpo cabe em 70 caracteres, com o nome mais longo que cabe e sem nome", () => {
    expect(aviso(NOME_LONGO).mensagem.length).toBeLessThanOrEqual(70);
    expect(aviso(undefined).mensagem.length).toBeLessThanOrEqual(70);
  });

  it("o corpo é uma frase, sem pergunta", () => {
    for (const nome of ["Barbearia do Zé", null, undefined, ""]) {
      const { mensagem } = aviso(nome);
      expect(mensagem).not.toContain("?");
      expect(mensagem.match(/[.!]/g)).toHaveLength(1);
    }
  });

  it("sem nome, diz 'nesta loja' (o 'em este estabelecimento' saía errado)", () => {
    for (const vazio of [null, undefined, ""]) {
      expect(aviso(vazio).mensagem).toContain("nesta loja");
      expect(aviso(vazio).mensagem).not.toContain("este estabelecimento");
    }
  });
});

describe("os dois avisos", () => {
  it("convite: o título pareia com 'Recusar convite' e o efeito vem com o nome", () => {
    expect(avisoDoConvite("Barbearia do Zé")).toEqual({
      titulo: "Aceitar convite",
      mensagem: "Você passa a atender em Barbearia do Zé.",
      confirmar: "Aceitar",
    });
  });

  it("sair da loja: o efeito e a consequência (deixa de receber clientes) ficam no texto", () => {
    expect(avisoDeSairDaLoja("Barbearia do Zé")).toEqual({
      titulo: "Sair da loja",
      mensagem: "Você deixa de atender em Barbearia do Zé e de receber clientes.",
      confirmar: "Sair da loja",
    });
  });
});

// A tela tem de usar os dois, e o Recusar segue como estava: foi o título do Aceitar que
// destoava dele, não o contrário.
describe("a tela do vínculo", () => {
  const tela = fs.readFileSync(path.resolve(__dirname, "../../../app/(professional)/settings-vinculo.tsx"), "utf8");

  it("pede os avisos às funções, sem texto escrito na mão", () => {
    expect(tela).toContain("avisoDoConvite(");
    expect(tela).toContain("avisoDeSairDaLoja(");
    expect(tela).not.toContain("Deseja se vincular");
    expect(tela).not.toContain("Deseja continuar");
  });

  it("o Recusar convite continua igual, e destrutivo", () => {
    const i = tela.indexOf("const handleRejectInvite");
    const bloco = tela.slice(i, i + 500);
    expect(bloco).toContain('titulo: "Recusar convite"');
    expect(bloco).toContain("destrutivo: true");
  });
});
