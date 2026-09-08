import { normalizarAtendimento } from "../atendimentoAtual";

// 🔴 TELA BRANCA (08/09, logo depois da minha correção): "finalizei, ele volta
// ao modal de pausar sozinho, finaliza o corte e a tela fica branca".
//
// Tela branca é crash. A causa foi minha: eu liguei a resposta do `/start` no
// card sem conferir o FORMATO. O snapshot da fila entrega `totalValue` e
// `clientName`; a resposta do endpoint pode vir em snake_case — e o card faz
// `attendance.totalValue.toFixed(2)` direto. `undefined.toFixed` derruba o
// render inteiro.
//
// Lição registrada no commit: rede que alimenta a tela com dado de OUTRA fonte
// precisa falar a mesma língua da tela, não só ter o mesmo assunto.
describe("normalizarAtendimento", () => {
  it("aceita o formato do snapshot (camelCase) sem mexer", () => {
    const a = normalizarAtendimento({
      id: "a1",
      clientName: "Ana",
      totalValue: 45,
      services: [{ id: "s1" }],
      status: "IN_PROGRESS",
    });

    expect(a).toMatchObject({ id: "a1", clientName: "Ana", totalValue: 45, status: "IN_PROGRESS" });
    expect(a!.services).toHaveLength(1);
  });

  it("aceita snake_case — que é como o endpoint pode responder", () => {
    const a = normalizarAtendimento({
      id: "a1",
      client_name: "Bruno",
      total_value: 30,
      service_items: [{ id: "s1" }],
      status: "PAUSED",
    });

    expect(a).toMatchObject({ clientName: "Bruno", totalValue: 30, status: "PAUSED" });
  });

  it("🔴 campo faltando NÃO pode derrubar a tela — vira zero e lista vazia", () => {
    const a = normalizarAtendimento({ id: "a1" })!;

    expect(a.totalValue).toBe(0);
    expect(a.services).toEqual([]);
    expect(() => a.totalValue.toFixed(2)).not.toThrow();
  });

  it("sem id não vira atendimento — card sem identidade não fecha nem finaliza", () => {
    expect(normalizarAtendimento({ clientName: "Ana" })).toBeNull();
    expect(normalizarAtendimento(null)).toBeNull();
    expect(normalizarAtendimento(undefined)).toBeNull();
  });

  it("nome ausente vira 'Cliente' em vez de sumir da tela", () => {
    expect(normalizarAtendimento({ id: "a1" })!.clientName).toBe("Cliente");
  });
});
