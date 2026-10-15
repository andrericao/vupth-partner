import {
  composicaoDoAtendimento,
  servicosComPrecoAntigo,
  avisoDoPrecoAntigo,
  explicacaoDosTotais,
} from "@lib/composicao";

// explicar-o-relatorio (PAR-18, Andre 15/10).
const CORTE = { id: "s1", customName: "Corte", price: 47.9, pro_receives: 45, base_price: 45 };
const BARBA = { id: "s2", customName: "Barba", price: 31.9, pro_receives: 30, base_price: 30 };
const ANTIGO = { id: "s3", customName: "Asadelta", price: 53.9, pro_receives: null, base_price: null };

describe("composicaoDoAtendimento", () => {
  it("um servico: cliente, voce, empresa de pagamento (4%) e o app (2% + arredondamento)", () => {
    const c = composicaoDoAtendimento({ totalValue: 47.9, services: [{ id: "s1", customName: "Corte" }] }, [CORTE]);
    expect(c).toEqual({
      clientePagou: 47.9,
      voceRecebeu: 45,
      empresaDePagamento: 1.8,
      app: 1.1,
      outros: 0,
      semDivisao: [],
    });
  });

  it("dois servicos somam; o que passa do preco (multa) vira outros", () => {
    const c = composicaoDoAtendimento(
      {
        totalValue: 82.8,
        services: [
          { id: "s1", customName: "Corte" },
          { id: "s2", customName: "Barba" },
        ],
      },
      [CORTE, BARBA]
    );
    expect(c.voceRecebeu).toBe(75);
    expect(c.empresaDePagamento).toBe(3);
    expect(c.app).toBe(1.8);
    expect(c.outros).toBe(3);
  });

  it("servico com preco antigo ou apagado: sem a divisao, so o que o cliente pagou", () => {
    const c = composicaoDoAtendimento(
      {
        totalValue: 101.8,
        services: [
          { id: "s1", customName: "Corte" },
          { id: "s3", customName: "Asadelta" },
          { id: "sx", customName: "Apagado" },
        ],
      },
      [CORTE, ANTIGO]
    );
    expect(c).toEqual({
      clientePagou: 101.8,
      voceRecebeu: null,
      empresaDePagamento: null,
      app: null,
      outros: 0,
      semDivisao: ["Asadelta", "Apagado"],
    });
  });
});

describe("preco antigo", () => {
  it("lista os servicos sem a divisao", () => {
    expect(servicosComPrecoAntigo([CORTE, ANTIGO, { id: "s4", price: 10 }])).toEqual(["Asadelta"]);
  });

  it("a faixa diz qual servico e como atualizar", () => {
    expect(avisoDoPrecoAntigo(0, ["Asadelta"])).toBeNull();
    expect(avisoDoPrecoAntigo(null, [])).toBeNull();
    expect(avisoDoPrecoAntigo(1, ["Asadelta"])).toBe(
      '1 atendimento ficou fora do "Você recebeu": usa o serviço Asadelta, com preço antigo. Para atualizar: Perfil → Meus serviços → Editar → Salvar.'
    );
    expect(avisoDoPrecoAntigo(2, ["A", "B", "C"])).toContain("2 atendimentos ficaram");
    expect(avisoDoPrecoAntigo(2, ["A", "B", "C"])).toContain("os serviços A, B e C");
    expect(avisoDoPrecoAntigo(1, [])).toContain("um serviço com preço antigo");
  });

  it("explica de onde vem cada total", () => {
    expect(explicacaoDosTotais()).toContain("Toque num atendimento");
  });
});
