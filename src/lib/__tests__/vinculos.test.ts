import { solicitacoesPendentes } from "@lib/vinculos";

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
