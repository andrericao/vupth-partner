import { create } from "zustand";
import { api } from "@lib/api";

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

type EstablishmentState = {
  establishment: Establishment | null;
  isLoading: boolean;
  error: string | null;

  quickCreate: (name: string, serviceType: string) => Promise<void>;
  updateOpenStatus: (id: string, status: string) => Promise<void>;
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
  searchByName: (name: string) => Promise<EstablishmentSearchResult[]>;
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

    set({ establishment: data, isLoading: false });
  },

  updateOpenStatus: async (id, status) => {
    set({ isLoading: true, error: null });

    const { data } = await api.patch(`/establishment/${id}/open-status`, {
      openStatus: status,
    });

    set({ establishment: data, isLoading: false });
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

  searchByName: async (name) => {
    const params = name.trim() ? { name } : {};
    const { data } = await api.get("/establishment", { params });
    return data;
  },

  reset: () => set({ establishment: null, isLoading: false, error: null }),
}));
