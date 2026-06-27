import { create } from "zustand";
import { api } from "@lib/api";
import type {
  AttendanceInProgress,
  AttendanceHistoryItem,
  EstablishmentWithProfessionals,
  ProfessionalWithQueue,
  QueueResponse,
} from "@lib/types";

type AttendanceState = {
  professionals: ProfessionalWithQueue[];
  establishmentData: EstablishmentWithProfessionals | null;
  history: AttendanceHistoryItem[];
  isLoading: boolean;
  error: string | null;

  fetchQueue: (establishmentId: string) => Promise<void>;
  fetchProfessionalQueue: (professionalId: string, establishmentId: string) => Promise<QueueResponse>;
  addGuestAttendance: (data: { professionalId: string; establishmentId: string; serviceItemIds: string[]; clientName: string }) => Promise<QueueResponse>;
  fetchHistory: (params: { establishmentId?: string; professionalId?: string; status?: string }) => Promise<AttendanceHistoryItem[]>;
  startAttendance: (attendanceId: string) => Promise<AttendanceInProgress>;
  finishAttendance: (attendanceId: string) => Promise<void>;
  pauseAttendance: (attendanceId: string) => Promise<void>;
  resumeAttendance: (attendanceId: string) => Promise<AttendanceInProgress>;
  markLate: (attendanceId: string) => Promise<void>;
  undoLate: (attendanceId: string) => Promise<void>;
  removeFromQueue: (attendanceId: string) => Promise<void>;
  reset: () => void;
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  professionals: [],
  establishmentData: null,
  history: [],
  isLoading: false,
  error: null,

  fetchQueue: async (establishmentId) => {
    set({ isLoading: true, error: null });

    const { data } = await api.get(
      `/establishment/id/${establishmentId}/professionals-with-queue`
    );

    set({
      establishmentData: data,
      professionals: data.professionals ?? [],
      isLoading: false,
    });
  },

  fetchProfessionalQueue: async (professionalId, establishmentId) => {
    const { data } = await api.get(
      `/client-queue/${professionalId}/queue`,
      { params: { establishmentId } }
    );
    return data;
  },

  addGuestAttendance: async ({ professionalId, establishmentId, serviceItemIds, clientName }) => {
    const { data } = await api.post("/professional-queue/add-quest-attendance", {
      professionalId,
      establishmentId,
      serviceItemIds,
      clientName,
    });
    return data;
  },

  fetchHistory: async (params) => {
    const { data } = await api.get("/attendances", { params });
    set({ history: data });
    return data;
  },

  startAttendance: async (attendanceId) => {
    const { data } = await api.patch(`/attendances/${attendanceId}/start`);
    return data;
  },

  finishAttendance: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/finish`);
  },

  pauseAttendance: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/pause`);
  },

  resumeAttendance: async (attendanceId) => {
    const { data } = await api.patch(`/attendances/${attendanceId}/resume`);
    return data;
  },

  // Cliente nao chegou a tempo (#19): SCHEDULED -> LATE, cai 1 posicao mas
  // continua na fila. Repetir derruba mais; undoLate volta a SCHEDULED.
  markLate: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/late`);
  },

  undoLate: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/undo-late`);
  },

  removeFromQueue: async (attendanceId) => {
    await api.delete(`/professional-queue/${attendanceId}/remove`);
  },

  reset: () =>
    set({
      professionals: [],
      establishmentData: null,
      history: [],
      isLoading: false,
      error: null,
    }),
}));
