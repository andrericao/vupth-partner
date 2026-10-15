import {
  composicaoDoAtendimento,
  somaDasContas,
  servicosComPrecoAntigo,
  avisoDoPrecoAntigo,
  type Composicao,
} from "@lib/composicao";

// explicar-o-relatorio (PAR-18) e relatorio-todas-as-linhas (DEC-54, DEC-55).
const CORTE = { id: "s1", customName: "Corte", price: 53.9, pro_receives: 50, base_price: 50 };
const BARBA = { id: "s2", customName: "Barba", price: 31.9, pro_receives: 30, base_price: 30 };
const ANTIGO = { id: "s3", customName: "Asadelta", price: 53.9, pro_receives: null, base_price: null };

/** A prova real: as linhas somam o que o cliente pagou, sem sobra. */
function fecha(c: Composicao): number {
  return Math.round((c.voceRecebeu + c.empresaDePagamento + c.app + c.arredondamento + c.outros) * 100) / 100;
}

describe("composicaoDoAtendimento", () => {
  it("o exemplo do Andre: 53,90 = 50,00 + 2,16 + 1,08 + 0,66", () => {
    const c = composicaoDoAtendimento({ totalValue: 53.9, services: [{ id: "s1", customName: "Corte" }] }, [CORTE]);
    expect(c).toEqual({
      clientePagou: 53.9,
      voceRecebeu: 50,
      empresaDePagamento: 2.16,
      app: 1.08,
      arredondamento: 0.66,
      outros: 0,
      estimados: [],
    });
    expect(fecha(c)).toBe(53.9);
  });

  it("dois servicos e uma multa: a multa vira outros e a conta fecha", () => {
    const c = composicaoDoAtendimento(
      {
        totalValue: 88.8,
        services: [
          { id: "s1", customName: "Corte" },
          { id: "s2", customName: "Barba" },
        ],
      },
      [CORTE, BARBA]
    );
    expect(c.voceRecebeu).toBe(80);
    expect(c.outros).toBe(3);
    expect(c.empresaDePagamento).toBe(3.43);
    expect(c.app).toBe(1.72);
    expect(fecha(c)).toBe(88.8);
  });

  it("preco antigo: a parte do profissional e estimada, e a conta fecha", () => {
    const c = composicaoDoAtendimento({ totalValue: 53.9, services: [{ id: "s3", customName: "Asadelta" }] }, [ANTIGO]);
    expect(c.voceRecebeu).toBe(50.66); // 53,90 - 2,16 - 1,08
    expect(c.arredondamento).toBe(0);
    expect(c.estimados).toEqual(["Asadelta"]);
    expect(fecha(c)).toBe(53.9);
  });

  it("servico apagado: o preco dele e o resto do total; estimado e sem outros", () => {
    const c = composicaoDoAtendimento(
      {
        totalValue: 85.8,
        services: [
          { id: "s1", customName: "Corte" },
          { id: "sx", customName: "Apagado" },
        ],
      },
      [CORTE]
    );
    expect(c.outros).toBe(0);
    expect(c.estimados).toEqual(["Apagado"]);
    expect(fecha(c)).toBe(85.8);
  });

  it("total menor que o preco conhecido: sem outros negativo", () => {
    const c = composicaoDoAtendimento(
      { totalValue: 40, services: [{ id: "s1", customName: "Corte" }, { id: "sx", customName: "X" }] },
      [CORTE]
    );
    expect(c.outros).toBe(0);
    expect(fecha(c)).toBe(40);
  });
});

describe("somaDasContas", () => {
  it("o total do periodo e a soma das linhas, e fecha", () => {
    const a = composicaoDoAtendimento({ totalValue: 53.9, services: [{ id: "s1", customName: "Corte" }] }, [CORTE]);
    const b = composicaoDoAtendimento({ totalValue: 53.9, services: [{ id: "s3", customName: "Asadelta" }] }, [ANTIGO]);
    const s = somaDasContas([a, b, b]);
    expect(s.clientePagou).toBe(161.7);
    expect(s.voceRecebeu).toBe(151.32);
    expect(s.estimados).toEqual(["Asadelta"]);
    expect(fecha(s)).toBe(161.7);
  });

  it("sem atendimentos: tudo zero", () => {
    expect(somaDasContas([])).toEqual({
      clientePagou: 0,
      voceRecebeu: 0,
      empresaDePagamento: 0,
      app: 0,
      arredondamento: 0,
      outros: 0,
      estimados: [],
    });
  });
});

describe("preco antigo", () => {
  it("lista os servicos sem a divisao", () => {
    expect(servicosComPrecoAntigo([CORTE, ANTIGO, { id: "s4", price: 10 }])).toEqual(["Asadelta"]);
  });

  it("a faixa diz qual servico e como atualizar", () => {
    expect(avisoDoPrecoAntigo([])).toBeNull();
    expect(avisoDoPrecoAntigo(["Asadelta"])).toBe(
      "O serviço Asadelta está com preço antigo: a sua parte nesses atendimentos é estimada. Para atualizar: Perfil → Meus serviços → Editar → Salvar."
    );
    expect(avisoDoPrecoAntigo(["A", "B", "C"])).toContain("Os serviços A, B e C estão");
  });
});
