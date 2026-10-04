import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
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
  work_status: null,
  accepting_new: null,
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
  work_status: null,
  accepting_new: null,
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
      // normalizeProfessional completa o modo: ausente = fila.
      expect(state.professional).toEqual({ ...REGISTER_RESPONSE, operation_mode: "QUEUE" });
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

    // BUG3/BUG10 fechado no backend (2026-07-20): o GET /professional/me passou
    // a projetar o nickname, entao a mitigacao que reescrevia o valor local foi
    // REMOVIDA. O backend e a fonte da verdade — inclusive para limpar.
    it("limpar o apelido: envia string vazia e reflete o que o backend devolver", async () => {
      useProfessionalStore.setState({
        professional: { ...AFFILIATE_RESPONSE, nickname: "Dedeco" } as any,
      });
      mock.onPatch("/profile/general-infos").reply(200, {});
      mock.onGet("/professional/me").reply(200, { ...AFFILIATE_RESPONSE, nickname: null });

      await useProfessionalStore.getState().updateNickname("");

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ nickname: "" });
      expect(useProfessionalStore.getState().professional?.nickname).toBeNull();
    });

    it("rejects when the PATCH fails", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/profile/general-infos").reply(422, { message: "nickname too long" });

      await expect(
        useProfessionalStore.getState().updateNickname("x".repeat(51))
      ).rejects.toThrow();
    });
  });

  describe("updateMyStatus (S1 fatia 1)", () => {
    it("PATCHes /professional/me/status e refresca o work_status via fetchMe", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me/status").reply(200, {});
      mock.onGet("/professional/me").reply(200, { ...AFFILIATE_RESPONSE, work_status: "ON_BREAK" });

      await useProfessionalStore.getState().updateMyStatus("ON_BREAK");

      expect(mock.history.patch[0].url).toBe("/professional/me/status");
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ status: "ON_BREAK" });
      expect(useProfessionalStore.getState().professional?.work_status).toBe("ON_BREAK");
    });

    it("rejeita no 409 (ficar OFF com fila/atendimento)", async () => {
      mock
        .onPatch("/professional/me/status")
        .reply(409, { message: "PROFESSIONAL_HAS_ACTIVE_ATTENDANCES" });

      await expect(
        useProfessionalStore.getState().updateMyStatus("OFF")
      ).rejects.toThrow();
    });

    it("rejeita no 422 (entrar em expediente sem serviço)", async () => {
      mock
        .onPatch("/professional/me/status")
        .reply(422, { message: "PROFESSIONAL_HAS_NO_SERVICE" });

      await expect(
        useProfessionalStore.getState().updateMyStatus("WORKING")
      ).rejects.toThrow();
    });
  });

  // Modo por profissional (contrato do backend 8e6c00f, D9): fila ou so agenda.
  // Troca so antes do 1o cliente do dia — depois, 409 OPERATION_MODE_LOCKED.
  describe("setOperationMode (fila x so agenda)", () => {
    it("PATCH operation-mode e re-le o modo no /me", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me/operation-mode").reply(200, {});
      mock.onGet("/professional/me").reply(200, { ...AFFILIATE_RESPONSE, operation_mode: "AGENDA_ONLY" });

      await useProfessionalStore.getState().setOperationMode("AGENDA_ONLY");

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ mode: "AGENDA_ONLY" });
      expect(useProfessionalStore.getState().professional?.operation_mode).toBe("AGENDA_ONLY");
    });

    it("sem o campo no /me: tratado como fila (QUEUE)", async () => {
      mock.onGet("/professional/me").reply(200, AFFILIATE_RESPONSE);
      await useProfessionalStore.getState().fetchMe();
      expect(useProfessionalStore.getState().professional?.operation_mode).toBe("QUEUE");
    });

    it("409 OPERATION_MODE_LOCKED sobe para a tela", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me/operation-mode").reply(409, { code: "OPERATION_MODE_LOCKED" });
      await expect(useProfessionalStore.getState().setOperationMode("QUEUE")).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
  });

  describe("setShowPosition (expor-posicao, Backend 35d57c0)", () => {
    it("esconder: PATCH /professional/me {show_position:false} e re-le no /me", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me").reply(200, {});
      mock.onGet("/professional/me").reply(200, { ...AFFILIATE_RESPONSE, show_position: false });

      await useProfessionalStore.getState().setShowPosition(false);

      expect(mock.history.patch[0].url).toBe("/professional/me");
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ show_position: false });
      expect(useProfessionalStore.getState().professional?.show_position).toBe(false);
    });

    it("sem o campo no /me: expoe (o padrao e true)", async () => {
      mock.onGet("/professional/me").reply(200, AFFILIATE_RESPONSE);
      await useProfessionalStore.getState().fetchMe();
      expect(useProfessionalStore.getState().professional?.show_position).toBe(true);
    });

    it("aceita o camelCase (showPosition)", async () => {
      mock.onGet("/professional/me").reply(200, { ...AFFILIATE_RESPONSE, showPosition: false });
      await useProfessionalStore.getState().fetchMe();
      expect(useProfessionalStore.getState().professional?.show_position).toBe(false);
    });
  });

  describe("setAcceptingNew (S1 fatia 3 — fechar/reabrir fila)", () => {
    it("fechar fila: PATCH accepting-new {value:false} e re-le via fetchMe", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me/accepting-new").reply(200, {});
      mock
        .onGet("/professional/me")
        .reply(200, { ...AFFILIATE_RESPONSE, accepting_new: false });

      await useProfessionalStore.getState().setAcceptingNew(false);

      expect(mock.history.patch[0].url).toBe("/professional/me/accepting-new");
      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ value: false });
      expect(useProfessionalStore.getState().professional?.accepting_new).toBe(false);
    });

    it("reabrir fila: PATCH accepting-new {value:true}", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onPatch("/professional/me/accepting-new").reply(200, {});
      mock
        .onGet("/professional/me")
        .reply(200, { ...AFFILIATE_RESPONSE, accepting_new: true });

      await useProfessionalStore.getState().setAcceptingNew(true);

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({ value: true });
      expect(useProfessionalStore.getState().professional?.accepting_new).toBe(true);
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

  describe("setProfessional", () => {
    it("normaliza, persiste no SecureStore e seta o estado", async () => {
      await useProfessionalStore.getState().setProfessional(AFFILIATE_RESPONSE as any);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "vupth_professional",
        expect.any(String)
      );
      expect(useProfessionalStore.getState().professional?.establishment_id).toBe("estab-uuid-1");
    });
  });

  describe("switchEstablishment", () => {
    it("DELETE do estabelecimento atual + POST affiliate no novo", async () => {
      useProfessionalStore.setState({ professional: AFFILIATE_RESPONSE });
      mock.onDelete("/professional/me/establishment").reply(204);
      mock.onPost("/professional/affiliate").reply(200, {
        ...AFFILIATE_RESPONSE,
        establishment_id: "estab-uuid-2",
        establishment_name: "Outra Barbearia",
      });

      await useProfessionalStore.getState().switchEstablishment("estab-uuid-2");

      expect(mock.history.delete[0].url).toBe("/professional/me/establishment");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ establishmentId: "estab-uuid-2" });
      expect(useProfessionalStore.getState().professional?.establishment_id).toBe("estab-uuid-2");
    });
  });

  describe("addMyServiceItem", () => {
    it("manda o tempo do servico quando informado (estimatedMinutes)", async () => {
      useProfessionalStore.setState({ professional: REGISTER_RESPONSE });
      mock.onPost("/professional-queue/prof-uuid-1/add-service-items").reply(201, {});

      await useProfessionalStore
        .getState()
        .addMyServiceItem("BARBA", "Barba", { price: 20.9, pro_receives: 19, base_price: 19 }, 45);

      expect(JSON.parse(mock.history.post[0].data).estimatedMinutes).toBe(45);
    });

    it("lanca quando não há professional carregado", async () => {
      useProfessionalStore.setState({ professional: null });

      await expect(
        useProfessionalStore.getState().addMyServiceItem("CORTE_MAQUINA", "Corte", { price: 40.9, pro_receives: 38, base_price: 38 })
      ).rejects.toThrow("Professional not found");
    });

    it("POST /professional-queue/{id}/add-service-items e retorna o item criado", async () => {
      useProfessionalStore.setState({ professional: REGISTER_RESPONSE });
      const created = { id: "svc-9", serviceItemType: "CORTE_MAQUINA", customName: "Corte", price: 40 };
      mock.onPost("/professional-queue/prof-uuid-1/add-service-items").reply(201, created);

      const out = await useProfessionalStore
        .getState()
        .addMyServiceItem("CORTE_MAQUINA", "Corte", { price: 40.9, pro_receives: 38, base_price: 38 });

      expect(mock.history.post[0].url).toBe("/professional-queue/prof-uuid-1/add-service-items");
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        serviceItemType: "CORTE_MAQUINA",
        customName: "Corte",
        price: 40.9,
        pro_receives: 38,
        base_price: 38,
      });
      expect(out).toEqual(created);
    });
  });

  describe("restoreProfessional", () => {
    it("restaura do SecureStore quando ha valor salvo", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(AFFILIATE_RESPONSE)
      );

      await useProfessionalStore.getState().restoreProfessional();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("vupth_professional");
      expect(useProfessionalStore.getState().professional?.establishment_id).toBe("estab-uuid-1");
    });

    it("não altera o estado quando não há valor salvo", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      await useProfessionalStore.getState().restoreProfessional();

      expect(useProfessionalStore.getState().professional).toBeNull();
    });
  });

  describe("reset", () => {
    it("limpa o estado e apaga o SecureStore", () => {
      useProfessionalStore.setState({
        professional: AFFILIATE_RESPONSE,
        myServices: [{ id: "svc-1" }] as any,
      });

      useProfessionalStore.getState().reset();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_professional");
      const s = useProfessionalStore.getState();
      expect(s.professional).toBeNull();
      expect(s.myServices).toEqual([]);
    });
  });
});
