import { solicitacoesPendentes, historicoDeVinculos, diaDoVinculo } from "@lib/vinculos";

// 🔴 Andre, 25/09: "o dono nao ve a solicitacao de vinculo, e nenhum dot
// aponta para ela". O item "Profissionais" do Menu aceitava badge desde que
// virou a unica porta da equipe — so nunca recebeu o numero.
//
// Conta so o que ESPERA O DONO: pedido do profissional (REQUEST) ainda
// pendente. O convite que o dono mandou (INVITATION) espera o profissional —
// contar isso seria pedir ao dono uma acao que nao e dele.
describe("solicitacoesPendentes", () => {
  const v = (type: string, status: string) => ({ type, status });

  it("conta so REQUEST pendente", () => {
    expect(
      solicitacoesPendentes([
        v("REQUEST", "PENDING"),
        v("REQUEST", "PENDING"),
        v("INVITATION", "PENDING"),
        v("REQUEST", "ACCEPTED"),
        v("REQUEST", "REJECTED"),
      ])
    ).toBe(2);
  });

  it("lista vazia, ausente ou resposta estranha: zero", () => {
    expect(solicitacoesPendentes([])).toBe(0);
    expect(solicitacoesPendentes(undefined)).toBe(0);
    expect(solicitacoesPendentes({} as any)).toBe(0);
  });
});

// historico-de-vinculo, 2a parte (BAK 7e3e21b): com ?status=ALL a API manda os
// resolvidos com resolvedAt — o historico do dono vem do mais recente.
describe("historicoDeVinculos", () => {
  const v = (id: string, status: string, resolvedAt?: string | null, createdAt = "2026-10-01T10:00:00") => ({
    id,
    status,
    resolvedAt,
    createdAt,
  });

  it("deixa os PENDING de fora e poe o resolvido mais recente primeiro", () => {
    const r = historicoDeVinculos([
      v("a", "ACCEPTED", "2026-10-02T09:00:00"),
      v("p", "PENDING"),
      v("b", "REJECTED", "2026-10-04T09:00:00"),
      v("c", "CANCELLED", "2026-10-03T09:00:00"),
    ]);
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("sem resolvedAt (backend antigo) usa o createdAt", () => {
    const r = historicoDeVinculos([
      v("a", "ACCEPTED", null, "2026-10-01T09:00:00"),
      v("b", "REJECTED", undefined, "2026-10-05T09:00:00"),
    ]);
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("lista ausente vira vazia", () => {
    expect(historicoDeVinculos(null)).toEqual([]);
    expect(historicoDeVinculos(undefined)).toEqual([]);
  });
});

describe("diaDoVinculo", () => {
  it("dd/MM do resolvedAt, ou vazio sem data valida", () => {
    expect(diaDoVinculo("2026-10-05T08:30:00")).toBe("05/10");
    expect(diaDoVinculo(null)).toBe("");
    expect(diaDoVinculo("lixo")).toBe("");
  });
});
