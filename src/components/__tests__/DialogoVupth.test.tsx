import { AccessibilityInfo, Animated, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { render, fireEvent, act, screen, within } from "@testing-library/react-native";

import { DialogoVupth } from "../DialogoVupth";
import { useDialogoStore, abrirDialogo } from "@store/dialogo.store";
import { useTemaStore } from "@store/tema.store";
import { TIPOS_DE_DIALOGO, aparenciaDoTipo } from "@lib/tipoDeDialogo";
import { coresDoTema, veuDoTema, type Tema } from "@theme/tema";
import { TEMAS, razao } from "../../test-utils/contraste";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
// O escuro so vale com a liberacao aberta (src/theme/liberacao.ts); o tema padrao
// segue claro, entao os testes que nao escolhem tema nao notam.
jest.mock("@theme/liberacao", () => ({ ESCURO_LIBERADO: true }));

describe("DialogoVupth (o diálogo do app no nativo)", () => {
  beforeEach(() => useDialogoStore.getState().fechar());

  it("sem pedido, não desenha nada", () => {
    const { toJSON } = render(<DialogoVupth />);
    expect(toJSON()).toBeNull();
  });

  it("mostra título e mensagem do pedido", () => {
    const { getByText, rerender } = render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Erro", mensagem: "Senha incorreta" }));
    rerender(<DialogoVupth />);

    expect(getByText("Erro")).toBeTruthy();
    expect(getByText("Senha incorreta")).toBeTruthy();
  });

  it("o toque resolve com o índice — é assim que o confirmar sabe a resposta", async () => {
    const { getByTestId, rerender } = render(<DialogoVupth />);
    let escolha!: Promise<number>;
    act(() => {
      escolha = abrirDialogo({
        titulo: "Fechar fila",
        mensagem: "Ninguém novo entra.",
        botoes: [{ texto: "Voltar", estilo: "cancel" }, { texto: "Fechar" }],
      });
    });
    rerender(<DialogoVupth />);

    fireEvent.press(getByTestId("dialogo-botao-1"));

    await expect(escolha).resolves.toBe(1);
  });

  it("marca a si mesmo como montado — sem isso quem chama cai no Alert do sistema", () => {
    render(<DialogoVupth />);
    expect(useDialogoStore.getState().hostMontado).toBe(true);
  });

  it("três botões cabem — o Alert do sistema empilha, e o nosso também", () => {
    const { getByTestId, rerender } = render(<DialogoVupth />);
    act(() =>
      void abrirDialogo({
        titulo: "Encerrar expediente",
        mensagem: "Ainda há gente na fila",
        botoes: [{ texto: "Continuar", estilo: "cancel" }, { texto: "Pausar entrada" }, { texto: "Encerrar", estilo: "destructive" }],
      })
    );
    rerender(<DialogoVupth />);

    expect(getByTestId("dialogo-botao-2")).toBeTruthy();
  });
});

const estilo = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);
const idsDosBotoes = () =>
  screen.getAllByTestId(/^dialogo-botao-\d+$/).map((el) => el.props.testID as string);

// modais-de-alerta (design-modais, 17/10): o tipo e dito por uma faixa no topo e
// um selo com icone; o primario e sempre verde-marca, e so a acao destrutiva e
// danger. Sem `tipo` o cartao e o de sempre.
describe("DialogoVupth com tipo", () => {
  beforeEach(() => useDialogoStore.getState().fechar());

  const abrir = (pedido: Parameters<typeof abrirDialogo>[0]) => {
    render(<DialogoVupth />);
    act(() => void abrirDialogo(pedido));
  };

  it("sem tipo: nem selo nem faixa, botoes na ordem da lista, desenho antigo", () => {
    abrir({
      titulo: "Fechar fila",
      mensagem: "Ninguém novo entra.",
      botoes: [{ texto: "Voltar", estilo: "cancel" }, { texto: "Fechar" }],
    });
    expect(screen.queryByTestId("dialogo-selo")).toBeNull();
    expect(screen.queryByTestId("dialogo-faixa")).toBeNull();
    expect(idsDosBotoes()).toEqual(["dialogo-botao-0", "dialogo-botao-1"]);
    // o cancelar vazado e o confirmar solido: a regra do pesoDoBotao, intacta
    expect(estilo("dialogo-botao-0").borderWidth).toBe(1.5);
    expect(estilo("dialogo-botao-1").backgroundColor).toBe("#9FE870");
  });

  it("tipo desconhecido vira o dialogo de sempre, sem selo", () => {
    abrir({ titulo: "Oi", mensagem: "x", tipo: "perigoso" as never });
    expect(screen.queryByTestId("dialogo-selo")).toBeNull();
  });

  it.each([
    ["informacao", "Aviso", true],
    ["atencao", "Atenção", true],
    ["dinheiro", "Pagamento", true],
    ["erro", "Erro", false],
  ] as const)("%s: selo '%s'; faixa=%s", (tipo, selo, faixa) => {
    abrir({ titulo: "Título", mensagem: "Uma linha.", tipo });
    expect(screen.getByText(selo)).toBeTruthy();
    expect(!!screen.queryByTestId("dialogo-faixa")).toBe(faixa);
  });

  it("o selo e a faixa levam as cores do tipo, nao do botao", () => {
    abrir({ titulo: "Hora do almoço", mensagem: "60 min.", tipo: "atencao" });
    expect(estilo("dialogo-selo").backgroundColor).toBe("#FFC091");
    expect(estilo("dialogo-faixa").backgroundColor).toBe("#FFC091");
    // a faixa tem 6 px e cresce da esquerda
    expect(estilo("dialogo-faixa").height).toBe(6);
    expect(estilo("dialogo-faixa").transformOrigin).toBe("0% 50%");
  });

  it("o selo pode trocar de rotulo: Multa no lugar de Pagamento", () => {
    abrir({ titulo: "Sair da fila", mensagem: "R$ 3,00.", tipo: "dinheiro", selo: "Multa" });
    expect(screen.getByText("Multa")).toBeTruthy();
    expect(screen.queryByText("Pagamento")).toBeNull();
  });

  it("o primario e verde-marca com texto forest, em cima; o cancelar e secundario, embaixo", () => {
    abrir({
      titulo: "Hora do almoço",
      tipo: "atencao",
      botoes: [{ texto: "Agora não", estilo: "cancel" }, { texto: "Iniciar" }],
    });
    // a ordem da tela: o primario (indice 1) primeiro
    expect(idsDosBotoes()).toEqual(["dialogo-botao-1", "dialogo-botao-0"]);
    expect(estilo("dialogo-botao-1").backgroundColor).toBe("#9FE870");
    expect(estilo("dialogo-botao-0").backgroundColor).toBe("#F3F5F1");
    // sem borda: o cartao e os botoes nao desenham contorno
    expect(estilo("dialogo-botao-1").borderWidth).toBeUndefined();
  });

  it("so a acao destrutiva e danger, e o indice devolvido continua o da lista", async () => {
    let escolha!: Promise<number>;
    render(<DialogoVupth />);
    act(() => {
      escolha = abrirDialogo({
        titulo: "Sair da fila",
        mensagem: "R$ 3,00 de multa.",
        tipo: "dinheiro",
        botoes: [{ texto: "Cancelar", estilo: "cancel" }, { texto: "Sair", estilo: "destructive" }],
      });
    });
    expect(estilo("dialogo-botao-1").backgroundColor).toBe("#B3261E");
    fireEvent.press(screen.getByTestId("dialogo-botao-1"));
    await expect(escolha).resolves.toBe(1);
  });
});

// Entrada e saida (design-motion, peca 2): veu 250 ms, cartao 450 ms, faixa 500
// ms; saida 200 ms. O Modal fica sem animacao propria e o dialogo continua
// montado ate a saida acabar.
describe("DialogoVupth: entrada e saida animadas", () => {
  type Chamada = { cfg: { toValue: number; duration: number; useNativeDriver: boolean }; fim: ((r: { finished: boolean }) => void)[] };
  let chamadas: Chamada[];
  let timing: jest.SpyInstance;

  beforeEach(() => {
    useDialogoStore.getState().fechar();
    chamadas = [];
    // O driver de frames do jest nao anda com o relogio falso; quem manda no
    // fim de cada animacao e o teste.
    timing = jest.spyOn(Animated, "timing").mockImplementation(((_v: unknown, cfg: Chamada["cfg"]) => {
      const chamada: Chamada = { cfg, fim: [] };
      chamadas.push(chamada);
      return {
        start: (cb?: (r: { finished: boolean }) => void) => chamada.fim.push(cb ?? (() => {})),
        stop: jest.fn(),
        reset: jest.fn(),
      };
    }) as never);
  });
  // Um a um, e nao `restoreAllMocks`: ele tambem zera os jest.fn() do setup do
  // React Native (AccessibilityInfo), e o teste seguinte herdaria um mock mudo.
  afterEach(() => timing.mockRestore());

  const duracoes = (toValue: number) => chamadas.filter((c) => c.cfg.toValue === toValue).map((c) => c.cfg.duration);

  it("o Modal nao anima sozinho: a animacao mora por dentro", () => {
    const { UNSAFE_getByType } = render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Oi", mensagem: "x" }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Modal } = require("react-native");
    expect(UNSAFE_getByType(Modal).props.animationType).toBe("none");
  });

  it("entra com veu em 250, cartao em 450 e faixa em 500, no driver nativo", () => {
    render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Oi", mensagem: "x", tipo: "atencao" }));
    expect(duracoes(1).sort((a, b) => a - b)).toEqual([250, 450, 500]);
    expect(chamadas.every((c) => c.cfg.useNativeDriver === true)).toBe(true);
  });

  it("fica montado ate a saida de 200 ms acabar — e nao aceita toque enquanto sai", async () => {
    render(<DialogoVupth />);
    let escolha!: Promise<number>;
    act(() => {
      escolha = abrirDialogo({
        titulo: "Sair da fila",
        mensagem: "R$ 3,00.",
        tipo: "dinheiro",
        botoes: [{ texto: "Cancelar", estilo: "cancel" }, { texto: "Sair", estilo: "destructive" }],
      });
    });
    expect(screen.getByTestId("dialogo-cartao").props.pointerEvents).toBe("auto");

    fireEvent.press(screen.getByTestId("dialogo-botao-1"));
    await expect(escolha).resolves.toBe(1);

    // a loja ja esta vazia, mas o cartao segue na tela saindo
    expect(useDialogoStore.getState().atual).toBeNull();
    expect(screen.getByText("Sair da fila")).toBeTruthy();
    expect(screen.getByTestId("dialogo-cartao").props.pointerEvents).toBe("none");
    expect(duracoes(0)).toEqual([200, 200, 200]);

    act(() => {
      chamadas.filter((c) => c.cfg.toValue === 0).forEach((c) => c.fim.forEach((cb) => cb({ finished: true })));
    });
    expect(screen.queryByText("Sair da fila")).toBeNull();
  });

  it("um aviso que chega no meio da saida cancela a saida e entra por inteiro", async () => {
    render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Primeiro", mensagem: "a" }));
    act(() => useDialogoStore.getState().responder(0));
    expect(screen.getByText("Primeiro")).toBeTruthy();

    act(() => void abrirDialogo({ titulo: "Segundo", mensagem: "b" }));
    expect(screen.getByText("Segundo")).toBeTruthy();
    expect(screen.getByTestId("dialogo-cartao").props.pointerEvents).toBe("auto");

    // o fim tardio da saida interrompida nao derruba o aviso novo
    act(() => {
      chamadas.filter((c) => c.cfg.toValue === 0).forEach((c) => c.fim.forEach((cb) => cb({ finished: false })));
    });
    expect(screen.getByText("Segundo")).toBeTruthy();
  });

  it("o proximo da fila entra na hora, sem esperar a saida do anterior", () => {
    render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Um", mensagem: "a" }));
    act(() => void abrirDialogo({ titulo: "Dois", mensagem: "b" }));
    act(() => useDialogoStore.getState().responder(0));
    expect(screen.getByText("Dois")).toBeTruthy();
    expect(screen.queryByText("Um")).toBeNull();
  });

  it("com remover animacoes ligado: sem animacao, aparece e some na hora", async () => {
    // `Once` e nao spyOn/restore: a funcao ja e um jest.fn() do setup do React
    // Native, e restaurar um spy dela apagaria a implementacao para os testes
    // seguintes (a chamada passaria a devolver undefined).
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
    render(<DialogoVupth />);
    await act(async () => {});
    act(() => void abrirDialogo({ titulo: "Sem movimento", mensagem: "x", tipo: "informacao" }));
    expect(screen.getByText("Sem movimento")).toBeTruthy();
    act(() => useDialogoStore.getState().responder(0));
    expect(screen.queryByText("Sem movimento")).toBeNull();
    expect(chamadas).toHaveLength(0);
  });

  it("vazio, o host nao anima nada nem desenha nada", () => {
    const { toJSON } = render(<DialogoVupth />);
    expect(toJSON()).toBeNull();
    expect(chamadas).toHaveLength(0);
  });
});

// DEC-75: o painel era #FFFFFF, o titulo forest e o corpo #454745, escritos a
// mao. No escuro o painel e a surface (#163300) e um titulo forest seria 1:1. Aqui
// se le a cor que o dialogo RESOLVE em cada tema, e se mede o contraste dela.
describe.each(TEMAS)("DialogoVupth no tema %s", (tema) => {
  const cores = coresDoTema(tema);
  const usar = (t: Tema) =>
    act(() => {
      useTemaStore.setState({ preferencia: t, restaurado: true });
    });
  const cor = (el: { props: { style?: unknown } }, chave: "color" | "backgroundColor" | "borderColor") =>
    StyleSheet.flatten(el.props.style as ViewStyle & TextStyle)?.[chave] as string;

  beforeEach(() => {
    jest.useFakeTimers();
    useDialogoStore.getState().fechar();
    usar(tema);
  });
  afterEach(() => {
    usar("claro");
    jest.useRealTimers();
  });

  const abrir = (pedido: Parameters<typeof abrirDialogo>[0]) => {
    render(<DialogoVupth />);
    act(() => void abrirDialogo(pedido));
  };

  /** O veu: o unico Animated.View que cobre a tela (absoluteFill) e tem fundo. */
  const veuNaTela = () => {
    const achado = screen.UNSAFE_getAllByType(Animated.View).find((v) => {
      const e = StyleSheet.flatten(v.props.style as ViewStyle);
      return e?.position === "absolute" && e?.backgroundColor;
    });
    if (!achado) throw new Error("sem veu");
    return cor(achado, "backgroundColor");
  };

  it("sem tipo: painel, titulo, corpo e botoes leem o tema e passam em 4,5:1", () => {
    abrir({
      titulo: "Sair da fila",
      mensagem: "Você perde a vez.",
      botoes: [{ texto: "Voltar", estilo: "cancel" }, { texto: "Sair", estilo: "destructive" }],
    });
    const painel = cor(screen.getByLabelText("Sair da fila"), "backgroundColor");
    expect(painel).toBe(cores.painel);

    const titulo = cor(screen.getByText("Sair da fila"), "color");
    const corpo = cor(screen.getByText("Você perde a vez."), "color");
    expect(titulo).toBe(cores.textPrimary);
    expect(corpo).toBe(cores.textSecondary);
    expect(razao(titulo, painel)).toBeGreaterThanOrEqual(4.5);
    expect(razao(corpo, painel)).toBeGreaterThanOrEqual(4.5);

    // o cancelar e a saida segura: solido, green com onGreen
    const voltar = screen.getByTestId("dialogo-botao-0");
    expect(cor(voltar, "backgroundColor")).toBe(cores.green);
    expect(razao(cor(within(voltar).getByText("Voltar"), "color"), cores.green)).toBeGreaterThanOrEqual(4.5);

    // a acao destrutiva e vazada: borda do texto, rotulo danger sobre o painel
    const sair = screen.getByTestId("dialogo-botao-1");
    expect(cor(sair, "backgroundColor")).toBe("transparent");
    expect(cor(sair, "borderColor")).toBe(cores.textPrimary);
    expect(razao(cor(sair, "borderColor"), painel)).toBeGreaterThanOrEqual(3);
    const rotulo = cor(within(sair).getByText("Sair"), "color");
    expect(rotulo).toBe(cores.danger);
    expect(razao(rotulo, painel)).toBeGreaterThanOrEqual(4.5);
  });

  it("sem tipo e vazado nao destrutivo: o rotulo e o textPrimary", () => {
    abrir({ titulo: "Oi", mensagem: "x", botoes: [{ texto: "Voltar", estilo: "cancel" }] });
    const voltar = screen.getByTestId("dialogo-botao-0");
    expect(cor(within(voltar).getByText("Voltar"), "color")).toBe(cores.textPrimary);
    expect(razao(cores.textPrimary, cores.painel)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(TIPOS_DE_DIALOGO)("tipo %s: painel, selo, faixa e botoes leem o tema", (tipo) => {
    abrir({
      titulo: "Título",
      mensagem: "Uma linha.",
      tipo,
      botoes: [{ texto: "Agora não", estilo: "cancel" }, { texto: "Confirmar" }],
    });
    const aparencia = aparenciaDoTipo(tipo, undefined, tema);
    const painel = cor(screen.getByLabelText("Título"), "backgroundColor");
    expect(painel).toBe(cores.painel);

    // titulo e corpo
    expect(razao(cor(screen.getByText("Título"), "color"), painel)).toBeGreaterThanOrEqual(4.5);
    expect(razao(cor(screen.getByText("Uma linha."), "color"), painel)).toBeGreaterThanOrEqual(4.5);

    // selo: texto sobre o fundo dele (e o icone tem a mesma cor do texto)
    const selo = screen.getByTestId("dialogo-selo");
    expect(cor(selo, "backgroundColor")).toBe(aparencia.fundo);
    const textoDoSelo = cor(within(selo).getByText(aparencia.selo), "color");
    expect(textoDoSelo).toBe(aparencia.texto);
    expect(razao(textoDoSelo, aparencia.fundo)).toBeGreaterThanOrEqual(4.5);

    // faixa: a cor do tipo (so os tipos que tem faixa). No escuro ela se separa do
    // painel em 3:1. No claro o desenho usa green e pessego, que sobre o branco dao
    // 1,47 e 1,59:1: o claro nao muda, e o selo ao lado e quem carrega o tipo.
    if (aparencia.corDaFaixa) {
      expect(cor(screen.getByTestId("dialogo-faixa"), "backgroundColor")).toBe(aparencia.corDaFaixa);
      if (tema === "escuro") expect(razao(aparencia.corDaFaixa, painel)).toBeGreaterThanOrEqual(3);
    } else {
      expect(screen.queryByTestId("dialogo-faixa")).toBeNull();
    }

    // o primario (indice 1) e green com onGreen; o secundario e o bloco do painel
    const primario = screen.getByTestId("dialogo-botao-1");
    expect(cor(primario, "backgroundColor")).toBe(cores.green);
    expect(razao(cor(within(primario).getByText("Confirmar"), "color"), cores.green)).toBeGreaterThanOrEqual(4.5);
    const secundario = screen.getByTestId("dialogo-botao-0");
    expect(cor(secundario, "backgroundColor")).toBe(cores.sobrePainel);
    expect(razao(cor(within(secundario).getByText("Agora não"), "color"), cores.sobrePainel)).toBeGreaterThanOrEqual(4.5);
  });

  it("a acao destrutiva com tipo e danger com onDanger", () => {
    abrir({
      titulo: "Sair da fila",
      mensagem: "R$ 3,00 de multa.",
      tipo: "dinheiro",
      botoes: [{ texto: "Cancelar", estilo: "cancel" }, { texto: "Sair", estilo: "destructive" }],
    });
    const sair = screen.getByTestId("dialogo-botao-1");
    expect(cor(sair, "backgroundColor")).toBe(cores.danger);
    const rotulo = cor(within(sair).getByText("Sair"), "color");
    expect(rotulo).toBe(cores.onDanger);
    expect(razao(rotulo, cores.danger)).toBeGreaterThanOrEqual(4.5);
  });

  it("o veu: o do tema; so o dialogo SEM tipo no claro segue forest a 45% (preso a caixa da web)", () => {
    abrir({ titulo: "Sem tipo", mensagem: "x" });
    expect(veuNaTela()).toBe(tema === "claro" ? "#16330073" : veuDoTema("escuro"));
  });

  it("o veu do dialogo COM tipo e sempre o do tema", () => {
    abrir({ titulo: "Com tipo", mensagem: "x", tipo: "informacao" });
    expect(veuNaTela()).toBe(veuDoTema(tema));
  });
});
