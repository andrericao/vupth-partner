import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { buscarHorarios, salvarSemana, salvarData, removerData } from "@lib/horariosApi";
import { DIAS } from "@lib/horarioSemanal";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);
const CORPO = {
  configured: true,
  weekly: DIAS.map((d) => ({ day: d.day, closed: d.day === "SUNDAY", opens: "08:00", closes: "18:00" })),
  exceptions: [],
  upcoming: [],
};

describe("horariosApi", () => {
  afterEach(() => mock.reset());

  it("GET le e normaliza", async () => {
    mock.onGet("/establishment/e1/hours").reply(200, CORPO);
    const h = await buscarHorarios("e1");
    expect(h?.configured).toBe(true);
    expect(h?.weekly[6]).toEqual({ day: "SUNDAY", closed: true, opens: null, closes: null });
  });

  // Backend antigo (sem a rota): a tela cai no formulario de horario unico em
  // vez de mostrar erro — o app nao pode depender da ordem dos deploys.
  it("404 = backend sem a semana ainda -> null", async () => {
    mock.onGet("/establishment/e1/hours").reply(404);
    await expect(buscarHorarios("e1")).resolves.toBeNull();
  });

  it("outro erro sobe", async () => {
    mock.onGet("/establishment/e1/hours").reply(500);
    await expect(buscarHorarios("e1")).rejects.toBeTruthy();
  });

  it("PUT da semana manda os 7 dias; fechado sem horario", async () => {
    mock.onPut("/establishment/e1/hours/weekly").reply(200, CORPO);
    await salvarSemana("e1", CORPO.weekly.map((d) => ({ ...d, day: d.day as any })));
    const body = JSON.parse(mock.history.put[0].data);
    expect(body.days).toHaveLength(7);
    expect(body.days[6]).toEqual({ day: "SUNDAY", closed: true });
    expect(body.days[0]).toEqual({ day: "MONDAY", closed: false, opens: "08:00", closes: "18:00" });
  });

  it("PUT de uma data", async () => {
    mock.onPut("/establishment/e1/hours/dates/2026-09-21").reply(200, CORPO);
    await salvarData("e1", "2026-09-21", { closed: false, opens: "10:00", closes: "14:00" });
    expect(JSON.parse(mock.history.put[0].data)).toEqual({ closed: false, opens: "10:00", closes: "14:00" });
  });

  it("DELETE de uma data", async () => {
    mock.onDelete("/establishment/e1/hours/dates/2026-09-21").reply(204);
    await removerData("e1", "2026-09-21");
    expect(mock.history.delete).toHaveLength(1);
  });
});
