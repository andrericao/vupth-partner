import { impedimentosDaExclusao, mensagemDoRemoverDaLoja, semProfissional } from "../impedimentosDaLoja";

const erro409 = (blockers: unknown) => ({ response: { status: 409, data: { code: "ESTABLISHMENT_HAS_PROFESSIONALS", blockers } } });

describe("impedimentosDaLoja (remover-profissionais-ao-excluir-loja, DEC-173)", () => {
  const todos = erro409([
    { code: "ESTABLISHMENT_HAS_PROFESSIONALS", count: 2, items: [{ id: "p1", name: "Ana" }, { id: "p2", name: "Beto" }] },
    { code: "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES", count: 1, items: [{ id: "a1", name: "Carlos" }] },
    { code: "ESTABLISHMENT_HAS_FUTURE_BOOKINGS", count: 3, items: [] },
  ]);

  it("lista cada impedimento: profissionais removiveis, atendimentos e agendamentos com atalho", () => {
    const l = impedimentosDaExclusao(todos);
    expect(l.map((i) => i.titulo)).toEqual(["2 profissionais na loja", "1 cliente na fila ou em atendimento", "3 agendamentos futuros"]);
    expect(l[0]).toMatchObject({ removivel: true, atalho: null });
    expect(l[1]).toMatchObject({ removivel: false, atalho: { rota: "/(owner)/(tabs)/attendances" } });
    expect(l[1].items[0].name).toBe("Carlos");
  });

  it("ignora erro que nao e o 409 dos impedimentos e codigos desconhecidos", () => {
    expect(impedimentosDaExclusao(null)).toEqual([]);
    expect(impedimentosDaExclusao({ response: { status: 401, data: {} } })).toEqual([]);
    expect(impedimentosDaExclusao({ response: { status: 409, data: { code: "X" } } })).toEqual([]);
    expect(impedimentosDaExclusao(erro409([{ code: "OUTRO", count: 1 }]))).toEqual([]);
    expect(impedimentosDaExclusao(erro409([{ code: "ESTABLISHMENT_HAS_PROFESSIONALS", items: [{ id: 3 }, null] }]))[0].items).toEqual([]);
  });

  it("semProfissional tira o removido e some o bloco quando acaba", () => {
    const l = semProfissional(impedimentosDaExclusao(todos), "p1");
    expect(l[0]).toMatchObject({ count: 1, titulo: "1 profissional na loja" });
    expect(l[0].items.map((i) => i.id)).toEqual(["p2"]);
    const vazio = semProfissional(l, "p2");
    expect(vazio.map((i) => i.code)).not.toContain("ESTABLISHMENT_HAS_PROFESSIONALS");
    expect(vazio).toHaveLength(2);
  });

  it("mensagem do remover: atendimento em curso ou padrao", () => {
    expect(mensagemDoRemoverDaLoja({ response: { data: { code: "PROFESSIONAL_HAS_ACTIVE_ATTENDANCES" } } })).toMatch(/atendimento em andamento/);
    expect(mensagemDoRemoverDaLoja({})).toMatch(/Não foi possível/);
  });
});
