import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { useProfessionalStore } from "../professional.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);

const REGISTER_RESPONSE = {
  id: "prof-uuid-1",
  name: "Joao Silva",
  nickname: null,
  specialty: "Corte masculino",
  establishment_id: null,
  establishment_name: null,
  is_available: true,
  message: "Professional created! Your ID is permanent.",
};

const AFFILIATE_RESPONSE = {
  id: "prof-uuid-1",
  name: "Joao Silva",
  nickname: null,
  specialty: "Corte masculino",
  establishment_id: "estab-uuid-1",
  establishment_name: "Barbearia do Andre",
  is_available: true,
  message: "Affiliated successfully.",
};

beforeEach(() => {
  useProfessionalStore.setState({
    professional: null,
    isLoading: false,
    error: null,
  });
  mock.reset();
  jest.clearAllMocks();
});

describe("professional.store", () => {
  describe("register", () => {
    it("calls POST /professional/register with name and specialty", async () => {
      mock.onPost("/professional/register").reply(201, REGISTER_RESPONSE);

      await useProfessionalStore
        .getState()
        .register("Joao Silva", "Corte masculino");

      expect(mock.history.post[0].url).toBe("/professional/register");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        name: "Joao Silva",
        specialty: "Corte masculino",
      });

      const state = useProfessionalStore.getState();
      expect(state.professional).toEqual(REGISTER_RESPONSE);
      expect(state.professional?.establishment_id).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("registers without specialty", async () => {
      const response = { ...REGISTER_RESPONSE, specialty: null };
      mock.onPost("/professional/register").reply(201, response);

      await useProfessionalStore.getState().register("Joao Silva");

      const sentData = JSON.parse(mock.history.post[0].data);
      expect(sentData.name).toBe("Joao Silva");
      expect(sentData.specialty).toBeUndefined();

      expect(useProfessionalStore.getState().professional?.specialty).toBeNull();
    });

    it("sets error on 409 already professional", async () => {
      mock.onPost("/professional/register").reply(409, {
        status: 409,
        code: "USER_ALREADY_PROFESSIONAL",
        message: "User already has a professional profile.",
      });

      await expect(
        useProfessionalStore.getState().register("Joao Silva", "Corte")
      ).rejects.toThrow();

      expect(useProfessionalStore.getState().professional).toBeNull();
    });
  });

  describe("affiliate", () => {
    it("calls POST /professional/affiliate with establishmentId", async () => {
      useProfessionalStore.setState({
        professional: REGISTER_RESPONSE,
      });

      mock.onPost("/professional/affiliate").reply(200, AFFILIATE_RESPONSE);

      await useProfessionalStore
        .getState()
        .affiliate("estab-uuid-1");

      expect(mock.history.post[0].url).toBe("/professional/affiliate");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        establishmentId: "estab-uuid-1",
      });

      const state = useProfessionalStore.getState();
      expect(state.professional?.establishment_id).toBe("estab-uuid-1");
      expect(state.professional?.establishment_name).toBe("Barbearia do Andre");
    });

    it("rejects on 409 already affiliated", async () => {
      mock.onPost("/professional/affiliate").reply(409, {
        status: 409,
        code: "PROFESSIONAL_ALREADY_AFFILIATED",
        message: "Professional is already affiliated to another establishment.",
      });

      await expect(
        useProfessionalStore.getState().affiliate("estab-uuid-2")
      ).rejects.toThrow();
    });

    it("rejects on 404 establishment not found", async () => {
      mock.onPost("/professional/affiliate").reply(404, {
        status: 404,
        code: "ESTABLISHMENT_NOT_FOUND",
        message: "Establishment not found.",
      });

      await expect(
        useProfessionalStore.getState().affiliate("invalid-uuid")
      ).rejects.toThrow();
    });
  });

  describe("requestAffiliation", () => {
    it("calls POST /professional/me/affiliations with establishmentId", async () => {
      mock.onPost("/professional/me/affiliations").reply(201, {
        id: "aff-uuid-1",
        status: "PENDING",
      });

      await useProfessionalStore.getState().requestAffiliation("estab-uuid-1");

      expect(mock.history.post[0].url).toBe("/professional/me/affiliations");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        establishmentId: "estab-uuid-1",
      });
    });

    it("rejects on 409 affiliation already pending", async () => {
      mock.onPost("/professional/me/affiliations").reply(409, {
        status: 409,
        code: "AFFILIATION_ALREADY_PENDING",
        message: "There is already a pending affiliation request.",
      });

      await expect(
        useProfessionalStore.getState().requestAffiliation("estab-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("cancelAffiliation", () => {
    it("calls DELETE /affiliations/{id}", async () => {
      mock.onDelete("/affiliations/aff-uuid-1").reply(200, {
        id: "aff-uuid-1",
        status: "CANCELLED",
      });

      await useProfessionalStore.getState().cancelAffiliation("aff-uuid-1");

      expect(mock.history.delete[0].url).toBe("/affiliations/aff-uuid-1");
    });

    it("rejects when the request fails", async () => {
      mock.onDelete("/affiliations/aff-uuid-1").reply(404, {
        message: "Affiliation not found",
      });

      await expect(
        useProfessionalStore.getState().cancelAffiliation("aff-uuid-1")
      ).rejects.toThrow();
    });
  });

  describe("fetchMyAffiliations", () => {
    it("GET /professional/me/affiliations retorna a lista", async () => {
      const affs = [
        { id: "aff-1", type: "INVITATION", status: "PENDING", establishmentName: "Barbearia X" },
      ];
      mock.onGet("/professional/me/affiliations").reply(200, affs);

      const out = await useProfessionalStore.getState().fetchMyAffiliations();

      expect(mock.history.get[0].url).toBe("/professional/me/affiliations");
      expect(out).toEqual(affs);
    });
  });

  describe("acceptAffiliation", () => {
    it("PATCH /affiliations/{id}/accept e atualiza via fetchMe", async () => {
      useProfessionalStore.setState({ professional: REGISTER_RESPONSE });
      mock.onPatch("/affiliations/aff-1/accept").reply(200, {});
      mock.onGet("/professional/me").reply(200, AFFILIATE_RESPONSE);

      await useProfessionalStore.getState().acceptAffiliation("aff-1");

      expect(mock.history.patch[0].url).toBe("/affiliations/aff-1/accept");
      expect(useProfessionalStore.getState().professional?.establishment_id).toBe("estab-uuid-1");
    });
  });

  describe("rejectAffiliation", () => {
    it("PATCH /affiliations/{id}/reject", async () => {
      mock.onPatch("/affiliations/aff-1/reject").reply(200, {});

      await useProfessionalStore.getState().rejectAffiliation("aff-1");

      expect(mock.history.patch[0].url).toBe("/affiliations/aff-1/reject");
    });
  });

  describe("fetchMyReport", () => {
    it("GET /professional/me/reports com dateFrom/dateTo", async () => {
      const report = { totalAttendances: 12, totalRevenue: 480, avgDurationMinutes: 30, topService: "CORTE_MAQUINA" };
      mock.onGet("/professional/me/reports").reply(200, report);

      const out = await useProfessionalStore.getState().fetchMyReport("2026-06-01", "2026-06-17");

      expect(mock.history.get[0].params).toEqual({ dateFrom: "2026-06-01", dateTo: "2026-06-17" });
      expect(out).toEqual(report);
    });
  });

  describe("fetchMe", () => {
    it("calls GET /professional/me and updates the professional", async () => {
      mock.onGet("/professional/me").reply(200, AFFILIATE_RESPONSE);

      await useProfessionalStore.getState().fetchMe();

      expect(mock.history.get[0].url).toBe("/professional/me");
      const state = useProfessionalStore.getState();
      expect(state.professional?.establishment_id).toBe("estab-uuid-1");
      expect(state.professional?.establishment_name).toBe("Barbearia do Andre");
    });

    it("detects affiliation accepted while unaffiliated locally", async () => {
      useProfessionalStore.setState({ professional: REGISTER_RESPONSE });
      mock.onGet("/professional/me").reply(200, AFFILIATE_RESPONSE);

      await useProfessionalStore.getState().fetchMe();

      expect(
        useProfessionalStore.getState().professional?.establishment_id
      ).toBe("estab-uuid-1");
    });
  });

  describe("leaveEstablishment", () => {
    it("calls DELETE /professional/me/establishment, clears services and refreshes", async () => {
      useProfessionalStore.setState({
        professional: AFFILIATE_RESPONSE,
        myServices: [
          { id: "svc-1", serviceItemType: "CORTE_MAQUINA", customName: "Corte", price: 37.9, estimatedMinutes: 30 },
        ] as any,
      });

      mock.onDelete("/professional/me/establishment").reply(204);
      mock.onGet("/professional/me").reply(200, REGISTER_RESPONSE);

      await useProfessionalStore.getState().leaveEstablishment();

      expect(mock.history.delete[0].url).toBe("/professional/me/establishment");
      const state = useProfessionalStore.getState();
      expect(state.professional?.establishment_id).toBeNull();
      expect(state.myServices).toEqual([]);
    });

    it("keeps professional state if DELETE fails", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onDelete("/professional/me/establishment").reply(500, {
        message: "Internal error",
      });

      await expect(
        useProfessionalStore.getState().leaveEstablishment()
      ).rejects.toThrow();

      expect(
        useProfessionalStore.getState().professional?.establishment_id
      ).toBe("estab-uuid-1");
    });
  });

  describe("updateMyProfile", () => {
    it("calls PATCH /professional/me with the changes and refreshes via fetchMe", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me").reply(200, {});
      mock
        .onGet("/professional/me")
        .reply(200, { ...AFFILIATE_RESPONSE, name: "Joao Atualizado" });

      await useProfessionalStore.getState().updateMyProfile({ name: "Joao Atualizado" });

      expect(mock.history.patch[0].url).toBe("/professional/me");
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ name: "Joao Atualizado" });
      expect(useProfessionalStore.getState().professional?.name).toBe("Joao Atualizado");
    });

    it("rejects when the PATCH fails", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me").reply(400, { message: "Invalid name" });

      await expect(
        useProfessionalStore.getState().updateMyProfile({ name: "x" })
      ).rejects.toThrow();
    });
  });

  describe("updateNickname", () => {
    it("calls PATCH /profile/general-infos with the nickname and refreshes via fetchMe", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/profile/general-infos").reply(200, {});
      mock
        .onGet("/professional/me")
        .reply(200, { ...AFFILIATE_RESPONSE, nickname: "Dedeco" });

      await useProfessionalStore.getState().updateNickname("Dedeco");

      expect(mock.history.patch[0].url).toBe("/profile/general-infos");
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ nickname: "Dedeco" });
      expect(useProfessionalStore.getState().professional?.nickname).toBe("Dedeco");
    });

    it("rejects when the PATCH fails", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/profile/general-infos").reply(422, { message: "nickname too long" });

      await expect(
        useProfessionalStore.getState().updateNickname("x".repeat(51))
      ).rejects.toThrow();
    });
  });

  describe("updateMyServiceItem", () => {
    it("calls PATCH /professional-queue/{id}/service-items/{itemId} and refreshes the list", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock
        .onPatch("/professional-queue/prof-uuid-1/service-items/svc-1")
        .reply(200, {});
      mock.onGet("/professional/prof-uuid-1/service-items").reply(200, [
        { id: "svc-1", serviceItemType: "CORTE_MAQUINA", customName: "Corte Social", price: 42, estimatedMinutes: 30 },
      ]);

      await useProfessionalStore
        .getState()
        .updateMyServiceItem("svc-1", { customName: "Corte Social", price: 42 });

      expect(mock.history.patch[0].url).toBe(
        "/professional-queue/prof-uuid-1/service-items/svc-1"
      );
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({
        customName: "Corte Social",
        price: 42,
      });
      expect(useProfessionalStore.getState().myServices[0].customName).toBe("Corte Social");
    });
  });

  describe("removeMyServiceItem", () => {
    it("calls DELETE /professional-queue/{id}/service-items/{itemId} and refreshes the list", async () => {
      useProfessionalStore.setState({
        professional: AFFILIATE_RESPONSE,
        myServices: [
          { id: "svc-1", serviceItemType: "CORTE_MAQUINA", customName: "Corte", price: 37.9, estimatedMinutes: 30 },
        ] as any,
      });
      mock
        .onDelete("/professional-queue/prof-uuid-1/service-items/svc-1")
        .reply(204);
      mock.onGet("/professional/prof-uuid-1/service-items").reply(200, []);

      await useProfessionalStore.getState().removeMyServiceItem("svc-1");

      expect(mock.history.delete[0].url).toBe(
        "/professional-queue/prof-uuid-1/service-items/svc-1"
      );
      expect(useProfessionalStore.getState().myServices).toEqual([]);
    });
  });
});
