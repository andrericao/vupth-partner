import * as SecureStore from "expo-secure-store";
import { isMealNudgeDisabled, setMealNudgeDisabled, devePerguntarRefeicao } from "../mealNudge";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const store = SecureStore as jest.Mocked<typeof SecureStore>;

describe("mealNudge", () => {
  beforeEach(() => jest.clearAllMocks());

  it("por padrao o popup esta LIGADO (nada gravado)", async () => {
    store.getItemAsync.mockResolvedValue(null);
    await expect(isMealNudgeDisabled()).resolves.toBe(false);
  });

  it("desligado quando a flag esta gravada", async () => {
    store.getItemAsync.mockResolvedValue("1");
    await expect(isMealNudgeDisabled()).resolves.toBe(true);
  });

  it("valor estranho no storage não desliga", async () => {
    store.getItemAsync.mockResolvedValue("sim");
    await expect(isMealNudgeDisabled()).resolves.toBe(false);
  });

  it("desligar grava a flag", async () => {
    await setMealNudgeDisabled(true);
    expect(store.setItemAsync).toHaveBeenCalledWith("meal_nudge_disabled", "1");
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("religar apaga a flag (reversivel)", async () => {
    await setMealNudgeDisabled(false);
    expect(store.deleteItemAsync).toHaveBeenCalledWith("meal_nudge_disabled");
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });
});

// 🔴 Andre, 25/09 ("erro grotesco"): loja fechada, profissional Fora e fila
// fechada — e o app perguntou se ele ia jantar. O popup so olhava o relogio.
// Refeicao e pausa DO TRABALHO: so faz sentido perguntar a quem esta
// trabalhando, numa loja aberta.
describe("devePerguntarRefeicao", () => {
  const aberta = { open_status: "OPEN", is_open: true };

  it("trabalhando com a loja aberta: pergunta", () => {
    expect(devePerguntarRefeicao("WORKING", aberta)).toBe(true);
  });

  it("Fora ou em intervalo: nao pergunta", () => {
    expect(devePerguntarRefeicao("OFF", aberta)).toBe(false);
    expect(devePerguntarRefeicao("ON_BREAK", aberta)).toBe(false);
  });

  it("loja fechada: nao pergunta, mesmo marcado como trabalhando", () => {
    expect(devePerguntarRefeicao("WORKING", { open_status: "CLOSED" })).toBe(false);
    // OPEN pelo status mas fechada de fato (fora do horario): vale o is_open
    expect(devePerguntarRefeicao("WORKING", { open_status: "OPEN", is_open: false })).toBe(false);
  });

  it("sem status ou sem a fila carregada: nao pergunta (na duvida, silencio)", () => {
    expect(devePerguntarRefeicao(undefined, aberta)).toBe(false);
    expect(devePerguntarRefeicao("WORKING", undefined)).toBe(false);
  });

  it("backend antigo sem is_open: vale o open_status", () => {
    expect(devePerguntarRefeicao("WORKING", { open_status: "OPEN" })).toBe(true);
  });
});
