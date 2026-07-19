import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { useAttendanceStore } from "../attendance.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);

const QUEUE_RESPONSE = {
  id: "estab-uuid-1",
  name: "Barbearia Teste",
  url_image: null,
  services: ["BARBER"],
  owner_id: "uuid-1",
  open_status: "OPEN",
  total_in_queue: 2,
  available_professionals: 1,
  professionals: [
    {
      id: "prof-uuid-1",
      name: "Carlos",
      specialty: "BARBER",
      is_available: true,
      current_attendance: null,
      waiting_list: [
        {
          id: "att-uuid-1",
          establishmentId: "estab-uuid-1",
          establishmentName: "Barbearia Teste",
          professionalId: "prof-uuid-1",
          professionalName: "Carlos",
          clientId: "client-uuid-1",
          clientName: "Joao",
          services: [{ id: "svc-1", customName: "Corte Degradê", estimatedMinutes: 30 }],
          status: "SCHEDULED",
          totalValue: 35.0,
          scheduledTime: "2026-05-30T14:00:00Z",
          estimatedMinutes: 30,
          durationInMinutes: null,
        },
      ],
      queue_count: 1,
      estimated_wait_minutes: 30,
    },
  ],
};

const IN_PROGRESS_RESPONSE = {
  id: "att-uuid-1",
  establishmentId: "estab-uuid-1",
  establishmentName: "Barbearia Teste",
  professionalId: "prof-uuid-1",
  professionalName: "Carlos",
  clientId: "client-uuid-1",
  clientName: "Joao",
  services: [{ id: "svc-1", customName: "Corte Degradê", estimatedMinutes: 30 }],
  status: "IN_PROGRESS",
  totalValue: 35.0,
  scheduledTime: "2026-05-30T14:00:00Z",
  estimatedMinutes: 30,
  durationInMinutes: null,
  startTime: "2026-05-30T14:02:00Z",
  elapsedMinutes: 0,
  pausedTimeMinutes: 0,
  totalElapsedMinutes: 0,
  remainingMinutes: 30,
  isPaused: false,
};

const PROFESSIONAL_QUEUE_RESPONSE = {
  professionalId: "prof-uuid-1",
  professionalName: "Carlos",
  establishmentId: "estab-uuid-1",
  establishmentName: "Barbearia Teste",
  size: 2,
  attendancesInQueue: [
    {
      id: "att-uuid-1",
      establishmentId: "estab-uuid-1",
      establishmentName: "Barbearia Teste",
      professionalId: "prof-uuid-1",
      professionalName: "Carlos",
      clientId: "client-uuid-1",
      clientName: "Joao",
      services: [{ id: "svc-1", customName: "Corte Degradê", estimatedMinutes: 30 }],
      status: "SCHEDULED",
      totalValue: 35.0,
      scheduledTime: "2026-05-30T14:00:00Z",
      estimatedMinutes: 30,
      durationInMinutes: null,
    },
  ],
  totalEstimatedMinutes: 60,
  totalElapsedMinutes: 0,
  totalRemainingMinutes: 60,
  inAttendance: null,
};

const HISTORY_RESPONSE = [
  {
    id: "att-hist-1",
    establishmentId: "estab-uuid-1",
    establishmentName: "Barbearia Teste",
    professionalId: "prof-uuid-1",
    professionalName: "Carlos",
    clientId: "client-uuid-1",
    clientName: "Joao",
    services: [{ id: "svc-1", customName: "Corte Degradê", estimatedMinutes: 30 }],
    status: "FINISHED",
    totalValue: 35.0,
    scheduledTime: "2026-05-30T14:00:00Z",
    startTime: "2026-05-30T14:02:00Z",
    endTime: "2026-05-30T14:30:00Z",
    durationInMinutes: 28,
  },
];

beforeEach(() => {
  useAttendanceStore.setState({
    professionals: [],
    establishmentData: null,
    history: [],
    isLoading: false,
    error: null,
  });
  mock.reset();
  jest.clearAllMocks();
});

describe("attendance.store", () => {
  describe("fetchQueue", () => {
    it("calls GET /establishment/id/{id}/professionals-with-queue and stores result", async () => {
      mock
        .onGet("/establishment/id/estab-uuid-1/professionals-with-queue")
        .reply(200, QUEUE_RESPONSE);

      await useAttendanceStore.getState().fetchQueue("estab-uuid-1");

      expect(mock.history.get[0].url).toBe(
        "/establishment/id/estab-uuid-1/professionals-with-queue"
      );

      const state = useAttendanceStore.getState();
      expect(state.professionals).toHaveLength(1);
      expect(state.professionals[0].name).toBe("Carlos");
      expect(state.professionals[0].queue_count).toBe(1);
      expect(state.establishmentData?.name).toBe("Barbearia Teste");
      expect(state.isLoading).toBe(false);
    });

    it("throws on 404 establishment not found", async () => {
      mock
        .onGet("/establishment/id/invalid-uuid/professionals-with-queue")
        .reply(404, { code: "ESTABLISHMENT_NOT_FOUND" });

      await expect(
        useAttendanceStore.getState().fetchQueue("invalid-uuid")
      ).rejects.toThrow();
    });

    it("cai para [] quando a resposta nao traz o campo professionals", async () => {
      mock
        .onGet("/establishment/id/estab-sem-profs/professionals-with-queue")
        .reply(200, { name: "Loja Sem Profs" });

      await useAttendanceStore.getState().fetchQueue("estab-sem-profs");

      expect(useAttendanceStore.getState().professionals).toEqual([]);
      expect(useAttendanceStore.getState().establishmentData?.name).toBe("Loja Sem Profs");
    });
  });

  describe("startAttendance", () => {
    it("calls PATCH /attendances/{id}/start and returns in-progress data", async () => {
      mock
        .onPatch("/attendances/att-uuid-1/start")
        .reply(200, IN_PROGRESS_RESPONSE);

      const result = await useAttendanceStore
        .getState()
        .startAttendance("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/start");
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.startTime).toBeDefined();
      expect(result.remainingMinutes).toBe(30);
    });

    it("throws on 400 invalid status transition", async () => {
      mock.onPatch("/attendances/att-uuid-1/start").reply(400, {
        code: "ATTENDANCE_INVALID_STATUS",
        message: "Cannot start attendance with status FINISHED",
      });

      await expect(
        useAttendanceStore.getState().startAttendance("att-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("finishAttendance", () => {
    it("calls PATCH /attendances/{id}/finish", async () => {
      mock.onPatch("/attendances/att-uuid-1/finish").reply(200);

      await useAttendanceStore.getState().finishAttendance("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/finish");
    });

    it("throws on 404 attendance not found", async () => {
      mock.onPatch("/attendances/invalid/finish").reply(404, {
        code: "ATTENDANCE_NOT_FOUND",
      });

      await expect(
        useAttendanceStore.getState().finishAttendance("invalid")
      ).rejects.toThrow();
    });
  });

  describe("pauseAttendance", () => {
    it("calls PATCH /attendances/{id}/pause", async () => {
      mock.onPatch("/attendances/att-uuid-1/pause").reply(200);

      await useAttendanceStore.getState().pauseAttendance("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/pause");
    });
  });

  describe("resumeAttendance", () => {
    it("calls PATCH /attendances/{id}/resume and returns updated data", async () => {
      const resumeResponse = { ...IN_PROGRESS_RESPONSE, isPaused: false, elapsedMinutes: 5 };
      mock.onPatch("/attendances/att-uuid-1/resume").reply(200, resumeResponse);

      const result = await useAttendanceStore
        .getState()
        .resumeAttendance("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/resume");
      expect(result.isPaused).toBe(false);
    });
  });

  describe("removeFromQueue", () => {
    it("calls DELETE /professional-queue/{id}/remove", async () => {
      mock.onDelete("/professional-queue/att-uuid-1/remove").reply(200);

      await useAttendanceStore.getState().removeFromQueue("att-uuid-1");

      expect(mock.history.delete[0].url).toBe(
        "/professional-queue/att-uuid-1/remove"
      );
    });
  });

  describe("fetchProfessionalQueue", () => {
    it("calls GET /client-queue/{profId}/queue with establishmentId param", async () => {
      mock
        .onGet("/client-queue/prof-uuid-1/queue")
        .reply(200, PROFESSIONAL_QUEUE_RESPONSE);

      const result = await useAttendanceStore
        .getState()
        .fetchProfessionalQueue("prof-uuid-1", "estab-uuid-1");

      expect(mock.history.get[0].url).toBe("/client-queue/prof-uuid-1/queue");
      expect(mock.history.get[0].params).toEqual({ establishmentId: "estab-uuid-1" });
      expect(result.professionalName).toBe("Carlos");
      expect(result.size).toBe(2);
      expect(result.attendancesInQueue).toHaveLength(1);
    });

    it("throws on 404 professional not found", async () => {
      mock
        .onGet("/client-queue/invalid/queue")
        .reply(404, { code: "PROFESSIONAL_NOT_FOUND" });

      await expect(
        useAttendanceStore.getState().fetchProfessionalQueue("invalid", "estab-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("addGuestAttendance", () => {
    it("calls POST /professional-queue/add-quest-attendance with guest data", async () => {
      mock
        .onPost("/professional-queue/add-quest-attendance")
        .reply(201, PROFESSIONAL_QUEUE_RESPONSE);

      const result = await useAttendanceStore.getState().addGuestAttendance({
        professionalId: "prof-uuid-1",
        establishmentId: "estab-uuid-1",
        serviceItemIds: ["svc-1"],
        clientName: "Maria Walk-in",
      });

      expect(mock.history.post[0].url).toBe("/professional-queue/add-quest-attendance");
      const sentData = JSON.parse(mock.history.post[0].data);
      expect(sentData).toEqual({
        professionalId: "prof-uuid-1",
        establishmentId: "estab-uuid-1",
        serviceItemIds: ["svc-1"],
        clientName: "Maria Walk-in",
      });
      expect(result.professionalName).toBe("Carlos");
    });

    it("throws on 400 missing required fields", async () => {
      mock
        .onPost("/professional-queue/add-quest-attendance")
        .reply(400, { message: "Lista de serviços não pode estar vazia" });

      await expect(
        useAttendanceStore.getState().addGuestAttendance({
          professionalId: "prof-uuid-1",
          establishmentId: "estab-uuid-1",
          serviceItemIds: [],
          clientName: "Guest",
        })
      ).rejects.toThrow();
    });
  });

  describe("fetchHistory", () => {
    it("calls GET /attendances with query params and stores result", async () => {
      mock.onGet("/attendances").reply(200, HISTORY_RESPONSE);

      const result = await useAttendanceStore.getState().fetchHistory({
        establishmentId: "estab-uuid-1",
        status: "FINISHED",
      });

      expect(mock.history.get[0].url).toBe("/attendances");
      expect(mock.history.get[0].params).toEqual({
        establishmentId: "estab-uuid-1",
        status: "FINISHED",
      });
      expect(result).toHaveLength(1);
      expect(result[0].clientName).toBe("Joao");
      expect(result[0].durationInMinutes).toBe(28);

      const state = useAttendanceStore.getState();
      expect(state.history).toHaveLength(1);
    });

    it("calls GET /attendances with professionalId param", async () => {
      mock.onGet("/attendances").reply(200, HISTORY_RESPONSE);

      await useAttendanceStore.getState().fetchHistory({
        professionalId: "prof-uuid-1",
      });

      expect(mock.history.get[0].params).toEqual({
        professionalId: "prof-uuid-1",
      });
    });

    it("returns empty array when no history", async () => {
      mock.onGet("/attendances").reply(200, []);

      const result = await useAttendanceStore.getState().fetchHistory({
        establishmentId: "estab-uuid-1",
      });

      expect(result).toEqual([]);
      expect(useAttendanceStore.getState().history).toEqual([]);
    });
  });

  describe("reset", () => {
    it("clears all state including history", () => {
      useAttendanceStore.setState({
        professionals: QUEUE_RESPONSE.professionals as any,
        establishmentData: QUEUE_RESPONSE as any,
        history: HISTORY_RESPONSE as any,
        isLoading: true,
        error: "some error",
      });

      useAttendanceStore.getState().reset();

      const state = useAttendanceStore.getState();
      expect(state.professionals).toEqual([]);
      expect(state.establishmentData).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("markLate / undoLate", () => {
    it("calls PATCH /attendances/{id}/late", async () => {
      mock.onPatch("/attendances/att-uuid-1/late").reply(200);

      await useAttendanceStore.getState().markLate("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/late");
    });

    it("calls PATCH /attendances/{id}/undo-late", async () => {
      mock.onPatch("/attendances/att-uuid-1/undo-late").reply(200);

      await useAttendanceStore.getState().undoLate("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/undo-late");
    });

    it("rejects on 400 invalid status for late", async () => {
      mock.onPatch("/attendances/att-uuid-1/late").reply(400, {
        message: "Invalid status",
      });

      await expect(
        useAttendanceStore.getState().markLate("att-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("noShow", () => {
    it("calls PATCH /attendances/{id}/no-show", async () => {
      mock.onPatch("/attendances/att-uuid-1/no-show").reply(200);

      await useAttendanceStore.getState().noShow("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/no-show");
    });

    it("rejects on 400 (atendimento nao esta em LATE)", async () => {
      mock.onPatch("/attendances/att-uuid-1/no-show").reply(400, {
        message: "Invalid status",
      });

      await expect(
        useAttendanceStore.getState().noShow("att-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("promoteAttendance", () => {
    it("calls PATCH /attendances/{id}/promote", async () => {
      mock.onPatch("/attendances/att-uuid-1/promote").reply(200);

      await useAttendanceStore.getState().promoteAttendance("att-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/att-uuid-1/promote");
    });

    it("rejects on error", async () => {
      mock.onPatch("/attendances/att-uuid-1/promote").reply(400, {
        message: "Invalid status",
      });

      await expect(
        useAttendanceStore.getState().promoteAttendance("att-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("acceptCutRequest / refuseCutRequest", () => {
    const CUT = {
      id: "cut-uuid-1",
      status: "ACCEPTED",
      professional_id: "prof-uuid-1",
      establishment_id: "estab-uuid-1",
      client_id: "client-uuid-1",
      service_item_ids: ["svc-1"],
      expires_at: "2026-07-18T14:05:00Z",
      created_at: "2026-07-18T14:00:00Z",
      resulting_attendance_id: "att-uuid-9",
    };

    it("accept: PATCH /attendances/cut-requests/{id}/accept e devolve o response", async () => {
      mock.onPatch("/attendances/cut-requests/cut-uuid-1/accept").reply(200, CUT);

      const res = await useAttendanceStore.getState().acceptCutRequest("cut-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/cut-requests/cut-uuid-1/accept");
      expect(res.status).toBe("ACCEPTED");
      expect(res.resulting_attendance_id).toBe("att-uuid-9");
    });

    it("refuse: PATCH /attendances/cut-requests/{id}/refuse", async () => {
      mock.onPatch("/attendances/cut-requests/cut-uuid-1/refuse").reply(200, { ...CUT, status: "REFUSED", resulting_attendance_id: null });

      const res = await useAttendanceStore.getState().refuseCutRequest("cut-uuid-1");

      expect(mock.history.patch[0].url).toBe("/attendances/cut-requests/cut-uuid-1/refuse");
      expect(res.status).toBe("REFUSED");
    });

    it("rejeita no 409 (pedido ja decidido)", async () => {
      mock.onPatch("/attendances/cut-requests/cut-uuid-1/accept").reply(409, {
        message: "CUT_REQUEST_NOT_PENDING",
      });

      await expect(
        useAttendanceStore.getState().acceptCutRequest("cut-uuid-1")
      ).rejects.toThrow();
    });
  });
});
