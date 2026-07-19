import { create } from "zustand";
import { api } from "@lib/api";
import type {
  AttendanceInProgress,
  AttendanceHistoryItem,
  CutRequestResponse,
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
  noShow: (attendanceId: string) => Promise<void>;
  removeFromQueue: (attendanceId: string) => Promise<void>;
  promoteAttendance: (attendanceId: string) => Promise<void>;
  acceptCutRequest: (cutRequestId: string) => Promise<CutRequestResponse>;
  refuseCutRequest: (cutRequestId: string) => Promise<CutRequestResponse>;
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

  // Escalada do no-show (#39): cliente que ja esta LATE e nao compareceu de novo
  // ao ser chamado sai da fila (-> CANCELLED) e leva um strike. So vale se estiver
  // LATE (senao 400) — por isso o botao so aparece em card ATRASADO.
  noShow: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/no-show`);
  },

  removeFromQueue: async (attendanceId) => {
    await api.delete(`/professional-queue/${attendanceId}/remove`);
  },

  // S4 (backend 2026-07-18): move o atendimento ao indice 0 e empurra os demais,
  // SEM inicia-lo (fica SCHEDULED). Diferente do "Adiantar", que inicia na hora
  // via /start. No-op no backend se ja for o 1o; a fila ao vivo reflete via WS.
  promoteAttendance: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/promote`);
  },

  // C2 fatia 2 (backend 2026-07-18): o profissional dono decide um pedido de
  // corte PENDING. accept -> nasce Attendance SCHEDULED na cauda (a fila reflete
  // via WS); refuse -> pedido descartado. Ambos 200 CutRequestResponse.
  // NOTA: a UI do pedido pendente aguarda o backend expor o cutRequestId no
  // payload do WS CUT_REQUESTED (ou um GET de pendentes) — ver HANDOFF_BACKEND.
  acceptCutRequest: async (cutRequestId) => {
    const { data } = await api.patch(`/attendances/cut-requests/${cutRequestId}/accept`);
    return data;
  },

  refuseCutRequest: async (cutRequestId) => {
    const { data } = await api.patch(`/attendances/cut-requests/${cutRequestId}/refuse`);
    return data;
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
