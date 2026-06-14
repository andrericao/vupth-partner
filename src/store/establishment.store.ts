import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";

const STORAGE_KEY = "vupth_establishment";

type Establishment = {
  id: string;
  name: string;
  service_type: string;
  status: string;
  open_status: string;
  owner_id: string;
  created_at?: string;
  message?: string;
};

export type EstablishmentSearchResult = {
  id: string;
  services: string[];
  name: string;
  urlImage: string | null;
  ownerId: string;
  open_status: string;
  status: string;
};

type ProfessionalResponse = {
  id: string;
  name: string;
  specialty: string | null;
  establishment_id: string;
  establishment_name: string;
  is_available: boolean;
  message: string;
};

type ServiceItemResponse = {
  id: string;
  serviceItemType: string;
  customName: string;
  price: number;
  estimatedMinutes: number;
};

function normalizeEstablishment(data: any): Establishment {
  return {
    id: data.id,
    name: data.name,
    service_type: data.service_type ?? data.serviceType ?? "",
    status: data.status ?? "ACTIVE",
    open_status: data.open_status ?? data.openStatus ?? "CLOSED",
    owner_id: data.owner_id ?? data.ownerId ?? "",
    created_at: data.created_at ?? data.createdAt,
    message: data.message,
  };
}

async function persistEstablishment(establishment: Establishment) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(establishment));
}

type EstablishmentState = {
  establishment: Establishment | null;
  isLoading: boolean;
  error: string | null;

  quickCreate: (name: string, serviceType: string) => Promise<void>;
  updateOpenStatus: (id: string, status: string) => Promise<void>;
  restoreEstablishment: () => Promise<void>;
  fetchMine: () => Promise<void>;
  quickCreateProfessional: (
    name: string,
    establishmentId: string,
    specialty?: string
  ) => Promise<ProfessionalResponse>;
  addServiceItem: (
    establishmentId: string,
    serviceItemType: string,
    customName: string,
    price: number
  ) => Promise<ServiceItemResponse>;
  addAddress: (
    establishmentId: string,
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    }
  ) => Promise<any>;
  searchByName: (name: string) => Promise<EstablishmentSearchResult[]>;
  removeProfessional: (establishmentId: string, professionalId: string) => Promise<void>;
  reset: () => void;
};

export const useEstablishmentStore = create<EstablishmentState>((set) => ({
  establishment: null,
  isLoading: false,
  error: null,

  quickCreate: async (name, serviceType) => {
    set({ isLoading: true, error: null });

    const { data } = await api.post("/establishment/quick-create", {
      name,
      serviceType,
    });

    const establishment = normalizeEstablishment(data);
    await persistEstablishment(establishment);
    set({ establishment, isLoading: false });
  },

  updateOpenStatus: async (id, status) => {
    set({ isLoading: true, error: null });

    const { data } = await api.patch(`/establishment/${id}/open-status`, {
      openStatus: status,
    });

    const establishment = normalizeEstablishment(data);
    await persistEstablishment(establishment);
    set({ establishment, isLoading: false });
  },

  restoreEstablishment: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      set({ establishment: normalizeEstablishment(JSON.parse(stored)) });
    }
  },

  fetchMine: async () => {
    const { data } = await api.get("/establishment/mine");
    if (Array.isArray(data) && data.length > 0) {
      const establishment = normalizeEstablishment(data[0]);
      await persistEstablishment(establishment);
      set({ establishment });
    }
  },

  quickCreateProfessional: async (name, establishmentId, specialty?) => {
    const { data } = await api.post("/professional/quick-create", {
      name,
      establishmentId,
      specialty,
    });

    return data;
  },

  addServiceItem: async (establishmentId, serviceItemType, customName, price) => {
    const { data } = await api.post(
      `/establishment/${establishmentId}/service-items`,
      { serviceItemType, customName, price }
    );

    return data;
  },

  addAddress: async (establishmentId, address) => {
    const { data } = await api.post(
      `/establishments/${establishmentId}/addresses`,
      address
    );
    return data;
  },

  searchByName: async (name) => {
    const params = name.trim() ? { name } : {};
    const { data } = await api.get("/establishment", { params });
    return data;
  },

  removeProfessional: async (establishmentId, professionalId) => {
    await api.delete(
      `/establishment/${establishmentId}/professionals/${professionalId}`
    );
  },

  reset: () => {
    SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ establishment: null, isLoading: false, error: null });
  },
}));
