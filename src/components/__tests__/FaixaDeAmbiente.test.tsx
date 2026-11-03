import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { FaixaDeAmbiente } from "../FaixaDeAmbiente";
import { CANAL_PARA_ENV, resolveApiEnv } from "@lib/apiEnv";

const mockUpdates: { channel: string | null } = { channel: "preview" };
jest.mock("expo-updates", () => ({
  get channel() {
    return mockUpdates.channel;
  },
}));

// fraquezas F20: build de teste mostra a faixa; a producao nunca aponta para o staging.
describe("FaixaDeAmbiente", () => {
  it.each(["preview", "development", null])("canal %s: mostra a faixa", (canal) => {
    mockUpdates.channel = canal;
    const { getByTestId } = renderWithProvider(<FaixaDeAmbiente />);
    expect(getByTestId("faixa-de-ambiente")).toHaveTextContent("AMBIENTE DE TESTE");
  });

  it("canal production: nao mostra", () => {
    mockUpdates.channel = "production";
    const { queryByTestId } = renderWithProvider(<FaixaDeAmbiente />);
    expect(queryByTestId("faixa-de-ambiente")).toBeNull();
  });
});

describe("a producao nunca aponta para o staging", () => {
  it("so o canal production vira prod, e ele vira prod com qualquer .env", () => {
    expect(Object.entries(CANAL_PARA_ENV).filter(([, e]) => e === "prod").map(([c]) => c)).toEqual(["production"]);
    for (const env of ["local", "dev", "staging", "prod", undefined]) {
      expect(resolveApiEnv("production", env)).toBe("prod");
    }
  });

  it("os canais de teste nunca viram prod", () => {
    expect(resolveApiEnv("preview", "prod")).toBe("staging");
    expect(resolveApiEnv("development", "prod")).toBe("staging");
  });
});
