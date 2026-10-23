import type { NaoRealizados } from "@lib/relatorioDasLojas";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@lib/api";
import type { DiaDeExpediente } from "@lib/expediente";

const STORAGE_KEY = "vupth_professional";

type Professional = {
  id: string;
  name: string;
  // opcional no tipo (respostas cruas podem nao trazer); normalizeProfessional
  // sempre popula (null se ausente), entao em runtime esta sempre presente.
  nickname?: string | null;
  specialty: string | null;
  establishment_id: string | null;
  establishment_name: string | null;
  /** S42 (Backend 01c785e): a loja do profissional. DEACTIVATED = o dono desativou a conta; null sem loja. */
  establishment_status?: "ACTIVE" | "DEACTIVATED" | null;
  is_available: boolean;
  /**
   * S1 fatia 1 (backend, verificado no codigo 2026-07-22): WORKING (trabalhando),
   * ON_BREAK (intervalo) ou OFF (indisponivel). Vem no DTO do /me (`work_status`).
   */
  work_status?: "WORKING" | "ON_BREAK" | "OFF" | null;
  /**
   * S1 fatia 3 (backend 2026-07-23): "fechar fila". false = fila fechada p/
   * clientes novos (drenando — quem ja esta segue). Vem no DTO do /me
   * (`accepting_new`). Ausente => tratamos como true (aceitando).
   */
  accepting_new?: boolean | null;
  /** Fila ou so agenda (backend 8e6c00f). Ausente = fila. */
  operation_mode?: "QUEUE" | "AGENDA_ONLY";
  /** O cliente ve a posicao dele na fila (Backend 35d57c0). Ausente = true. */
  show_position?: boolean;
  /** Telefone que o cliente ve (Backend 02dd5ef). null = nao expoe. */
  contact_phone?: string | null;
  /**
   * avaliacao-no-resumo (Andre, 18/10): a nota do proprio profissional no resumo
   * do Perfil. Hoje so o professionals-with-queue traz; o /me ainda nao (pedido em
   * Solicitadas). Opcional: sem o campo, o resumo nao mostra a linha.
   */
  rating_average?: number | null;
  rating_count?: number | null;
  message: string;
};

type ServiceItem = {
  id: string;
  serviceItemType: string;
  customName: string;
  price: number;
  estimatedMinutes: number;
  /** Divisao gravada (contrato de 18/09). Nulos = servico legado, sem divisao. */
  pro_receives?: number | null;
  base_price?: number | null;
};

/** Divisao do preco enviada no cadastro/edicao (ver src/lib/split.ts). */
export type SplitDoPreco = { price: number; pro_receives: number; base_price: number };

export type ProfessionalReport = {
  totalAttendances: number;
  totalRevenue: number;
  avgDurationMinutes: number;
  topService: string | null;
  /** O que o profissional recebeu, sem as Taxas Vupth. Ausente em backend antigo. */
  netRevenue?: number | null;
  /** Atendimentos de servico sem divisao — ficam fora do netRevenue. */
  attendancesWithoutSplit?: number;
  /** Expediente por dia (contrato de 03/10). Ausente em backend antigo. */
  workdays?: DiaDeExpediente[];
  /** relatorio-sem-multa (Backend 0112396): so a contagem; a multa e do app. */
  notRealized?: NaoRealizados | null;
  finishedLate?: number | null;
  /**
   * relatorio-com-pendencias (Backend de0af2e, DEC-109): o que recebe, as taxas e
   * a divida do pagamento por fora, no periodo e por corte. Sem multa nem lucro
   * do app. Ausente em backend antigo.
   */
  receives_total?: number | null;
  fees_total?: number | null;
  pending_debt_total?: number | null;
  pending_debt_simulated_total?: number | null;
  cuts?: CorteDoRelatorio[] | null;
};

export type CorteDoRelatorio = {
  attendance_id: string;
  finished_at?: string | null;
  total_value?: number | null;
  /** Nulos em servico legado (sem divisao congelada). */
  receives?: number | null;
  fees?: number | null;
  pending_debt?: number | null;
  pending_debt_simulated?: number | null;
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
  cancelAffiliation: (affiliationId: string) => Promise<void>;
  fetchMyAffiliations: () => Promise<any[]>;
  acceptAffiliation: (affiliationId: string) => Promise<void>;
  rejectAffiliation: (affiliationId: string) => Promise<void>;
  setProfessional: (data: Professional) => Promise<void>;
  addMyServiceItem: (
    serviceItemType: string,
    customName: string,
    split: SplitDoPreco,
    estimatedMinutes?: number
  ) => Promise<any>;
  updateMyProfile: (changes: { name?: string; specialty?: string }) => Promise<void>;
  updateMyStatus: (status: "WORKING" | "ON_BREAK" | "OFF") => Promise<void>;
  setOperationMode: (mode: "QUEUE" | "AGENDA_ONLY") => Promise<void>;
  setAcceptingNew: (value: boolean) => Promise<void>;
  setShowPosition: (value: boolean) => Promise<void>;
  setContactPhone: (phone: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  updateMyServiceItem: (
    itemId: string,
    changes: { customName?: string; estimatedMinutes?: number } & Partial<SplitDoPreco>
  ) => Promise<void>;
  removeMyServiceItem: (itemId: string) => Promise<void>;
  fetchMyServices: () => Promise<void>;
  fetchMyReport: (dateFrom?: string, dateTo?: string) => Promise<ProfessionalReport>;
  fetchMe: () => Promise<void>;
  restoreProfessional: () => Promise<void>;
  reset: () => void;
};

export function normalizeProfessional(data: any): Professional {
  return {
    id: data.id,
    name: data.name,
    // tolera variacoes de nome do campo vindas do backend (nickname/nickName/nick_name)
    nickname: data.nickname ?? data.nickName ?? data.nick_name ?? null,
    specialty: data.specialty ?? null,
    establishment_id: data.establishment_id ?? data.establishmentId ?? null,
    establishment_name: data.establishment_name ?? data.establishmentName ?? null,
    establishment_status: data.establishment_status ?? data.establishmentStatus ?? null,
    is_available: data.is_available ?? data.isAvailable ?? true,
    work_status: data.work_status ?? data.workStatus ?? null,
    accepting_new: data.accepting_new ?? data.acceptingNew ?? null,
    operation_mode: data.operation_mode ?? data.operationMode ?? "QUEUE",
    show_position: data.show_position ?? data.showPosition ?? true,
    contact_phone: data.contact_phone ?? data.contactPhone ?? null,
    rating_average: data.rating_average ?? data.ratingAverage ?? null,
    rating_count: data.rating_count ?? data.ratingCount ?? null,
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

  cancelAffiliation: async (affiliationId) => {
    await api.delete(`/affiliations/${affiliationId}`);
  },

  fetchMyAffiliations: async () => {
    const { data } = await api.get("/professional/me/affiliations");
    return data;
  },

  acceptAffiliation: async (affiliationId) => {
    // Convite do owner (type INVITATION) — aceitar vincula o profissional.
    await api.patch(`/affiliations/${affiliationId}/accept`);
    await get().fetchMe();
  },

  rejectAffiliation: async (affiliationId) => {
    await api.patch(`/affiliations/${affiliationId}/reject`);
  },

  addMyServiceItem: async (serviceItemType, customName, split, estimatedMinutes) => {
    const prof = get().professional;
    if (!prof) throw new Error("Professional not found");

    const { data } = await api.post(
      `/professional-queue/${prof.id}/add-service-items`,
      { serviceItemType, customName, ...split, ...(estimatedMinutes ? { estimatedMinutes } : {}) }
    );
    return data;
  },

  updateMyProfile: async (changes) => {
    // PATCH /professional/me — name (=firstName) e/ou specialty, ambos opcionais.
    await api.patch("/professional/me", changes);
    await get().fetchMe();
  },

  // S1 fatia 1: o profissional muda o proprio status de trabalho. Gates do
  // backend: 422 PROFESSIONAL_HAS_NO_SERVICE (entrar em expediente sem servico)
  // e 409 PROFESSIONAL_HAS_ACTIVE_ATTENDANCES (ficar OFF com fila/atendimento).
  // O fetchMe re-le o work_status do DTO do /me.
  updateMyStatus: async (status) => {
    await api.patch("/professional/me/status", { status });
    await get().fetchMe();
  },

  // S1 fatia 3: "fechar fila" (value=false) / reabrir (value=true). Drena — quem
  // ja esta segue; ao terminar o ultimo o backend poe OFF sozinho (e a loja
  // fecha se for o ultimo). O fetchMe re-le accepting_new + work_status do /me.
  // Modo por profissional (8e6c00f): so troca antes do 1o cliente do dia; depois
  // o backend responde 409 OPERATION_MODE_LOCKED e o erro sobe para a tela.
  setOperationMode: async (mode) => {
    await api.patch("/professional/me/operation-mode", { mode });
    await get().fetchMe();
  },

  setAcceptingNew: async (value) => {
    await api.patch("/professional/me/accepting-new", { value });
    await get().fetchMe();
  },

  // expor-posicao (decisao de 05/09, Backend 35d57c0): esconder a posicao do
  // cliente na fila e a escolha ativa — o padrao e mostrar.
  setShowPosition: async (value) => {
    await api.patch("/professional/me", { show_position: value });
    await get().fetchMe();
  },

  // telefone-de-contato (Backend 02dd5ef): em branco = o cliente nao ve
  // telefone. O backend e a fonte da verdade — re-le no /me.
  setContactPhone: async (phone) => {
    await api.patch("/professional/me", { contact_phone: phone.trim() });
    await get().fetchMe();
  },

  updateNickname: async (nickname) => {
    // Apelido e identidade do usuario (BaseUser), escrito so via /profile/general-infos
    // (#16). String vazia limpa o apelido.
    // O `fetchMe` sozinho ja basta desde 2026-07-20: o backend passou a projetar
    // o nickname no GET /professional/me (BUG3/BUG10 fechado). A mitigacao que
    // reescrevia o valor no estado local foi REMOVIDA a pedido deles — manter
    // mascararia uma eventual regressao da projecao.
    await api.patch("/profile/general-infos", { nickname });
    await get().fetchMe();
  },

  updateMyServiceItem: async (itemId, changes) => {
    const prof = get().professional;
    if (!prof) throw new Error("Professional not found");

    await api.patch(
      `/professional-queue/${prof.id}/service-items/${itemId}`,
      changes
    );
    await get().fetchMyServices();
  },

  removeMyServiceItem: async (itemId) => {
    const prof = get().professional;
    if (!prof) throw new Error("Professional not found");

    await api.delete(`/professional-queue/${prof.id}/service-items/${itemId}`);
    await get().fetchMyServices();
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

  fetchMyReport: async (dateFrom, dateTo) => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get("/professional/me/reports", { params });
    return data;
  },

  /**
   * Restaura o perfil profissional no boot.
   *
   * ⚠️ O CACHE LOCAL NAO PODE SER A UNICA FONTE. Antes isto so lia o
   * `SecureStore`; se nao houvesse nada gravado, o `professional` ficava nulo,
   * o `establishmentId` da tela da Fila ficava indefinido e o app dizia
   * **"Para receber clientes, voce precisa estar vinculado a um
   * estabelecimento"** — pra alguem que ESTA vinculado, e ainda mandava
   * vincular de novo.
   *
   * Isso acontece em toda sessao que nao herdou o cache: aparelho novo,
   * reinstalacao, dados limpos, ou o app na web em outro navegador. Ninguem
   * chamava `fetchMe` nem no boot nem no login — o dado so existia por
   * acidente, de uma sessao anterior.
   *
   * Agora o cache serve pra PINTAR RAPIDO, e a API e quem tem a palavra final.
   */
  restoreProfessional: async () => {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) {
      set({ professional: normalizeProfessional(JSON.parse(stored)) });
    }

    // Sem cache, so a API sabe. Falha em silencio de proposito: sem rede o app
    // segue com o que tinha, e quem nao tinha nada ja veria a mesma tela.
    if (!stored) {
      try {
        await get().fetchMe();
      } catch {
        /* offline ou sem perfil profissional — o app trata como antes */
      }
    }
  },

  reset: () => {
    SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ professional: null, myServices: [], isLoading: false, error: null });
  },
}));
