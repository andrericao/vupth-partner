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

type ServiceItem = {
  id: string;
  serviceItemType: string;
  customName: string;
  price: number;
  estimatedMinutes: number;
};

type ProfessionalState = {
  professional: Professional | null;
  myServices: ServiceItem[];
  isLoading: boolean;
  error: string | null;

  register: (name: string, specialty?: string) => Promise<void>;
  affiliate: (establishmentId: string) => Promise<void>;
  switchEstablishment: (newEstablishmentId: string) => Promise<void>;
  leaveEstablishment: () => Promise<void>;
  requestAffiliation: (establishmentId: string) => Promise<void>;
  setProfessional: (data: Professional) => Promise<void>;
  addMyServiceItem: (serviceItemType: string, customName: string, price: number) => Promise<any>;
  fetchMyServices: () => Promise<void>;
  fetchMe: () => Promise<void>;
  restoreProfessional: () => Promise<void>;
  reset: () => void;
};

function normalizeProfessional(data: any): Professional {
  return {
    id: data.id,
    name: data.name,
    specialty: data.specialty ?? null,
    establishment_id: data.establishment_id ?? data.establishmentId ?? null,
    establishment_name: data.establishment_name ?? data.establishmentName ?? null,
    is_available: data.is_available ?? data.isAvailable ?? true,
    message: data.message ?? "",
  };
}

async function persistProfessional(professional: Professional) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(professional));
}

export const useProfessionalStore = create<ProfessionalState>((set, get) => ({
  professional: null,
  myServices: [],
  isLoading: false,
  error: null,

  register: async (name, specialty?) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/professional/register", {
      name,
      specialty,
    });

    const professional = normalizeProfessional(data);
    await persistProfessional(professional);
    set({ professional, isLoading: false });
  },

  setProfessional: async (data) => {
    const professional = normalizeProfessional(data);
    await persistProfessional(professional);
    set({ professional });
  },

  affiliate: async (establishmentId) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/professional/affiliate", {
      establishmentId,
    });

    const professional = normalizeProfessional(data);
    await persistProfessional(professional);
    set({ professional, isLoading: false });
  },

  switchEstablishment: async (newEstablishmentId) => {
    await api.delete("/professional/me/establishment");
    const { data } = await api.post("/professional/affiliate", {
      establishmentId: newEstablishmentId,
    });
    const professional = normalizeProfessional(data);
    await persistProfessional(professional);
    set({ professional });
  },

  leaveEstablishment: async () => {
    await api.delete("/professional/me/establishment");
    set({ myServices: [] });
    await get().fetchMe();
  },

  requestAffiliation: async (establishmentId) => {
    await api.post("/professional/me/affiliations", {
      establishmentId,
    });
  },

  addMyServiceItem: async (serviceItemType, customName, price) => {
    const prof = get().professional;
    if (!prof) throw new Error("Professional not found");

    const { data } = await api.post(
      `/professional-queue/${prof.id}/add-service-items`,
      { serviceItemType, customName, price }
    );
    return data;
  },

  fetchMe: async () => {
    const { data } = await api.get("/professional/me");
    const professional = normalizeProfessional(data);
    await persistProfessional(professional);
    set({ professional });
  },

  fetchMyServices: async () => {
    const prof = get().professional;
    if (!prof) return;

    const { data } = await api.get(`/professional/${prof.id}/service-items`);
    set({ myServices: data });
  },

  restoreProfessional: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      set({ professional: normalizeProfessional(JSON.parse(stored)) });
    }
  },

  reset: () => {
    SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ professional: null, myServices: [], isLoading: false, error: null });
  },
}));
