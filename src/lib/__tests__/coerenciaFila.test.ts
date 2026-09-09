import { fechaFilaAoSair, viraTrabalhandoAoAbrirFila } from "../coerenciaFila";

// 🔴 Regra dele, 09/09: "não pode o profissional estar 'fora' com o status de
// fila aberta, NÃO EXISTE".
//
// Hoje as duas coisas são campos independentes — `work_status` e
// `accepting_new` —, e nada impedia a combinação. Do lado do cliente ela é uma
// promessa falsa: fila aberta significa "pode entrar", e não há ninguém para
// atender.
//
// Vale nas DUAS direções, senão a incoerência entra pela outra porta.
describe("coerência entre status e fila", () => {
  describe("sair de cena fecha a fila", () => {
    it("ir para Fora com a fila aberta: fecha", () => {
      expect(fechaFilaAoSair("indisponivel", true)).toBe(true);
    });

    it("ir para Fora com a fila já fechada: nada a fazer", () => {
      expect(fechaFilaAoSair("indisponivel", false)).toBe(false);
    });

    it("intervalo NÃO fecha — é pausa, não saída", () => {
      // Quem está em intervalo volta; a fila continua recebendo para quando ele
      // voltar. Fechar aqui esvaziaria a fila de quem já ia ser atendido.
      expect(fechaFilaAoSair("intervalo", true)).toBe(false);
    });

    it("voltar a trabalhar não mexe na fila", () => {
      expect(fechaFilaAoSair("trabalhando", true)).toBe(false);
      expect(fechaFilaAoSair("trabalhando", false)).toBe(false);
    });
  });

  describe("abrir a fila implica estar em cena", () => {
    it("abrir estando Fora: passa a Trabalhando", () => {
      expect(viraTrabalhandoAoAbrirFila("indisponivel", true)).toBe(true);
    });

    it("abrir já trabalhando: nada muda", () => {
      expect(viraTrabalhandoAoAbrirFila("trabalhando", true)).toBe(false);
    });

    it("FECHAR a fila nunca mexe no status — sair da fila não é sair do trabalho", () => {
      expect(viraTrabalhandoAoAbrirFila("indisponivel", false)).toBe(false);
      expect(viraTrabalhandoAoAbrirFila("intervalo", false)).toBe(false);
    });

    it("abrir em intervalo NÃO força trabalhando — o intervalo acaba sozinho", () => {
      expect(viraTrabalhandoAoAbrirFila("intervalo", true)).toBe(false);
    });
  });
});
