import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";

const STORAGE_KEY = "vupth_professional";

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
  restoreProfessional: () => Promise<void>;
  reset: () => void;
};

async function persistProfessional(professional: Professional) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(professional));
}

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

    await persistProfessional(data);
    set({ professional: data, isLoading: false });
  },

  affiliate: async (establishmentId) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/professional/affiliate", {
      establishmentId,
    });

    await persistProfessional(data);
    set({ professional: data, isLoading: false });
  },

  restoreProfessional: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      set({ professional: JSON.parse(stored) });
    }
  },

  reset: () => {
    SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ professional: null, isLoading: false, error: null });
  },
}));
