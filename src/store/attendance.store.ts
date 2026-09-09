import { create } from "zustand";
import { api } from "@lib/api";
import { normalizarAtendimento } from "@lib/atendimentoAtual";
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
  /**
   * O atendimento que o backend devolveu no `start`, guardado como REDE.
   *
   * O card "ATENDENDO AGORA" dependia so do `current_attendance` do snapshot da
   * fila; quando esse campo vem vazio durante o IN_PROGRESS, some o card e com
   * ele o Finalizar — o bloqueio do MVP. Isto nao inventa dado: e a resposta
   * que o proprio servidor deu ao dizer "comecou".
   */
  atendimentoIniciado: AttendanceInProgress | null;
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
  fetchCutRequests: () => Promise<CutRequestResponse[]>;
  reset: () => void;
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  atendimentoIniciado: null,
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
    // NORMALIZA antes de guardar: este payload vai alimentar o card, e o card
    // fala a lingua do snapshot da fila. Guardar cru foi o que deu tela branca.
    set({ atendimentoIniciado: normalizarAtendimento({ ...data, id: data?.id ?? attendanceId }) as any });
    return data;
  },

  finishAttendance: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/finish`);
    // Limpa SEMPRE, nao so quando o id casa. Comparar ids dependia de o payload
    // trazer `id` no formato esperado — e quando nao trazia, sobrava um card
    // fantasma na tela depois de finalizar. Terminou um atendimento: a rede
    // local nao serve mais para nada.
    set({ atendimentoIniciado: null });
  },

  pauseAttendance: async (attendanceId) => {
    await api.patch(`/attendances/${attendanceId}/pause`);
  },

  resumeAttendance: async (attendanceId) => {
    const { data } = await api.patch(`/attendances/${attendanceId}/resume`);
    set({ atendimentoIniciado: normalizarAtendimento({ ...data, id: data?.id ?? attendanceId }) as any });
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
    set((s) => (s.atendimentoIniciado?.id === attendanceId ? { atendimentoIniciado: null } : {}));
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
  // UI ligada em 2026-07-22 (modal na fila), apos o desbloqueio do GET.
  acceptCutRequest: async (cutRequestId) => {
    const { data } = await api.patch(`/attendances/cut-requests/${cutRequestId}/accept`);
    return data;
  },

  refuseCutRequest: async (cutRequestId) => {
    const { data } = await api.patch(`/attendances/cut-requests/${cutRequestId}/refuse`);
    return data;
  },

  // C2 (desbloqueio 2026-07-22): pendentes do profissional logado (JWT),
  // createdAt ASC. Fonte da verdade da lista: o WS pessoal (CUT_*) so INVALIDA
  // a query e este GET refaz; o refetch de 30s e o fallback p/ socket caido e
  // o fetch ao abrir recupera o que chegou com o app fechado.
  fetchCutRequests: async () => {
    const { data } = await api.get("/attendances/cut-requests");
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
