import { broadcastApagaAtendimento } from "../broadcastSuspeito";

const prof = (id: string, atual: any, espera: any[] = []) => ({
  id,
  current_attendance: atual,
  waiting_list: espera,
});
const snap = (...ps: any[]) => ({ professionals: ps }) as any;

// A guarda que impede o WebSocket de apagar um atendimento em curso que o GET
// trouxe. O que ela precisa acertar sao os DOIS lados: nao perder o card, e nao
// deixar card fantasma quando o atendimento realmente acabou.
describe("broadcastApagaAtendimento", () => {
  it("o broadcast some com o atendimento sem dizer nada => suspeito", () => {
    const antes = snap(prof("p1", { id: "a1" }));
    const novo = snap(prof("p1", null));
    expect(broadcastApagaAtendimento(antes, novo)).toBe(true);
  });

  it("o broadcast TROUXE o atendimento => nada a proteger", () => {
    const antes = snap(prof("p1", { id: "a1" }));
    const novo = snap(prof("p1", { id: "a1" }));
    expect(broadcastApagaAtendimento(antes, novo)).toBe(false);
  });

  // O servidor falou dele — so mudou de lugar. Silencio e o que interessa.
  it("o atendimento reaparece na lista de espera => o servidor falou, deixa passar", () => {
    const antes = snap(prof("p1", { id: "a1" }));
    const novo = snap(prof("p1", null, [{ id: "a1", status: "PAUSED" }]));
    expect(broadcastApagaAtendimento(antes, novo)).toBe(false);
  });

  it("outro cliente assumiu a cadeira => deixa passar", () => {
    const antes = snap(prof("p1", { id: "a1" }));
    const novo = snap(prof("p1", { id: "a2" }));
    expect(broadcastApagaAtendimento(antes, novo)).toBe(false);
  });

  it("o cache ainda nao tinha atendimento => nada a proteger", () => {
    expect(broadcastApagaAtendimento(snap(prof("p1", null)), snap(prof("p1", null)))).toBe(false);
  });

  it("o profissional sumiu do snapshot => outro assunto, nao e esta guarda", () => {
    const antes = snap(prof("p1", { id: "a1" }));
    expect(broadcastApagaAtendimento(antes, snap(prof("p2", null)))).toBe(false);
  });

  it("basta UM profissional perder o atendimento para o snapshot ser suspeito", () => {
    const antes = snap(prof("p1", { id: "a1" }), prof("p2", { id: "a2" }));
    const novo = snap(prof("p1", { id: "a1" }), prof("p2", null));
    expect(broadcastApagaAtendimento(antes, novo)).toBe(true);
  });

  it.each([
    ["sem cache anterior", null, snap(prof("p1", null))],
    ["sem snapshot novo", snap(prof("p1", { id: "a1" })), null],
  ])("%s => false", (_c, a, b) => {
    expect(broadcastApagaAtendimento(a as any, b as any)).toBe(false);
  });
});

// cobertura-98 (Andre, 08/10): snapshots sem listas nao quebram a guarda.
describe("broadcastApagaAtendimento — listas ausentes", () => {
  it("sem professionals nos dois lados: nada a desconfiar", () => {
    expect(broadcastApagaAtendimento({} as any, {} as any)).toBe(false);
  });

  it("o atendimento sumiu e o novo nem tem waiting_list: suspeito", () => {
    const anterior = { professionals: [{ id: "p1", current_attendance: { id: "a1" } }] } as any;
    const novo = { professionals: [{ id: "p1", current_attendance: null }] } as any;
    expect(broadcastApagaAtendimento(anterior, novo)).toBe(true);
  });
});
