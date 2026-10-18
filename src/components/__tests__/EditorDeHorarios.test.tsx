import { Alert, Text } from "react-native";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { EditorDeHorarios, type ChamadasDeHorario } from "../EditorDeHorarios";
import { DIAS, type HorariosDaLoja } from "@lib/horarioSemanal";

const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));

const SEMANA: HorariosDaLoja = {
  configured: false,
  weekly: DIAS.map((d) => ({ day: d.day, closed: d.day === "SUNDAY", opens: "09:00", closes: "18:00" })),
  exceptions: [],
  upcoming: [{ date: "2026-10-06", day: "TUESDAY", exception: false, closed: false, opens: "09:00", closes: "18:00" }],
};

// Ja cadastrada: a semana abre preenchida (sem cadastro, abre vazia para digitar).
const CADASTRADA: HorariosDaLoja = { ...SEMANA, configured: true };

function chamadas(over: Partial<ChamadasDeHorario> = {}): ChamadasDeHorario {
  return {
    buscar: jest.fn(async () => SEMANA),
    salvarSemana: jest.fn(async () => CADASTRADA),
    salvarData: jest.fn(async () => SEMANA),
    removerData: jest.fn(async () => undefined),
    ...over,
  };
}

const textos = {
  semRota: <Text>sem a rota</Text>,
  avisoSemCadastro: "ainda nao montou",
  textoDaSemana: "vale para todas as semanas",
  mensagemSemanaSalva: "agenda salva",
};

// O editor da semana + datas especiais, comum ao horario da loja e a
// agenda-do-profissional (05/10).
describe("EditorDeHorarios", () => {
  it("le a semana, avisa que nao ha cadastro e mostra os proximos dias", async () => {
    render(<EditorDeHorarios chave="p1" chamadas={chamadas()} {...textos} />);
    expect(await screen.findByText("ainda nao montou")).toBeTruthy();
    expect(screen.getByText("Segunda")).toBeTruthy();
    expect(screen.getByText("Próximos dias")).toBeTruthy();
  });

  it("o botão que copia o primeiro dia aberto diz 'Repetir segunda' (guia de texto: 2 palavras)", async () => {
    render(<EditorDeHorarios chave="p1" chamadas={chamadas({ buscar: jest.fn(async () => CADASTRADA) })} {...textos} />);
    expect(await screen.findByText("Repetir segunda")).toBeTruthy();
    expect(screen.queryByText(/nos dias abertos/)).toBeNull();
  });

  it("salvar a semana chama o salvarSemana com os 7 dias e avisa", async () => {
    const c = chamadas({ buscar: jest.fn(async () => CADASTRADA) });
    render(<EditorDeHorarios chave="p1" chamadas={c} {...textos} />);
    fireEvent.press(await screen.findByText("Salvar semana"));
    await waitFor(() => expect(c.salvarSemana).toHaveBeenCalled());
    expect((c.salvarSemana as jest.Mock).mock.calls[0][0]).toHaveLength(7);
    await waitFor(() =>
      expect(mockAvisar).toHaveBeenCalledWith({ titulo: "Horário salvo", mensagem: "agenda salva" })
    );
  });

  it("o erro do servidor vira alerta com a mensagem do codigo", async () => {
    const alerta = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const c = chamadas({
      buscar: jest.fn(async () => CADASTRADA),
      salvarSemana: jest.fn(async () => {
        throw { response: { status: 422, data: { code: "PROFESSIONAL_HOURS_OUTSIDE_ESTABLISHMENT" } } };
      }),
    });
    render(<EditorDeHorarios chave="p1" chamadas={c} {...textos} />);
    fireEvent.press(await screen.findByText("Salvar semana"));
    await waitFor(() =>
      expect(alerta).toHaveBeenCalledWith(
        "Erro",
        "Esse horário passa do horário da loja. A sua agenda tem de caber nele."
      )
    );
    alerta.mockRestore();
  });

  it("backend sem a rota mostra o semRota", async () => {
    render(<EditorDeHorarios chave="p1" chamadas={chamadas({ buscar: async () => null })} {...textos} />);
    expect(await screen.findByText("sem a rota")).toBeTruthy();
  });

  it("erro ao ler: Tentar de novo le outra vez", async () => {
    const buscar = jest.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(SEMANA);
    render(<EditorDeHorarios chave="p1" chamadas={chamadas({ buscar })} {...textos} />);
    fireEvent.press(await screen.findByText("Tentar de novo"));
    expect(await screen.findByText("Segunda")).toBeTruthy();
    expect(buscar).toHaveBeenCalledTimes(2);
  });
});

describe("EditorDeHorarios sem cadastro", () => {
  it("abre com a semana que o semanaSemCadastro der", async () => {
    const semanaSemCadastro = jest.fn(() => SEMANA.weekly);
    render(
      <EditorDeHorarios chave="p1" chamadas={chamadas()} semanaSemCadastro={semanaSemCadastro} {...textos} />
    );
    expect(await screen.findByText("Segunda")).toBeTruthy();
    expect(semanaSemCadastro).toHaveBeenCalled();
    expect(screen.getAllByDisplayValue("09:00").length).toBeGreaterThan(0);
  });
});
