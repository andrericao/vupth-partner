import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Cupom } from "@components/Cupom";

jest.mock("@lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (_e: any, fallback: string) => fallback,
}));

// cupom-no-app (DEC-61, DEC-63): campo, "Ativar" e os cupons ja ativados.
// O primeiro render a frio passa de 5 s com a maquina carregada (pre-push de 23/10).
jest.setTimeout(20000);
const CAMPANHA = { id: "c1", name: "Lançamento", type: "FEE_WAIVER", ends_at: "2026-11-30T12:00:00-03:00" };

describe("Cupom", () => {
  it("lista os cupons ja usados", async () => {
    const { findByText } = render(
      <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([CAMPANHA])} />
    );
    expect(await findByText("Lançamento")).toBeTruthy();
    expect(await findByText("Sem taxa · até 30/11")).toBeTruthy();
  });

  it("cupom usado ou vencido leva o rotulo", async () => {
    const { findByText } = render(
      <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([{ ...CAMPANHA, status: "EXPIRED" }])} />,
    );
    expect(await findByText("Sem taxa · até 30/11 · vencido")).toBeTruthy();
  });

  it("vazio: pede o cupom e nao chama a API", async () => {
    const usar = jest.fn();
    const { getByTestId, findByText } = render(<Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Digite o cupom.")).toBeTruthy();
    expect(usar).not.toHaveBeenCalled();
  });

  it("usou: o cupom entra na lista e o campo limpa", async () => {
    const usar = jest.fn().mockResolvedValue(CAMPANHA);
    const { getByTestId, findByText } = render(<Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(getByTestId("cupom-codigo"), "vupth10");
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Lançamento")).toBeTruthy();
    expect(usar).toHaveBeenCalledWith("vupth10");
    await waitFor(() => expect(getByTestId("cupom-codigo").props.value).toBe(""));
  });

  it("recusado: a frase curta no campo", async () => {
    const usar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_ALREADY_REDEEMED" } } });
    const { getByTestId, findByText } = render(
      <Cupom usar={usar} listar={jest.fn().mockRejectedValue(new Error("x"))} />
    );
    fireEvent.changeText(getByTestId("cupom-codigo"), "VUPTH10");
    fireEvent.press(getByTestId("cupom-usar"));
    expect(await findByText("Este cupom já está ativado.")).toBeTruthy();
  });

  // promocoes-ativar-e-codigo (Andre, 24/10).
  it("o botao diz Ativar, o aviso diz Cupom ativado e o ticket mostra o codigo", async () => {
    const nova = { ...CAMPANHA, id: "c3", code: "VUPTH10", ends_at: undefined };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(nova)} listar={jest.fn().mockResolvedValue([])} />);
    expect(r.getByText("Ativar")).toBeTruthy();
    expect(r.queryByText("Usar")).toBeNull();
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "vupth10");
    fireEvent.press(r.getByTestId("cupom-usar"));
    expect((await r.findByTestId("cupom-ativado")).props.children).toBe("Cupom ativado");
    expect((await r.findByTestId("cupom-campanha-codigo")).props.children).toBe("Código: VUPTH10");
  });

  // DEC-124: ao ativar, a validade (hora do Painel) e o Saiba mais.
  it("ao ativar, mostra ate quando vale e o Saiba mais traz dias e regras", async () => {
    const nova = {
      ...CAMPANHA,
      id: "c2",
      ends_at: "2026-11-17T21:30:00-03:00",
      weekdays: "TUESDAY,WEDNESDAY,THURSDAY",
      description: "R$ 5 de desconto no primeiro corte.",
    };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(nova)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "lancamento");
    fireEvent.press(r.getByTestId("cupom-usar"));
    expect(await r.findByText("Válido até 17/11 às 21:30")).toBeTruthy();
    expect(r.getByText("Se não usar até lá, perde o cupom.")).toBeTruthy();
    fireEvent.press(r.getByTestId("cupom-saiba-mais-abrir"));
    expect(r.getByText("Vale terças, quartas e quintas, para qualquer serviço.")).toBeTruthy();
    expect(r.getByText("R$ 5 de desconto no primeiro corte.")).toBeTruthy();
  });

  it("campanha sem fim nao mostra o aviso de validade", async () => {
    const sem = { id: "c3", name: "Aberta", type: "DISCOUNT" };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(sem)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "aberta");
    fireEvent.press(r.getByTestId("cupom-usar"));
    await r.findAllByText("Aberta");
    expect(r.queryByTestId("cupom-validade")).toBeNull();
  });

  // DEC-124: encerrada e esgotada, no cupom.
  it("cupom ativado fora do prazo abre Promocao encerrada; sem vaga, esgotada", async () => {
    const vencida = { ...CAMPANHA, id: "v", ends_at: "2020-01-01T00:00:00-03:00" };
    const r = render(<Cupom usar={jest.fn().mockResolvedValue(vencida)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "velho");
    fireEvent.press(r.getByTestId("cupom-usar"));
    expect((await r.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção encerrada");
    fireEvent.press(r.getByTestId("promocao-modal-fechar"));
    r.unmount();

    const cheia = { ...CAMPANHA, id: "e", ends_at: "2999-01-01T00:00:00-03:00", remaining_slots: 0 };
    const r2 = render(<Cupom usar={jest.fn().mockResolvedValue(cheia)} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r2.getByTestId("cupom-codigo"), "cheio");
    fireEvent.press(r2.getByTestId("cupom-usar"));
    expect((await r2.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção esgotada");
  });

  it("tocar no cupom vencido que a pessoa ativou e nao usou abre Promocao encerrada", async () => {
    const r = render(
      <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([{ ...CAMPANHA, status: "EXPIRED" }])} />
    );
    fireEvent.press(await r.findByTestId("cupom-campanha"));
    expect(r.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção encerrada");
  });

  it("o Backend recusa com CAMPAIGN_ENDED ou CAMPAIGN_SOLD_OUT: abre o modal, sem erro no campo", async () => {
    const recusa = (code: string) => jest.fn().mockRejectedValue({ response: { data: { code } } });
    const r = render(<Cupom usar={recusa("CAMPAIGN_ENDED")} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r.getByTestId("cupom-codigo"), "velho");
    fireEvent.press(r.getByTestId("cupom-usar"));
    expect((await r.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção encerrada");
    r.unmount();
    const r2 = render(<Cupom usar={recusa("CAMPAIGN_SOLD_OUT")} listar={jest.fn().mockResolvedValue([])} />);
    fireEvent.changeText(r2.getByTestId("cupom-codigo"), "cheio");
    fireEvent.press(r2.getByTestId("cupom-usar"));
    expect((await r2.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção esgotada");
  });

  // promocoes-ticket-do-profissional-como-cliente (Andre, 25/10).
  describe("ticket do profissional como cliente", () => {
    const NO_AR = { id: "d1", name: "Dez por cento", type: "DISCOUNT", value_percent: 10, code: "DEZ10" };

    it("mostra o ticket da campanha no ar com o codigo e o Ativar; ativar chama o Backend com o codigo e move para os ativados", async () => {
      const usar = jest.fn().mockResolvedValue({ ...NO_AR, status: "ACTIVE" });
      const r = render(
        <Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} disponiveis={jest.fn().mockResolvedValue([NO_AR])} />
      );
      expect((await r.findByTestId("cupom-ativavel-card-codigo")).props.children).toBe("Código: DEZ10");
      fireEvent.press(r.getByTestId("cupom-ativar-d1"));
      await waitFor(() => expect(usar).toHaveBeenCalledWith("DEZ10"));
      await waitFor(() => expect(r.queryByTestId("cupom-ativavel")).toBeNull());
      expect((await r.findByTestId("cupom-ativado")).props.children).toBe("Cupom ativado");
      expect(r.getByTestId("cupom-campanha")).toBeTruthy();
    });

    it("o Backend recusa (nao cumpre os requisitos): mostra a frase que ele devolve e o ticket fica", async () => {
      const usar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_NOT_FOR_YOU" } } });
      const r = render(
        <Cupom usar={usar} listar={jest.fn().mockResolvedValue([])} disponiveis={jest.fn().mockResolvedValue([NO_AR])} />
      );
      fireEvent.press(await r.findByTestId("cupom-ativar-d1"));
      expect((await r.findByTestId("cupom-ativar-erro-d1")).props.children).toBe("Este cupom não é para o seu perfil.");
      expect(r.getByTestId("cupom-ativavel")).toBeTruthy();
    });

    it("nao oferece: campanha de indicacao (tem o cartao dela), sem codigo, ja ativada ou encerrada", async () => {
      const lista = [
        { ...NO_AR, id: "i", type: "REFERRAL_BONUS" },
        { ...NO_AR, id: "s", code: null },
        { ...NO_AR, id: "a" },
        { ...NO_AR, id: "e", ends_at: "2020-01-01T00:00:00-03:00" },
      ];
      const r = render(
        <Cupom
          usar={jest.fn()}
          listar={jest.fn().mockResolvedValue([{ ...NO_AR, id: "a", status: "ACTIVE" }])}
          disponiveis={jest.fn().mockResolvedValue(lista)}
        />
      );
      await r.findByTestId("cupom-campanha");
      expect(r.queryByTestId("cupom-ativavel")).toBeNull();
    });

    it("falha ao listar as campanhas no ar nao derruba a tela", async () => {
      const r = render(
        <Cupom usar={jest.fn()} listar={jest.fn().mockResolvedValue([])} disponiveis={jest.fn().mockRejectedValue(new Error("x"))} />
      );
      expect(r.getByTestId("cupom-usar")).toBeTruthy();
      await waitFor(() => expect(r.queryByTestId("cupom-ativavel")).toBeNull());
    });
  });
});
