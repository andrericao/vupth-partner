import { create } from "zustand";
import { api } from "@lib/api";

type Professional = {
  id: string;
  name: string;
  specialty: string | null;
  establishment_id: string | null;
  establishment_name: string | null;
  is_available: boolean;
  message: string;
};

type ProfessionalState = {
  professional: Professional | null;
  isLoading: boolean;
  error: string | null;

  register: (name: string, specialty?: string) => Promise<void>;
  affiliate: (establishmentId: string) => Promise<void>;
  reset: () => void;
};

export const useProfessionalStore = create<ProfessionalState>((set) => ({
  professional: null,
  isLoading: false,
  error: null,

  register: async (name, specialty?) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/professional/register", {
      name,
      specialty,
    });

    set({ professional: data, isLoading: false });
  },

  affiliate: async (establishmentId) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/professional/affiliate", {
      establishmentId,
    });

    set({ professional: data, isLoading: false });
  },

  reset: () => set({ professional: null, isLoading: false, error: null }),
}));
