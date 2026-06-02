import type { AttendanceInQueue } from "@lib/types";

export type DaySummary = {
  totalAttendances: number;
  finishedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  averageDuration: number;
  inQueueCount: number;
};

export function calculateDailySummary(
  attendances: AttendanceInQueue[]
): DaySummary {
  const today = new Date().toISOString().slice(0, 10);

  const todayAttendances = attendances.filter(
    (a) => a.scheduledTime?.slice(0, 10) === today
  );

  const finished = todayAttendances.filter((a) => a.status === "FINISHED");
  const cancelled = todayAttendances.filter((a) => a.status === "CANCELLED");
  const inQueue = todayAttendances.filter(
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS" || a.status === "PAUSED"
  );

  const totalRevenue = finished.reduce((sum, a) => sum + a.totalValue, 0);

  const durations = finished
    .filter((a) => a.durationInMinutes != null)
    .map((a) => a.durationInMinutes!);
  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;

  return {
    totalAttendances: todayAttendances.length,
    finishedCount: finished.length,
    cancelledCount: cancelled.length,
    totalRevenue,
    averageDuration,
    inQueueCount: inQueue.length,
  };
}

export function calculatePeriodSummary(
  attendances: AttendanceInQueue[],
  days: number
): DaySummary {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const periodAttendances = attendances.filter(
    (a) => a.scheduledTime >= cutoffStr
  );

  const finished = periodAttendances.filter((a) => a.status === "FINISHED");
  const cancelled = periodAttendances.filter((a) => a.status === "CANCELLED");
  const inQueue = periodAttendances.filter(
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS" || a.status === "PAUSED"
  );

  const totalRevenue = finished.reduce((sum, a) => sum + a.totalValue, 0);

  const durations = finished
    .filter((a) => a.durationInMinutes != null)
    .map((a) => a.durationInMinutes!);
  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;

  return {
    totalAttendances: periodAttendances.length,
    finishedCount: finished.length,
    cancelledCount: cancelled.length,
    totalRevenue,
    averageDuration,
    inQueueCount: inQueue.length,
  };
}

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
