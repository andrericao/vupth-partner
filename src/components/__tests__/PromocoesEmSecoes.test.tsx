import { render, fireEvent, waitFor, within } from "@testing-library/react-native";
import { PromocoesEmSecoes } from "@components/PromocoesEmSecoes";

jest.mock("@lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (_e: any, fallback: string) => fallback,
  API_ENV: "staging",
}));

// promocoes-em-secoes (Andre, 05/11) e, herdados do LinkDeIndicacao: link-de-indicacao
// (DEC-70), compartilhe-e-ganhe (DEC-113), participar-da-promocao e DEC-124.
jest.setTimeout(20000);

const MEU = { code: "ABC234", link: "https://vupth.pages.dev/i/ABC234", referred_clients: 1 };
const ABERTA = { id: "c1", name: "Indique e ganhe", type: "REFERRAL_BONUS", value_amount: 5 };
const LINK_C1 = { campaign_id: "c1", name: "Indique e ganhe", link: "https://x/i/ABC?c=c1", referred: 0, credited: 0 };
const NO_AR_CUPOM = { id: "d1", name: "Dez por cento", type: "DISCOUNT", value_percent: 10, code: "DEZ10" };
const nada = () => jest.fn().mockResolvedValue([]);

type P = Parameters<typeof PromocoesEmSecoes>[0];
const montar = (p: P = {}) =>
  render(
    <PromocoesEmSecoes
      carregar={jest.fn().mockResolvedValue(MEU)}
      listarNoAr={nada()}
      listarCupons={nada()}
      participar={jest.fn()}
      usar={jest.fn()}
      compartilhar={jest.fn().mockResolvedValue(undefined)}
      {...p}
    />
  );

describe("PromocoesEmSecoes", () => {
  // o primeiro render a frio carrega o NwButton, o card e o css-interop (ci-teste-linkdeindicacao-timeout)
  beforeAll(async () => {
    const r = montar();
    await r.findByTestId("link-indicacao-link", {}, { timeout: 20000 });
    r.unmount();
  }, 30000);

  describe("sem campanha de link: o cartao SEU LINK", () => {
    it("mostra o link, quantos chegaram e o a receber", async () => {
      const r = montar({ carregar: jest.fn().mockResolvedValue({ ...MEU, credited_clients: 1, to_receive: 5 }) });
      expect((await r.findByTestId("link-indicacao-link")).props.children).toBe(MEU.link);
      expect(r.getByText("SEU LINK")).toBeTruthy();
      expect(r.getByTestId("link-indicacao-clientes").props.children).toBe("1 cliente chegou pelo seu link.");
      expect(r.getByTestId("link-indicacao-receber").props.children).toBe("1 concluiu o corte · R$ 5,00 a receber");
    });

    it("Compartilhar manda o link", async () => {
      const compartilhar = jest.fn().mockResolvedValue(undefined);
      const r = montar({ compartilhar });
      fireEvent.press(await r.findByTestId("link-indicacao-compartilhar"));
      expect(compartilhar).toHaveBeenCalledWith(MEU.link, expect.objectContaining({ titulo: "Vupth" }));
    });

    it("sem /referrals/me nao ha cartao do link, mas os cupons aparecem", async () => {
      const r = montar({
        carregar: jest.fn().mockRejectedValue(new Error("403")),
        listarCupons: jest.fn().mockResolvedValue([{ ...NO_AR_CUPOM, status: "ACTIVE" }]),
      });
      expect(await r.findByTestId("promocoes-ativas")).toBeTruthy();
      expect(r.queryByTestId("link-indicacao-geral")).toBeNull();
    });
  });

  describe("as tres secoes", () => {
    it("Ativas: o cartao da campanha traz o link, os numeros dela e o dinheiro, num bloco so", async () => {
      const r = montar({
        carregar: jest.fn().mockResolvedValue({
          ...MEU,
          campaigns: [{ ...LINK_C1, referred: 1, credited: 1 }],
          to_receive: 5,
          pending_release: 5,
        }),
        listarNoAr: jest.fn().mockResolvedValue([ABERTA]),
      });
      const ativas = await r.findByTestId("promocoes-ativas");
      const cartao = within(ativas).getByTestId("link-indicacao-campanha");
      expect(within(cartao).getByText("1 chegou · 1 concluiu o corte")).toBeTruthy();
      expect(within(cartao).getByTestId("link-indicacao-receber").props.children).toBe("R$ 5,00 a receber");
      expect(within(cartao).getByTestId("link-indicacao-liberar").props.children).toBe("R$ 5,00 a liberar pelo VUPTH");
      // os numeros batem: nada de "1 cliente chegou pelo seu link" fora do cartao
      expect(r.queryByTestId("link-indicacao-clientes")).toBeNull();
      expect(r.queryByText("SEU LINK")).toBeNull();
      expect(r.queryByTestId("promocoes-disponiveis")).toBeNull();
    });

    it("com duas campanhas ativas, cada uma com o seu Compartilhar e o dinheiro num total embaixo", async () => {
      const compartilhar = jest.fn().mockResolvedValue(undefined);
      const r = montar({
        compartilhar,
        carregar: jest.fn().mockResolvedValue({
          ...MEU,
          campaigns: [LINK_C1, { ...LINK_C1, campaign_id: "c2", name: "Segunda", link: "https://x/i/ABC?c=c2" }],
          to_receive: 10,
        }),
      });
      await r.findByTestId("link-indicacao-link-c1");
      const cartoes = r.getAllByTestId("link-indicacao-campanha");
      expect(cartoes).toHaveLength(2);
      expect(within(cartoes[0]).queryByTestId("link-indicacao-receber")).toBeNull();
      expect(r.getByTestId("link-indicacao-receber").props.children).toBe("R$ 10,00 a receber");
      fireEvent.press(r.getAllByTestId("link-indicacao-campanha-compartilhar")[1]);
      expect(compartilhar).toHaveBeenCalledWith("https://x/i/ABC?c=c2", expect.objectContaining({ titulo: "Vupth" }));
    });

    it("Passadas: o cupom vencido em 28/10 e a campanha de link vencida, so para consulta", async () => {
      const r = montar({
        carregar: jest.fn().mockResolvedValue({
          ...MEU,
          campaigns: [{ ...LINK_C1, ends_at: "2026-10-28T23:59:00-03:00" }],
        }),
        listarCupons: jest.fn().mockResolvedValue([
          { ...NO_AR_CUPOM, id: "v", status: "ACTIVE", ends_at: "2026-10-28T23:59:00-03:00" },
          { ...NO_AR_CUPOM, id: "u", status: "USED" },
        ]),
      });
      const passadas = await r.findByTestId("promocoes-passadas");
      expect(within(passadas).getByTestId("link-indicacao-passada-estado")).toBeTruthy();
      expect(within(passadas).getAllByTestId("cupom-passado")).toHaveLength(2);
      expect(r.queryByTestId("promocoes-ativas")).toBeNull();
      // tocar no vencido abre Promocao encerrada
      fireEvent.press(within(passadas).getAllByTestId("cupom-passado")[0]);
      expect(r.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção encerrada");
    });
  });

  describe("Disponiveis: Participar (link)", () => {
    it("tocar no card abre a explicacao; Participar entra, recarrega e o cartao vai para Ativas", async () => {
      const carregar = jest
        .fn()
        .mockResolvedValueOnce(MEU)
        .mockResolvedValue({ ...MEU, campaigns: [LINK_C1], pending_release: 5 });
      const participar = jest.fn().mockResolvedValue(undefined);
      const aoMudar = jest.fn();
      const r = montar({
        carregar,
        participar,
        aoMudar,
        listarNoAr: jest.fn().mockResolvedValue([{ ...ABERTA, description: "R$ 5 por cliente que cortar." }]),
      });
      const card = await r.findByTestId("link-indicacao-aberta");
      expect(r.queryByTestId("link-indicacao-participar")).toBeNull();
      fireEvent.press(card);
      expect(r.getByText("R$ 5 por cliente que cortar.")).toBeTruthy();
      expect(r.getByText("Vale todos os dias, para qualquer serviço.")).toBeTruthy();
      fireEvent.press(r.getByTestId("link-indicacao-participar"));
      expect(participar).toHaveBeenCalledWith("c1");
      expect(await r.findByTestId("link-indicacao-campanha")).toBeTruthy();
      expect(r.queryByTestId("link-indicacao-aberta")).toBeNull();
      expect(aoMudar).toHaveBeenCalled();
    });

    it("tocar de novo recolhe a explicacao", async () => {
      const r = montar({ listarNoAr: jest.fn().mockResolvedValue([ABERTA]) });
      const card = await r.findByTestId("link-indicacao-aberta");
      fireEvent.press(card);
      expect(r.getByTestId("link-indicacao-explicacao")).toBeTruthy();
      fireEvent.press(card);
      expect(r.queryByTestId("link-indicacao-explicacao")).toBeNull();
    });

    it("adesao recusada mostra a frase e continua oferecendo", async () => {
      const participar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_NOT_FOR_YOU" } } });
      const r = montar({ participar, listarNoAr: jest.fn().mockResolvedValue([ABERTA]) });
      fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
      fireEvent.press(r.getByTestId("link-indicacao-participar"));
      expect((await r.findByTestId("link-indicacao-erro")).props.children).toBe("Esta campanha não é para o seu perfil.");
      expect(r.getByTestId("link-indicacao-participar")).toBeTruthy();
    });

    it("esgotada abre o modal sem chamar o Backend; CAMPAIGN_SOLD_OUT tambem", async () => {
      const participar = jest.fn();
      const r = montar({ participar, listarNoAr: jest.fn().mockResolvedValue([{ ...ABERTA, remaining_slots: 0 }]) });
      fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
      fireEvent.press(r.getByTestId("link-indicacao-participar"));
      expect(r.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção esgotada");
      expect(participar).not.toHaveBeenCalled();
      r.unmount();

      const recusa = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_SOLD_OUT" } } });
      const r2 = montar({ participar: recusa, listarNoAr: jest.fn().mockResolvedValue([ABERTA]) });
      fireEvent.press(await r2.findByTestId("link-indicacao-aberta"));
      fireEvent.press(r2.getByTestId("link-indicacao-participar"));
      expect((await r2.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção esgotada");
      expect(r2.queryByTestId("link-indicacao-erro")).toBeNull();
    });
  });

  describe("Disponiveis: Ativar (cupom)", () => {
    it("ativar chama o Backend com o codigo e o cupom vai para Ativas", async () => {
      const usar = jest.fn().mockResolvedValue({ ...NO_AR_CUPOM, status: "ACTIVE" });
      const aoMudar = jest.fn();
      const r = montar({ usar, aoMudar, listarNoAr: jest.fn().mockResolvedValue([NO_AR_CUPOM]) });
      expect((await r.findByTestId("cupom-ativavel-card-codigo")).props.children).toBe("Código: DEZ10");
      fireEvent.press(r.getByTestId("cupom-ativar-d1"));
      await waitFor(() => expect(usar).toHaveBeenCalledWith("DEZ10"));
      expect(await r.findByTestId("cupom-campanha")).toBeTruthy();
      expect(r.queryByTestId("cupom-ativavel")).toBeNull();
      expect(aoMudar).toHaveBeenCalled();
    });

    it("recusa: a frase do Backend embaixo do ticket; encerrada: o modal", async () => {
      const usar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_NOT_FOR_YOU" } } });
      const r = montar({ usar, listarNoAr: jest.fn().mockResolvedValue([NO_AR_CUPOM]) });
      fireEvent.press(await r.findByTestId("cupom-ativar-d1"));
      expect((await r.findByTestId("cupom-ativar-erro-d1")).props.children).toBe("Este cupom não é para o seu perfil.");
      r.unmount();

      const fim = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_ENDED" } } });
      const r2 = montar({ usar: fim, listarNoAr: jest.fn().mockResolvedValue([NO_AR_CUPOM]) });
      fireEvent.press(await r2.findByTestId("cupom-ativar-d1"));
      expect((await r2.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção encerrada");
    });
  });

  it("a versao nova (cupom ativado no campo) recarrega as secoes", async () => {
    const listarCupons = jest.fn().mockResolvedValue([]);
    const r = montar({ listarCupons });
    await waitFor(() => expect(listarCupons).toHaveBeenCalledTimes(1));
    r.rerender(
      <PromocoesEmSecoes
        carregar={jest.fn().mockResolvedValue(MEU)}
        listarNoAr={nada()}
        listarCupons={listarCupons}
        versao={1}
      />
    );
    await waitFor(() => expect(listarCupons).toHaveBeenCalledTimes(2));
  });
});
