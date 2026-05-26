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
  specialty: "Corte masculino",
  establishment_id: null,
  establishment_name: null,
  is_available: true,
  message: "Professional created! Your ID is permanent.",
};

const AFFILIATE_RESPONSE = {
  id: "prof-uuid-1",
  name: "Joao Silva",
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
});
