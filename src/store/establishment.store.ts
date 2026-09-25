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
  phone?: string | null;
  instagram?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  /**
   * Endereco PRINCIPAL embutido (backend BUG4: /mine e o detalhe mandam
   * `address`; a store dropava). Fallback do checklist quando o GET rico falha.
   */
  address?: EstablishmentAddress | null;
  created_at?: string;
  message?: string;
};

// Campos editaveis via PATCH /establishment/{id}/general-infos.
type GeneralInfosChanges = {
  name?: string;
  phone?: string;
  instagram?: string;
  opening_time?: string;
  closing_time?: string;
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

export type EstablishmentAddress = {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
};

// Detalhe rico do estabelecimento (GET /establishment/id/{id}) — usado na tela
// de detalhe que o profissional ve antes de solicitar vinculacao (feedback #3).
export type EstablishmentDetail = {
  id: string;
  name: string;
  service_type: string;
  open_status: string;
  url_image: string | null;
  phone: string | null;
  instagram: string | null;
  opening_time: string | null;
  closing_time: string | null;
  address: EstablishmentAddress | null;
};

// Item da busca de profissionais (#6) — GET /professional?name=&specialty=.
export type ProfessionalSearchResult = {
  id: string;
  name: string | null;
  specialty: string | null;
  nickname: string | null;
  is_available: boolean | null;
};

// Relatorio agregado do establishment (#4) — GET /establishment/{id}/reports.
export type EstablishmentReport = {
  totalAttendances: number;
  totalRevenue: number;
  avgDurationMinutes: number;
  topService: string | null;
  topProfessional: string | null;
  professionals: {
    id: string;
    name: string;
    revenue: number;
    attendances: number;
    netRevenue?: number | null;
  }[];
  /** Receita sem as Taxas Vupth. Ausente em backend antigo. */
  netRevenue?: number | null;
  /** Atendimentos de servico sem divisao — ficam fora do netRevenue. */
  attendancesWithoutSplit?: number;
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
    phone: data.phone ?? null,
    instagram: data.instagram ?? null,
    opening_time: data.opening_time ?? data.openingTime ?? null,
    closing_time: data.closing_time ?? data.closingTime ?? null,
    address: normalizeAddress(data.address),
    created_at: data.created_at ?? data.createdAt,
    message: data.message,
  };
}

function normalizeAddress(a: any): EstablishmentAddress | null {
  if (!a) return null;
  return {
    street: a.street ?? null,
    number: a.number ?? null,
    complement: a.complement ?? null,
    neighborhood: a.neighborhood ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    zipCode: a.zipCode ?? a.zip_code ?? null,
  };
}

function normalizeEstablishmentDetail(data: any): EstablishmentDetail {
  return {
    id: data.id,
    name: data.name,
    service_type: data.service_type ?? data.serviceType ?? "",
    open_status: data.open_status ?? data.openStatus ?? "CLOSED",
    url_image: data.url_image ?? data.urlImage ?? null,
    phone: data.phone ?? null,
    instagram: data.instagram ?? null,
    opening_time: data.opening_time ?? data.openingTime ?? null,
    closing_time: data.closing_time ?? data.closingTime ?? null,
    address: normalizeAddress(data.address),
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
    split: { price: number; pro_receives: number; base_price: number }
  ) => Promise<ServiceItemResponse>;
  addAddress: (
    establishmentId: string,
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    }
  ) => Promise<any>;
  searchByName: (name: string) => Promise<EstablishmentSearchResult[]>;
  fetchEstablishmentById: (id: string) => Promise<EstablishmentDetail>;
  searchProfessionals: (name?: string, specialty?: string) => Promise<ProfessionalSearchResult[]>;
  inviteProfessional: (establishmentId: string, professionalId: string) => Promise<void>;
  fetchReport: (id: string, dateFrom?: string, dateTo?: string) => Promise<EstablishmentReport>;
  removeProfessional: (establishmentId: string, professionalId: string) => Promise<void>;
  updateGeneralInfos: (id: string, changes: GeneralInfosChanges) => Promise<void>;
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

  addServiceItem: async (establishmentId, serviceItemType, customName, split) => {
    const { data } = await api.post(
      `/establishment/${establishmentId}/service-items`,
      { serviceItemType, customName, ...split }
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

  fetchEstablishmentById: async (id) => {
    const { data } = await api.get(`/establishment/id/${id}`);
    return normalizeEstablishmentDetail(data);
  },

  searchProfessionals: async (name, specialty) => {
    const params: Record<string, string> = {};
    if (name?.trim()) params.name = name.trim();
    if (specialty?.trim()) params.specialty = specialty.trim();
    const { data } = await api.get("/professional", { params });
    return data;
  },

  inviteProfessional: async (establishmentId, professionalId) => {
    await api.post(`/establishment/${establishmentId}/affiliations`, {
      professionalId,
    });
  },

  fetchReport: async (id, dateFrom, dateTo) => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get(`/establishment/${id}/reports`, { params });
    return data;
  },

  removeProfessional: async (establishmentId, professionalId) => {
    await api.delete(
      `/establishment/${establishmentId}/professionals/${professionalId}`
    );
  },

  updateGeneralInfos: async (id, changes) => {
    // PATCH /establishment/{id}/general-infos — backend so aceita campos
    // conhecidos (ignoreUnknown=false); enviamos apenas o que muda.
    const { data } = await api.patch(`/establishment/${id}/general-infos`, changes);
    set((state) => {
      const merged = normalizeEstablishment({
        ...(state.establishment ?? {}),
        ...data,
      });
      persistEstablishment(merged);
      return { establishment: merged };
    });
  },

  reset: () => {
    SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ establishment: null, isLoading: false, error: null });
  },
}));
