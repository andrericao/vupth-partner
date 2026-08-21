import * as SecureStore from "expo-secure-store";
import { isMealNudgeDisabled, setMealNudgeDisabled } from "../mealNudge";

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
