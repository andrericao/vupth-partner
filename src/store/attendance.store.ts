import { create } from "zustand";
import { api } from "@lib/api";
import type {
  AttendanceInProgress,
  EstablishmentWithProfessionals,
  ProfessionalWithQueue,
} from "@lib/types";

type AttendanceState = {
  professionals: ProfessionalWithQueue[];
  establishmentData: EstablishmentWithProfessionals | null;
  isLoading: boolean;
  error: string | null;

  fetchQueue: (establishmentId: string) => Promise<void>;
  startAttendance: (attendanceId: string) => Promise<AttendanceInProgress>;
  finishAttendance: (attendanceId: string) => Promise<void>;
  pauseAttendance: (attendanceId: string) => Promise<void>;
  resumeAttendance: (attendanceId: string) => Promise<AttendanceInProgress>;
  removeFromQueue: (attendanceId: string) => Promise<void>;
  reset: () => void;
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  professionals: [],
  establishmentData: null,
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

  removeFromQueue: async (attendanceId) => {
    await api.delete(`/professional-queue/${attendanceId}/remove`);
  },

  reset: () =>
    set({
      professionals: [],
      establishmentData: null,
      isLoading: false,
      error: null,
    }),
}));
