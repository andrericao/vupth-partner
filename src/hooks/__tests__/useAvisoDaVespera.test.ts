import { renderHook, waitFor } from "@testing-library/react-native";
import { useAvisoDaVespera } from "../useAvisoDaVespera";

const domingo = () => new Date(2026, 10, 1);

describe("useAvisoDaVespera", () => {
  it("domingo, em modo agenda e sem dia aberto: pergunta e leva a agenda", async () => {
    const perguntar = jest.fn().mockResolvedValue(true);
    const ir = jest.fn();
    renderHook(() => useAvisoDaVespera(true, { agora: domingo, buscar: jest.fn().mockResolvedValue([]), perguntar, ir }));
    await waitFor(() => expect(ir).toHaveBeenCalledWith("/(professional)/agenda"));
    expect(perguntar).toHaveBeenCalledTimes(1);
  });

  it("'Agora nao' nao navega", async () => {
    const perguntar = jest.fn().mockResolvedValue(false);
    const ir = jest.fn();
    renderHook(() => useAvisoDaVespera(true, { agora: domingo, buscar: jest.fn().mockResolvedValue([]), perguntar, ir }));
    await waitFor(() => expect(perguntar).toHaveBeenCalled());
    expect(ir).not.toHaveBeenCalled();
  });

  it("fora do domingo ou fora do modo agenda, nao pergunta", async () => {
    const buscar = jest.fn().mockResolvedValue([]);
    const perguntar = jest.fn();
    renderHook(() => useAvisoDaVespera(true, { agora: () => new Date(2026, 10, 2), buscar, perguntar }));
    renderHook(() => useAvisoDaVespera(false, { agora: domingo, buscar, perguntar }));
    await Promise.resolve();
    expect(buscar).not.toHaveBeenCalled();
    expect(perguntar).not.toHaveBeenCalled();
  });

  it("com dia aberto na semana que vem, nao pergunta", async () => {
    const buscar = jest.fn().mockResolvedValue([
      { date: "2026-11-03", closed: false, opens: "09:00", closes: "18:00", storeOpen: true, openedByMe: true, agendaReleased: true },
    ]);
    const perguntar = jest.fn();
    renderHook(() => useAvisoDaVespera(true, { agora: domingo, buscar, perguntar }));
    await waitFor(() => expect(buscar).toHaveBeenCalled());
    await Promise.resolve();
    expect(perguntar).not.toHaveBeenCalled();
  });
});
