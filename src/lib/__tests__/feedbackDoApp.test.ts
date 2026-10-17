import * as SecureStore from "expo-secure-store";
import { Linking } from "react-native";

import {
  INTERVALO_APOS_ENVIAR,
  INTERVALO_SEM_ENVIAR,
  linkDoFeedback,
  pedirFeedbackDoApp,
  podePedirFeedback,
} from "@lib/feedbackDoApp";
import { abrirDialogo } from "@store/dialogo.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock("@store/dialogo.store", () => ({ abrirDialogo: jest.fn() }));

const get = SecureStore.getItemAsync as jest.Mock;
const set = SecureStore.setItemAsync as jest.Mock;
const dialogo = abrirDialogo as jest.Mock;

describe("feedbackDoApp", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    get.mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  it("o link leva perfil e categoria", () => {
    expect(linkDoFeedback("dono")).toBe(
      "https://vupth-support.pages.dev/contato.html?perfil=dono&categoria=feedback",
    );
  });

  it("respeita 30 dias sem enviar e 90 depois de enviar", () => {
    expect(podePedirFeedback(null, 1)).toBe(true);
    expect(podePedirFeedback({ em: 0, enviou: false }, INTERVALO_SEM_ENVIAR - 1)).toBe(false);
    expect(podePedirFeedback({ em: 0, enviou: false }, INTERVALO_SEM_ENVIAR)).toBe(true);
    expect(podePedirFeedback({ em: 0, enviou: true }, INTERVALO_SEM_ENVIAR)).toBe(false);
    expect(podePedirFeedback({ em: 0, enviou: true }, INTERVALO_APOS_ENVIAR)).toBe(true);
  });

  it("sim: abre o formulario e grava que enviou", async () => {
    dialogo.mockResolvedValue(0);
    await pedirFeedbackDoApp("profissional", 1000);
    expect(Linking.openURL).toHaveBeenCalledWith(linkDoFeedback("profissional"));
    expect(set).toHaveBeenCalledWith("feedback_do_app", JSON.stringify({ em: 1000, enviou: true }));
  });

  it("agora nao: grava e nao abre nada", async () => {
    dialogo.mockResolvedValue(1);
    await pedirFeedbackDoApp("dono", 1000);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith("feedback_do_app", JSON.stringify({ em: 1000, enviou: false }));
  });

  it("dentro do intervalo, nem pergunta", async () => {
    get.mockResolvedValue(JSON.stringify({ em: 1000, enviou: false }));
    await pedirFeedbackDoApp("dono", 2000);
    expect(dialogo).not.toHaveBeenCalled();
  });

  it("registro estragado vale como nunca perguntado", async () => {
    get.mockResolvedValue("{lixo");
    dialogo.mockResolvedValue(1);
    await pedirFeedbackDoApp("dono", 5);
    expect(dialogo).toHaveBeenCalled();
  });

  it("falha no armazenamento nao lanca", async () => {
    get.mockResolvedValue(null);
    dialogo.mockResolvedValue(0);
    set.mockRejectedValue(new Error("sem disco"));
    await expect(pedirFeedbackDoApp("dono", 5)).resolves.toBeUndefined();
  });
});
