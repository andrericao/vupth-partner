import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AbrirAgenda } from "../AbrirAgenda";
import type { DiaDaAgenda } from "@lib/agendaAberta";

const dia = (date: string, extra: Partial<DiaDaAgenda> = {}): DiaDaAgenda => ({
  date, closed: false, opens: "09:00:00", closes: "18:00:00", storeOpen: true, openedByMe: false, ...extra,
});
const hoje = new Date(2026, 10, 1);

describe("AbrirAgenda", () => {
  it("marca dias, abre so os marcados e recarrega", async () => {
    const dias = [dia("2026-11-02"), dia("2026-11-03"), dia("2026-11-04", { openedByMe: true }), dia("2026-11-05", { storeOpen: false })];
    const buscar = jest.fn().mockResolvedValue(dias);
    const abrir = jest.fn().mockResolvedValue(undefined);
    render(<AbrirAgenda hoje={hoje} buscar={buscar} abrir={abrir} repetir={jest.fn()} />);
    fireEvent.press(await screen.findByTestId("agenda-dot-2026-11-02"));
    fireEvent.press(screen.getByTestId("agenda-dot-2026-11-04")); // ja aberto: nao marca
    fireEvent.press(screen.getByTestId("agenda-dot-2026-11-05")); // loja fechada: nao marca
    fireEvent.press(screen.getByText("Abrir 1 dia"));
    await waitFor(() => expect(abrir).toHaveBeenCalledWith([dias[0]]));
    expect(await screen.findByText("Dias abertos.")).toBeTruthy();
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("repete a agenda padrao para a janela toda", async () => {
    const repetir = jest.fn().mockResolvedValue(undefined);
    render(<AbrirAgenda hoje={hoje} buscar={jest.fn().mockResolvedValue([dia("2026-11-02")])} abrir={jest.fn()} repetir={repetir} />);
    fireEvent.press(await screen.findByText("Repetir a minha agenda padrão"));
    await waitFor(() => expect(repetir).toHaveBeenCalledWith("2026-11-01", "2026-12-01"));
    expect(await screen.findByText("Agenda padrão aberta para o mês.")).toBeTruthy();
  });

  it("tudo ou nada: se a API recusar, mostra o erro e nao marca como aberto", async () => {
    const abrir = jest.fn().mockRejectedValue({ response: { status: 400, data: {} } });
    render(<AbrirAgenda hoje={hoje} buscar={jest.fn().mockResolvedValue([dia("2026-11-02")])} abrir={abrir} repetir={jest.fn()} />);
    fireEvent.press(await screen.findByTestId("agenda-dot-2026-11-02"));
    fireEvent.press(screen.getByText("Abrir 1 dia"));
    expect(await screen.findByText(/Não foi possível abrir a agenda/)).toBeTruthy();
  });

  it("falha ao carregar avisa", async () => {
    render(<AbrirAgenda hoje={hoje} buscar={jest.fn().mockRejectedValue(new Error("x"))} abrir={jest.fn()} repetir={jest.fn()} />);
    expect(await screen.findByText("Não foi possível carregar a sua agenda.")).toBeTruthy();
  });
});
