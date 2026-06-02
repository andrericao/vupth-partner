import {
  calculateDailySummary,
  calculatePeriodSummary,
  formatCurrency,
} from "../summaryCalculations";
import type { AttendanceInQueue } from "@lib/types";

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);

function makeAttendance(
  overrides: Partial<AttendanceInQueue>
): AttendanceInQueue {
  return {
    id: "att-" + Math.random().toString(36).slice(2),
    establishmentId: "estab-1",
    establishmentName: "Barbearia",
    professionalId: "prof-1",
    professionalName: "Carlos",
    clientId: "client-1",
    clientName: "Joao",
    services: [{ id: "svc-1", customName: "Corte", estimatedMinutes: 30 }],
    status: "FINISHED",
    totalValue: 35.0,
    scheduledTime: `${today}T14:00:00Z`,
    estimatedMinutes: 30,
    durationInMinutes: 25,
    ...overrides,
  };
}

describe("summaryCalculations", () => {
  describe("calculateDailySummary", () => {
    it("counts today's attendances by status", () => {
      const attendances = [
        makeAttendance({ status: "FINISHED", totalValue: 30 }),
        makeAttendance({ status: "FINISHED", totalValue: 40 }),
        makeAttendance({ status: "CANCELLED" }),
        makeAttendance({ status: "SCHEDULED" }),
        makeAttendance({
          status: "FINISHED",
          scheduledTime: `${yesterday}T10:00:00Z`,
        }),
      ];

      const result = calculateDailySummary(attendances);

      expect(result.totalAttendances).toBe(4);
      expect(result.finishedCount).toBe(2);
      expect(result.cancelledCount).toBe(1);
      expect(result.inQueueCount).toBe(1);
    });

    it("calculates total revenue from finished attendances", () => {
      const attendances = [
        makeAttendance({ status: "FINISHED", totalValue: 30 }),
        makeAttendance({ status: "FINISHED", totalValue: 50 }),
        makeAttendance({ status: "CANCELLED", totalValue: 20 }),
      ];

      const result = calculateDailySummary(attendances);
      expect(result.totalRevenue).toBe(80);
    });

    it("calculates average duration from finished attendances", () => {
      const attendances = [
        makeAttendance({ status: "FINISHED", durationInMinutes: 20 }),
        makeAttendance({ status: "FINISHED", durationInMinutes: 40 }),
      ];

      const result = calculateDailySummary(attendances);
      expect(result.averageDuration).toBe(30);
    });

    it("returns zero average when no durations", () => {
      const attendances = [
        makeAttendance({ status: "FINISHED", durationInMinutes: null }),
      ];

      const result = calculateDailySummary(attendances);
      expect(result.averageDuration).toBe(0);
    });

    it("returns empty summary for no attendances", () => {
      const result = calculateDailySummary([]);

      expect(result.totalAttendances).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageDuration).toBe(0);
    });
  });

  describe("calculatePeriodSummary", () => {
    it("includes attendances within the period", () => {
      const attendances = [
        makeAttendance({ scheduledTime: `${today}T14:00:00Z` }),
        makeAttendance({ scheduledTime: `${lastWeek}T14:00:00Z` }),
        makeAttendance({
          scheduledTime: "2025-01-01T14:00:00Z",
        }),
      ];

      const result = calculatePeriodSummary(attendances, 7);

      expect(result.totalAttendances).toBe(2);
    });
  });

  describe("formatCurrency", () => {
    it("formats with R$ and comma", () => {
      expect(formatCurrency(35)).toBe("R$ 35,00");
      expect(formatCurrency(100.5)).toBe("R$ 100,50");
      expect(formatCurrency(0)).toBe("R$ 0,00");
    });
  });
});
