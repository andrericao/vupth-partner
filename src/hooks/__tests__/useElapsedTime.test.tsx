import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { useElapsedTime, segundosDecorridos } from "../useElapsedTime";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const MIN = 60_000;
const INICIO = Date.parse("2026-09-17T10:00:00Z");

// A4: pausado, o cronometro tem de PARAR — e, ao retomar, seguir de onde
// parou. Ele contava "agora − inicio", entao o tempo da pausa entrava na conta
// e o numero pulava na primeira renderizacao depois de retomar.
describe("segundosDecorridos", () => {
  it("desconta o tempo pausado", () => {
    expect(segundosDecorridos(INICIO, INICIO + 10 * MIN, 3 * MIN)).toBe(7 * 60);
  });
  it("nunca fica negativo", () => {
    expect(segundosDecorridos(INICIO, INICIO + MIN, 5 * MIN)).toBe(0);
  });
  it("sem pausa, e o tempo de relogio", () => {
    expect(segundosDecorridos(INICIO, INICIO + 90_000, 0)).toBe(90);
  });
});

function Tela({ pausado, pausadoMinutos }: { pausado: boolean; pausadoMinutos?: number }) {
  const { formatted } = useElapsedTime("a1", new Date(INICIO).toISOString(), pausado, pausadoMinutos);
  return <Text testID="cron">{formatted}</Text>;
}

describe("useElapsedTime", () => {
  const agora = jest.spyOn(Date, "now");
  afterEach(() => agora.mockReset());

  it("conta desde o inicio quando nao ha pausa", async () => {
    agora.mockReturnValue(INICIO + 2 * MIN);
    const { getByTestId } = render(<Tela pausado={false} />);
    await waitFor(() => expect(getByTestId("cron")).toHaveTextContent("02:00"));
  });

  it("pausado, o numero NAO anda — nem quando a tela re-renderiza", async () => {
    agora.mockReturnValue(INICIO + 5 * MIN);
    const view = render(<Tela pausado={false} />);
    await waitFor(() => expect(view.getByTestId("cron")).toHaveTextContent("05:00"));

    // pausa e o relogio anda 3 minutos
    await act(async () => {
      view.rerender(<Tela pausado />);
    });
    agora.mockReturnValue(INICIO + 8 * MIN);
    await act(async () => {
      view.rerender(<Tela pausado />);
    });
    expect(view.getByTestId("cron")).toHaveTextContent("05:00");
  });

  it("retomado, segue de onde parou — a pausa nao entra na conta", async () => {
    agora.mockReturnValue(INICIO + 5 * MIN);
    const view = render(<Tela pausado={false} />);
    await waitFor(() => expect(view.getByTestId("cron")).toHaveTextContent("05:00"));

    await act(async () => {
      view.rerender(<Tela pausado />);
    });
    agora.mockReturnValue(INICIO + 8 * MIN); // 3 min pausado
    await act(async () => {
      view.rerender(<Tela pausado={false} />);
    });
    expect(view.getByTestId("cron")).toHaveTextContent("05:00"); // a pausa nao entrou

    agora.mockReturnValue(INICIO + 9 * MIN); // +1 min atendendo
    // o proprio intervalo de 1s do hook atualiza o numero
    await waitFor(() => expect(view.getByTestId("cron")).toHaveTextContent("06:00"), {
      timeout: 2000,
    });
  });

  // Reabrir o app perde o acumulado local; o backend manda o total em minutos
  // (pausedTimeMinutes) e ele vira o piso.
  it("usa o pausado do backend quando ele e maior que o medido aqui", async () => {
    agora.mockReturnValue(INICIO + 10 * MIN);
    const { getByTestId } = render(<Tela pausado={false} pausadoMinutos={4} />);
    await waitFor(() => expect(getByTestId("cron")).toHaveTextContent("06:00"));
  });
});
