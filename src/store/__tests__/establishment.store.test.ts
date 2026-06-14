import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { useEstablishmentStore } from "../establishment.store";
import { useAuthStore } from "../auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);

const ESTABLISHMENT_RESPONSE = {
  id: "estab-uuid-1",
  name: "Barbearia Teste",
  service_type: "BARBER",
  status: "ACTIVE",
  open_status: "CLOSED",
  owner_id: "uuid-1",
  created_at: "2026-05-17T10:00:00",
  message: "Establishment created!",
};

beforeEach(() => {
  useEstablishmentStore.setState({
    establishment: null,
    isLoading: false,
    error: null,
  });
  useAuthStore.setState({
    user: { id: "uuid-1", email: "owner@test.com", roles: ["CLIENT"] },
    isAuthenticated: true,
    isLoading: false,
  });
  mock.reset();
  jest.clearAllMocks();
});

describe("establishment.store", () => {
  describe("quickCreate", () => {
    it("calls POST /establishment/quick-create and stores result", async () => {
      mock
        .onPost("/establishment/quick-create")
        .reply(201, ESTABLISHMENT_RESPONSE);

      await useEstablishmentStore
        .getState()
        .quickCreate("Barbearia Teste", "BARBER");

      expect(mock.history.post[0].url).toBe("/establishment/quick-create");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        name: "Barbearia Teste",
        serviceType: "BARBER",
      });

      const state = useEstablishmentStore.getState();
      expect(state.establishment).toEqual(ESTABLISHMENT_RESPONSE);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      mock.onPost("/establishment/quick-create").reply(500);

      await expect(
        useEstablishmentStore
          .getState()
          .quickCreate("Falha", "BARBER")
      ).rejects.toThrow();

      expect(useEstablishmentStore.getState().establishment).toBeNull();
    });
  });

  describe("updateOpenStatus", () => {
    it("calls PATCH /establishment/{id}/open-status with OPEN", async () => {
      useEstablishmentStore.setState({
        establishment: ESTABLISHMENT_RESPONSE,
      });

      const updatedResponse = {
        id: "estab-uuid-1",
        name: "Barbearia Teste",
        services: [],
        serviceType: "BARBER",
        urlImage: null,
        ownerId: "uuid-1",
        open_status: "OPEN",
        status: "ACTIVE",
      };

      mock
        .onPatch("/establishment/estab-uuid-1/open-status")
        .reply(200, updatedResponse);

      await useEstablishmentStore
        .getState()
        .updateOpenStatus("estab-uuid-1", "OPEN");

      expect(mock.history.patch[0].url).toBe(
        "/establishment/estab-uuid-1/open-status"
      );
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({
        openStatus: "OPEN",
      });
    });

    it("calls PATCH with CLOSED", async () => {
      mock
        .onPatch("/establishment/estab-uuid-1/open-status")
        .reply(200, { ...ESTABLISHMENT_RESPONSE, open_status: "CLOSED" });

      await useEstablishmentStore
        .getState()
        .updateOpenStatus("estab-uuid-1", "CLOSED");

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({
        openStatus: "CLOSED",
      });
    });
  });

  describe("quickCreateProfessional", () => {
    it("calls POST /professional/quick-create with name and establishmentId", async () => {
      const profResponse = {
        id: "prof-uuid-1",
        name: "Carlos",
        specialty: "BARBER",
        establishment_id: "estab-uuid-1",
        establishment_name: "Barbearia Teste",
        is_available: true,
        message: "Professional created!",
      };

      mock.onPost("/professional/quick-create").reply(201, profResponse);

      const result = await useEstablishmentStore
        .getState()
        .quickCreateProfessional("Carlos", "estab-uuid-1", "BARBER");

      expect(mock.history.post[0].url).toBe("/professional/quick-create");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        name: "Carlos",
        establishmentId: "estab-uuid-1",
        specialty: "BARBER",
      });
      expect(result).toEqual(profResponse);
    });

    it("sends specialty as undefined when not provided", async () => {
      const profResponse = {
        id: "prof-uuid-2",
        name: "Ana",
        specialty: null,
        establishment_id: "estab-uuid-1",
        establishment_name: "Barbearia Teste",
        is_available: true,
        message: "Professional created!",
      };

      mock.onPost("/professional/quick-create").reply(201, profResponse);

      await useEstablishmentStore
        .getState()
        .quickCreateProfessional("Ana", "estab-uuid-1");

      const sentData = JSON.parse(mock.history.post[0].data);
      expect(sentData.name).toBe("Ana");
      expect(sentData.establishmentId).toBe("estab-uuid-1");
    });
  });

  describe("searchByName", () => {
    it("calls GET /establishment?name=X and returns results", async () => {
      const establishments = [
        {
          id: "estab-uuid-1",
          services: ["BARBER"],
          name: "Barbearia do Andre",
          urlImage: null,
          ownerId: "uuid-1",
          open_status: "OPEN",
          status: "ACTIVE",
        },
        {
          id: "estab-uuid-2",
          services: ["BARBER"],
          name: "Barbearia Premium",
          urlImage: null,
          ownerId: "uuid-2",
          open_status: "CLOSED",
          status: "ACTIVE",
        },
      ];

      mock.onGet("/establishment", { params: { name: "Barbearia" } }).reply(200, establishments);

      const result = await useEstablishmentStore
        .getState()
        .searchByName("Barbearia");

      expect(mock.history.get[0].url).toBe("/establishment");
      expect(mock.history.get[0].params).toEqual({ name: "Barbearia" });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Barbearia do Andre");
    });

    it("returns empty array when no results", async () => {
      mock.onGet("/establishment", { params: { name: "xyz" } }).reply(200, []);

      const result = await useEstablishmentStore
        .getState()
        .searchByName("xyz");

      expect(result).toEqual([]);
    });

    it("calls GET /establishment without params when name is empty", async () => {
      const establishments = [
        {
          id: "estab-uuid-1",
          services: ["BARBER"],
          name: "Barbearia do Andre",
          urlImage: null,
          ownerId: "uuid-1",
          open_status: "OPEN",
          status: "ACTIVE",
        },
      ];

      mock.onGet("/establishment").reply(200, establishments);

      const result = await useEstablishmentStore
        .getState()
        .searchByName("");

      expect(mock.history.get[0].params).toEqual({});
      expect(result).toHaveLength(1);
    });
  });

  describe("addServiceItem", () => {
    it("calls POST /establishment/{id}/service-items", async () => {
      const serviceResponse = {
        id: "service-uuid-1",
        serviceItemType: "CORTE_MAQUINA",
        customName: "Corte Simples",
        price: 35.0,
        estimatedMinutes: 30,
      };

      mock
        .onPost("/establishment/estab-uuid-1/service-items")
        .reply(201, serviceResponse);

      const result = await useEstablishmentStore
        .getState()
        .addServiceItem("estab-uuid-1", "CORTE_MAQUINA", "Corte Simples", 35.0);

      expect(mock.history.post[0].url).toBe(
        "/establishment/estab-uuid-1/service-items"
      );
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        serviceItemType: "CORTE_MAQUINA",
        customName: "Corte Simples",
        price: 35.0,
      });
      expect(result).toEqual(serviceResponse);
    });
  });

  describe("fetchMine", () => {
    it("calls GET /establishment/mine and stores the first establishment", async () => {
      mock.onGet("/establishment/mine").reply(200, [ESTABLISHMENT_RESPONSE]);

      await useEstablishmentStore.getState().fetchMine();

      expect(mock.history.get[0].url).toBe("/establishment/mine");
      expect(useEstablishmentStore.getState().establishment?.id).toBe(
        "estab-uuid-1"
      );
    });

    it("keeps state when owner has no establishments", async () => {
      mock.onGet("/establishment/mine").reply(200, []);

      await useEstablishmentStore.getState().fetchMine();

      expect(useEstablishmentStore.getState().establishment).toBeNull();
    });
  });

  describe("removeProfessional", () => {
    it("calls DELETE /establishment/{id}/professionals/{professionalId}", async () => {
      mock
        .onDelete("/establishment/estab-uuid-1/professionals/prof-uuid-1")
        .reply(204);

      await useEstablishmentStore
        .getState()
        .removeProfessional("estab-uuid-1", "prof-uuid-1");

      expect(mock.history.delete[0].url).toBe(
        "/establishment/estab-uuid-1/professionals/prof-uuid-1"
      );
    });

    it("rejects when the professional has an active attendance", async () => {
      mock
        .onDelete("/establishment/estab-uuid-1/professionals/prof-uuid-1")
        .reply(409, { message: "Professional has an active attendance" });

      await expect(
        useEstablishmentStore
          .getState()
          .removeProfessional("estab-uuid-1", "prof-uuid-1")
      ).rejects.toThrow();
    });
  });
});
