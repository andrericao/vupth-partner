import { api } from "@lib/api";
import {
  abrirDias,
  buscarAgendaAberta,
  faltaAbrirProximaSemana,
  janelaDeAbertura,
  podeAbrir,
  repetirAgendaPadrao,
  type DiaDaAgenda,
} from "@lib/agendaAberta";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const dia = (date: string, extra: Partial<DiaDaAgenda> = {}): DiaDaAgenda => ({
  date,
  closed: false,
  opens: "09:00:00",
  closes: "18:00:00",
  storeOpen: true,
  openedByMe: false,
  agendaReleased: true,
  ...extra,
});

// abrir-agenda (DEC-130; Backend 82915ac).
describe("agendaAberta — chamadas", () => {
  beforeEach(() => jest.clearAllMocks());

  it("le os dias e traduz os campos do servidor", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { days: [{ date: "2026-11-02", closed: false, opens: "09:00:00", closes: "18:00:00", store_open: true, opened_by_me: true }] },
    });
    const r = await buscarAgendaAberta("2026-11-01", "2026-12-01");
    expect(api.get).toHaveBeenCalledWith("/professional/me/agenda", { params: { from: "2026-11-01", to: "2026-12-01" } });
    expect(r).toEqual([dia("2026-11-02", { openedByMe: true })]);
  });

  it("agenda_released falso vira agendaReleased falso; sem o campo, fica verdadeiro", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { days: [{ date: "2026-11-02", agenda_released: false }, { date: "2026-11-03" }] },
    });
    const r = await buscarAgendaAberta("2026-11-01", "2026-12-01");
    expect(r.map((d) => d.agendaReleased)).toEqual([false, true]);
  });

  it("sem dias na resposta devolve lista vazia", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await buscarAgendaAberta("a", "b")).toEqual([]);
  });

  it("abre dias soltos com o horario de cada um", async () => {
    await abrirDias([dia("2026-11-02")]);
    expect(api.post).toHaveBeenCalledWith("/professional/me/hours/open", {
      dates: [{ date: "2026-11-02", opens: "09:00:00", closes: "18:00:00" }],
    });
  });

  it("repete a agenda padrao de from a to", async () => {
    await repetirAgendaPadrao("2026-11-01", "2026-12-01");
    expect(api.post).toHaveBeenCalledWith("/professional/me/hours/open", {
      repeat_default: true,
      from: "2026-11-01",
      to: "2026-12-01",
    });
  });
});

describe("agendaAberta — regras", () => {
  it("a janela vai de hoje a 31 dias", () => {
    expect(janelaDeAbertura(new Date(2026, 9, 31))).toEqual({ from: "2026-10-31", to: "2026-11-30" });
  });

  it("so abre o dia que a loja abre, vale e ainda nao foi aberto", () => {
    expect(podeAbrir(dia("2026-11-02"))).toBe(true);
    expect(podeAbrir(dia("2026-11-02", { openedByMe: true }))).toBe(false);
    expect(podeAbrir(dia("2026-11-02", { closed: true }))).toBe(false);
    expect(podeAbrir(dia("2026-11-02", { storeOpen: false }))).toBe(false);
    expect(podeAbrir(dia("2026-11-02", { opens: null }))).toBe(false);
  });

  it("a vespera so vale no domingo, e so conta o dia aberto por ele na semana seguinte", () => {
    const domingo = new Date(2026, 10, 1); // 01/11/2026 e domingo
    expect(faltaAbrirProximaSemana(domingo, [])).toBe(true);
    expect(faltaAbrirProximaSemana(domingo, [dia("2026-11-03", { openedByMe: true })])).toBe(false);
    expect(faltaAbrirProximaSemana(domingo, [dia("2026-11-09", { openedByMe: true })])).toBe(true);
    expect(faltaAbrirProximaSemana(new Date(2026, 10, 2), [])).toBe(false); // segunda
  });
});
