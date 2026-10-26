import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { LinkDeIndicacao } from "@components/LinkDeIndicacao";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// link-de-indicacao (DEC-70): o link, quantos chegaram e o Compartilhar.
const MEU = { code: "ABC234", link: "https://vupth.pages.dev/i/ABC234", referred_clients: 1 };

const SEM_CAMPANHAS = jest.fn().mockResolvedValue([]);
const ABERTA = { id: "c1", name: "Indique e ganhe", type: "REFERRAL_BONUS", value_amount: 5 };

describe("LinkDeIndicacao", () => {
  // ci-teste-linkdeindicacao-timeout (Andre, 24/10): a PRIMEIRA renderizacao do bloco carrega,
  // sob demanda, o NwButton, o card e o css-interop (3 s sem cache, como no CI), e estourava o
  // 1 s do findBy do primeiro teste. O aquecimento paga esse custo uma vez, fora dos testes.
  beforeAll(async () => {
    const r = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} listarCampanhas={SEM_CAMPANHAS} />);
    await r.findByTestId("link-indicacao-link", {}, { timeout: 20000 });
    r.unmount();
  }, 30000);

  it("mostra o link e quantos clientes chegaram", async () => {
    const { findByTestId, getByTestId } = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} listarCampanhas={SEM_CAMPANHAS} />);
    expect((await findByTestId("link-indicacao-link")).props.children).toBe(MEU.link);
    expect(getByTestId("link-indicacao-clientes").props.children).toBe("1 cliente chegou pelo seu link.");
  });

  it("com o a receber, mostra a linha; sem, esconde", async () => {
    const com = { ...MEU, credited_clients: 1, to_receive: 5 };
    const r1 = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(com)} />);
    expect((await r1.findByTestId("link-indicacao-receber")).props.children).toBe(
      "1 concluiu o corte · R$ 5,00 a receber"
    );
    r1.unmount();
    const r2 = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} listarCampanhas={SEM_CAMPANHAS} />);
    await r2.findByTestId("link-indicacao-link");
    expect(r2.queryByTestId("link-indicacao-receber")).toBeNull();
  });

  it("Compartilhar manda o link", async () => {
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const { findByTestId } = render(
      <LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} compartilhar={compartilhar} />
    );
    fireEvent.press(await findByTestId("link-indicacao-compartilhar"));
    expect(compartilhar).toHaveBeenCalledWith(MEU.link, expect.objectContaining({ titulo: "Vupth" }));
  });

  it("sem resposta da API, o bloco nao aparece", async () => {
    const carregar = jest.fn().mockRejectedValue(new Error("403"));
    const { queryByTestId } = render(<LinkDeIndicacao carregar={carregar} />);
    await waitFor(() => expect(carregar).toHaveBeenCalled());
    expect(queryByTestId("link-indicacao")).toBeNull();
  });

  // compartilhe-e-ganhe-no-partner (DEC-113).
  it("campanha aberta: Participar entra e recarrega com o link dela", async () => {
    const com = {
      ...MEU,
      campaigns: [{ campaign_id: "c1", name: "Indique e ganhe", link: "https://x/i/ABC?c=c1", referred: 2, credited: 1 }],
      pending_release: 5,
    };
    const carregar = jest.fn().mockResolvedValueOnce(MEU).mockResolvedValue(com);
    const participar = jest.fn().mockResolvedValue(undefined);
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const r = render(
      <LinkDeIndicacao
        carregar={carregar}
        participar={participar}
        compartilhar={compartilhar}
        listarCampanhas={jest.fn().mockResolvedValue([ABERTA, { ...ABERTA, id: "d", type: "DISCOUNT" }])}
      />
    );
    fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
    fireEvent.press(r.getByTestId("link-indicacao-participar"));
    expect(participar).toHaveBeenCalledWith("c1");
    expect(await r.findByTestId("link-indicacao-campanha")).toBeTruthy();
    expect(r.queryByTestId("link-indicacao-aberta")).toBeNull();
    expect(r.getByTestId("link-indicacao-liberar").props.children).toBe("R$ 5,00 a liberar pelo VUPTH");
    fireEvent.press(r.getByTestId("link-indicacao-campanha-compartilhar"));
    expect(compartilhar).toHaveBeenCalledWith("https://x/i/ABC?c=c1", expect.objectContaining({ titulo: "Vupth" }));
  });

  it("adesao recusada mostra a frase e continua oferecendo", async () => {
    const participar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_NOT_FOR_YOU" } } });
    const r = render(
      <LinkDeIndicacao
        carregar={jest.fn().mockResolvedValue(MEU)}
        participar={participar}
        listarCampanhas={jest.fn().mockResolvedValue([ABERTA])}
      />
    );
    fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
    fireEvent.press(r.getByTestId("link-indicacao-participar"));
    expect((await r.findByTestId("link-indicacao-erro")).props.children).toBe("Esta campanha não é para o seu perfil.");
    expect(r.getByTestId("link-indicacao-participar")).toBeTruthy();
  });

  it("falha ao listar as campanhas nao derruba o link", async () => {
    const listar = jest.fn().mockRejectedValue(new Error("500"));
    const r = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} listarCampanhas={listar} />);
    await r.findByTestId("link-indicacao-link");
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(r.queryByTestId("link-indicacao-aberta")).toBeNull();
  });

  // DEC-124: campanha vencida ou esgotada nao entra; mostra o modal.
  it("Participar numa campanha encerrada ou esgotada abre o modal e nao chama o Backend", async () => {
    const participar = jest.fn();
    const r = render(
      <LinkDeIndicacao
        carregar={jest.fn().mockResolvedValue(MEU)}
        participar={participar}
        listarCampanhas={jest.fn().mockResolvedValue([{ ...ABERTA, ends_at: "2020-01-01T00:00:00-03:00" }])}
      />
    );
    fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
    fireEvent.press(r.getByTestId("link-indicacao-participar"));
    expect(r.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção encerrada");
    r.unmount();

    const r2 = render(
      <LinkDeIndicacao
        carregar={jest.fn().mockResolvedValue(MEU)}
        participar={participar}
        listarCampanhas={jest.fn().mockResolvedValue([{ ...ABERTA, remaining_slots: 0 }])}
      />
    );
    fireEvent.press(await r2.findByTestId("link-indicacao-aberta"));
    fireEvent.press(r2.getByTestId("link-indicacao-participar"));
    expect(r2.getByTestId("promocao-modal-titulo").props.children).toBe("Promoção esgotada");
    expect(participar).not.toHaveBeenCalled();
  });

  it("o Backend recusa a adesao com CAMPAIGN_SOLD_OUT: abre Promocao esgotada", async () => {
    const participar = jest.fn().mockRejectedValue({ response: { data: { code: "CAMPAIGN_SOLD_OUT" } } });
    const r = render(
      <LinkDeIndicacao
        carregar={jest.fn().mockResolvedValue(MEU)}
        participar={participar}
        listarCampanhas={jest.fn().mockResolvedValue([ABERTA])}
      />
    );
    fireEvent.press(await r.findByTestId("link-indicacao-aberta"));
    fireEvent.press(r.getByTestId("link-indicacao-participar"));
    expect((await r.findByTestId("promocao-modal-titulo")).props.children).toBe("Promoção esgotada");
    expect(r.queryByTestId("link-indicacao-erro")).toBeNull();
  });

  // participar-da-promocao (Andre, 24/10): card -> explicacao -> Participar -> Compartilhar link.
  it("tocar no card abre a explicacao; Participar vira Compartilhar link", async () => {
    const com = {
      ...MEU,
      campaigns: [{ campaign_id: "c1", name: "Indique e ganhe", link: "https://x/i/ABC?c=c1", referred: 0, credited: 0 }],
    };
    const carregar = jest.fn().mockResolvedValueOnce(MEU).mockResolvedValue(com);
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const r = render(
      <LinkDeIndicacao
        carregar={carregar}
        compartilhar={compartilhar}
        participar={jest.fn().mockResolvedValue(undefined)}
        listarCampanhas={jest.fn().mockResolvedValue([{ ...ABERTA, description: "R$ 5 por cliente que cortar." }])}
      />
    );
    const card = await r.findByTestId("link-indicacao-aberta");
    expect(r.queryByTestId("link-indicacao-explicacao")).toBeNull();
    expect(r.queryByTestId("link-indicacao-participar")).toBeNull();
    fireEvent.press(card);
    expect(r.getByTestId("link-indicacao-explicacao")).toBeTruthy();
    expect(r.getByText("R$ 5 por cliente que cortar.")).toBeTruthy();
    expect(r.getByText("Vale todos os dias, para qualquer serviço.")).toBeTruthy();
    fireEvent.press(r.getByTestId("link-indicacao-participar"));
    const compartilharLink = await r.findByTestId("link-indicacao-campanha-compartilhar");
    expect(compartilharLink.props.accessibilityLabel ?? "").toBeDefined();
    fireEvent.press(compartilharLink);
    expect(compartilhar).toHaveBeenCalledWith("https://x/i/ABC?c=c1", expect.objectContaining({ titulo: "Vupth" }));
    expect(r.queryByTestId("link-indicacao-aberta")).toBeNull();
  });

  it("tocar de novo no card recolhe a explicacao", async () => {
    const r = render(
      <LinkDeIndicacao
        carregar={jest.fn().mockResolvedValue(MEU)}
        listarCampanhas={jest.fn().mockResolvedValue([ABERTA])}
      />
    );
    const card = await r.findByTestId("link-indicacao-aberta");
    fireEvent.press(card);
    expect(r.getByTestId("link-indicacao-explicacao")).toBeTruthy();
    fireEvent.press(card);
    expect(r.queryByTestId("link-indicacao-explicacao")).toBeNull();
  });

  // promocoes-um-cartao-por-campanha (Andre, 24/10): um cartao por campanha, um so Compartilhar,
  // e o cartao "SEU LINK" separado some quando ele participa de alguma.
  it("sem promocao, o cartao SEU LINK geral; com promocao, ele some e o cartao da campanha traz o link", async () => {
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const sem = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(MEU)} compartilhar={compartilhar} listarCampanhas={SEM_CAMPANHAS} />);
    expect((await sem.findByTestId("link-indicacao-link")).props.children).toBe(MEU.link);
    expect(sem.getByText("SEU LINK")).toBeTruthy();
    sem.unmount();
    const com = {
      ...MEU,
      campaigns: [{ campaign_id: "c1", name: "Indique e ganhe", link: "https://x/i/ABC?c=c1", referred: 1, credited: 0 }],
    };
    const r = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(com)} compartilhar={compartilhar} listarCampanhas={SEM_CAMPANHAS} />);
    expect((await r.findByTestId("link-indicacao-link-c1")).props.children).toBe("https://x/i/ABC?c=c1");
    expect(r.queryByText("SEU LINK")).toBeNull();
    expect(r.queryByTestId("link-indicacao-link")).toBeNull();
    // um so Compartilhar por campanha: o do cartao geral nao existe mais
    expect(r.queryByTestId("link-indicacao-compartilhar")).toBeNull();
    expect(r.getAllByTestId("link-indicacao-campanha-compartilhar")).toHaveLength(1);
    fireEvent.press(r.getByTestId("link-indicacao-campanha-compartilhar"));
    expect(compartilhar).toHaveBeenCalledWith("https://x/i/ABC?c=c1", expect.objectContaining({ titulo: "Vupth" }));
  });

  it("em mais de uma promocao, cada cartao tem o seu Compartilhar com o seu link", async () => {
    const compartilhar = jest.fn().mockResolvedValue(undefined);
    const com = {
      ...MEU,
      campaigns: [
        { campaign_id: "c1", name: "Primeira", link: "https://x/i/ABC?c=c1", referred: 0, credited: 0 },
        { campaign_id: "c2", name: "Segunda", link: "https://x/i/ABC?c=c2", referred: 0, credited: 0 },
      ],
    };
    const r = render(<LinkDeIndicacao carregar={jest.fn().mockResolvedValue(com)} compartilhar={compartilhar} listarCampanhas={SEM_CAMPANHAS} />);
    await r.findByTestId("link-indicacao-link-c1");
    expect(r.getAllByTestId("link-indicacao-campanha")).toHaveLength(2);
    const botoes = r.getAllByTestId("link-indicacao-campanha-compartilhar");
    expect(botoes).toHaveLength(2);
    fireEvent.press(botoes[1]);
    expect(compartilhar).toHaveBeenCalledWith("https://x/i/ABC?c=c2", expect.objectContaining({ titulo: "Vupth" }));
  });
});
