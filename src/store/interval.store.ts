import { create } from "zustand";
import { api } from "@lib/api";

// Intervalos/refeicoes do profissional (#14). Contrato: PRD_BACKEND secao 18.
// Base path tem o prefixo /api/v1 (unico endpoint da API com ele).

// Humaniza a descricao da refeicao (o backend faz seed em ingles: "Lunch Break"
// / "Dinner Break"). Mostra "Almoco"/"Janta" no app.
export function mealName(description: string): string {
  const map: Record<string, string> = {
    "Lunch Break": "Almoço",
    Lunch: "Almoço",
    "Dinner Break": "Janta",
    Dinner: "Janta",
  };
  return map[description] ?? description;
}

export type Interval = {
  intervalId: string;
  type: "RECURRENT" | "UNEXPECTED";
  status: "ACTIVE" | "SCHEDULED";
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  description: string;
  fixedStartTime: string | null;
  recurrencePattern: string | null;
  /** Modelo B: passou do inicio maximo hoje sem iniciar e saiu do dia. So vem no GET. */
  suppressedToday?: boolean | null;
};

type RecurringInput = {
  durationMinutes: number;
  fixedStartTime: string;
  recurrencePattern: string;
  description?: string;
};

type UpdateInput = {
  durationMinutes?: number;
  fixedStartTime?: string;
  description?: string;
};

type IntervalState = {
  intervals: Interval[];
  isLoading: boolean;

  fetchIntervals: (professionalId: string, date?: string) => Promise<void>;
  createRecurring: (professionalId: string, input: RecurringInput) => Promise<void>;
  updateInterval: (professionalId: string, intervalId: string, changes: UpdateInput) => Promise<void>;
  deleteInterval: (professionalId: string, intervalId: string) => Promise<void>;
  startInterval: (professionalId: string, intervalId: string) => Promise<void>;
  startNextInterval: (professionalId: string) => Promise<void>;
  finishInterval: (professionalId: string, intervalId: string) => Promise<void>;
  skipInterval: (professionalId: string, intervalId: string) => Promise<void>;
  reset: () => void;
};

const basePath = (professionalId: string) =>
  `/api/v1/professionals/${professionalId}/intervals`;

export const useIntervalStore = create<IntervalState>((set, get) => ({
  intervals: [],
  isLoading: false,

  fetchIntervals: async (professionalId, date) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(basePath(professionalId), {
        params: date ? { date } : {},
      });
      set({ intervals: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createRecurring: async (professionalId, input) => {
    await api.post(`${basePath(professionalId)}/recurring`, input);
    await get().fetchIntervals(professionalId);
  },

  updateInterval: async (professionalId, intervalId, changes) => {
    await api.patch(`${basePath(professionalId)}/${intervalId}`, changes);
    await get().fetchIntervals(professionalId);
  },

  deleteInterval: async (professionalId, intervalId) => {
    await api.delete(`${basePath(professionalId)}/${intervalId}`);
    await get().fetchIntervals(professionalId);
  },

  startInterval: async (professionalId, intervalId) => {
    await api.patch(`${basePath(professionalId)}/${intervalId}/start`);
    await get().fetchIntervals(professionalId);
  },

  // "Iniciar refeicao" do Modelo B: o backend comeca a proxima nao feita, nao
  // pulada e nao suprimida (almoco suprimido as 17:30 -> comeca a janta). Sem
  // nenhuma: 409 INTERVAL_CONFLICT, que a tela mostra.
  startNextInterval: async (professionalId) => {
    await api.patch(`${basePath(professionalId)}/next/start`);
    await get().fetchIntervals(professionalId);
  },

  finishInterval: async (professionalId, intervalId) => {
    await api.patch(`${basePath(professionalId)}/${intervalId}/finish`);
    await get().fetchIntervals(professionalId);
  },

  // "Nao almocar" do dia (#17/#41): pula a refeicao recorrente so hoje,
  // derrubando-a do ETA. A recorrencia segue nos proximos dias. date default = hoje.
  skipInterval: async (professionalId, intervalId) => {
    await api.patch(`${basePath(professionalId)}/${intervalId}/skip`);
    await get().fetchIntervals(professionalId);
  },

  reset: () => set({ intervals: [], isLoading: false }),
}));
