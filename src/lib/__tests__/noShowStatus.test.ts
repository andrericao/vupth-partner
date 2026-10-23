import { podeMarcarFalta, contagemDaFalta, type NoShowStatus } from "../noShowStatus";

const s = (o: Partial<NoShowStatus>): NoShowStatus => ({ attendance_id: "a", is_first: true, can_mark_no_show: false, ...o });

describe("noShowStatus", () => {
  it("so libera com can_mark_no_show=true", () => {
    expect(podeMarcarFalta(undefined)).toBe(false);
    expect(podeMarcarFalta(s({ reason: "TOO_EARLY" }))).toBe(false);
    expect(podeMarcarFalta(s({ can_mark_no_show: true, seconds_left: 0 }))).toBe(true);
  });

  it("a contagem arredonda os minutos para cima e some quando ja vale", () => {
    expect(contagemDaFalta(s({ reason: "TOO_EARLY", seconds_left: 61 }))).toBe("“Não compareceu” libera em 2 min");
    expect(contagemDaFalta(s({ can_mark_no_show: true, seconds_left: 0 }))).toBeNull();
    expect(contagemDaFalta(s({ reason: "NOT_FIRST", seconds_left: null }))).toBeNull();
    expect(contagemDaFalta(undefined)).toBeNull();
  });
});
