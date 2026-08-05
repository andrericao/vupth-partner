import { badgeLabel, queueMenuCount } from "../notifications";

describe("badgeLabel", () => {
  it("sem notificacao, nao ha rotulo (o badge nem aparece)", () => {
    expect(badgeLabel(0)).toBe("");
    expect(badgeLabel(-3)).toBe("");
  });

  it("de 1 a 9 mostra o numero exato", () => {
    expect(badgeLabel(1)).toBe("1");
    expect(badgeLabel(5)).toBe("5");
    expect(badgeLabel(9)).toBe("9");
  });

  it("acima de 9 vira '9+' (regra do Andre 2026-08-05)", () => {
    expect(badgeLabel(10)).toBe("9+");
    expect(badgeLabel(147)).toBe("9+");
  });

  it("valor invalido nao vira badge", () => {
    expect(badgeLabel(NaN)).toBe("");
    expect(badgeLabel(Number.POSITIVE_INFINITY)).toBe("9+");
  });

  it("fracao arredonda p/ baixo (defesa — contagem sempre e inteira)", () => {
    expect(badgeLabel(2.7)).toBe("2");
  });
});

describe("queueMenuCount", () => {
  it("conta as solicitacoes de corte", () => {
    expect(queueMenuCount({ pendingRequests: 3 })).toBe(3);
  });

  it("a refeicao sinalizada conta como UMA notificacao", () => {
    expect(queueMenuCount({ mealPending: true })).toBe(1);
    expect(queueMenuCount({ mealPending: false })).toBe(0);
  });

  it("soma tudo que MORA dentro do menu", () => {
    expect(queueMenuCount({ pendingRequests: 2, mealPending: true })).toBe(3);
  });

  it("sem pendencia nenhuma, zero", () => {
    expect(queueMenuCount({})).toBe(0);
  });

  it("entrada suja nao quebra a contagem", () => {
    expect(queueMenuCount({ pendingRequests: -1 })).toBe(0);
    expect(queueMenuCount({ pendingRequests: NaN, mealPending: true })).toBe(1);
  });
});
