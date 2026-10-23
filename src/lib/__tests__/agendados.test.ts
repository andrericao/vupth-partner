import { paramsDosAgendados, agruparPorDia, tituloDoDia, horaDoAgendado } from "../agendados";
import type { AttendanceHistoryItem } from "../types";

const agora = new Date(2026, 9, 23, 10, 0);
const item = (id: string, quando: Date): AttendanceHistoryItem =>
  ({ id, clientName: id, services: [], totalValue: 30, scheduledTime: quando.toISOString() }) as any;

describe("agendados", () => {
  it("pede SCHEDULED de hoje a hoje+7, ate 100", () => {
    expect(paramsDosAgendados("p1", agora)).toEqual({
      professionalId: "p1",
      dateFrom: "2026-10-23",
      dateTo: "2026-10-30",
      status: "SCHEDULED",
      page: 0,
      size: 100,
    });
  });

  it("titulo: Hoje, Amanha e dia da semana com data", () => {
    expect(tituloDoDia("2026-10-23", agora)).toBe("Hoje");
    expect(tituloDoDia("2026-10-24", agora)).toBe("Amanhã");
    expect(tituloDoDia("2026-10-27", agora)).toMatch(/27\/10$/);
  });

  it("agrupa por dia, ordena pelo horario e ignora data invalida", () => {
    const dias = agruparPorDia(
      [
        item("c", new Date(2026, 9, 24, 9, 0)),
        item("b", new Date(2026, 9, 23, 15, 0)),
        item("a", new Date(2026, 9, 23, 11, 0)),
        { ...item("x", agora), scheduledTime: "lixo" },
      ],
      agora
    );
    expect(dias.map((d) => d.titulo)).toEqual(["Hoje", "Amanhã"]);
    expect(dias[0].itens.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("hora local do agendamento", () => {
    expect(horaDoAgendado(item("a", new Date(2026, 9, 23, 9, 5)))).toBe("09:05");
    expect(horaDoAgendado({ scheduledTime: "" } as any)).toBe("--:--");
  });
});
