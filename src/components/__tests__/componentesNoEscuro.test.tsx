import { Animated, StyleSheet, Switch, View, type ImageStyle } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { ArrowRight, House, MapPin, X } from "lucide-react-native";

import { AvisoLojaSemPonto } from "../AvisoLojaSemPonto";
import { ExpedienteCard } from "../ExpedienteCard";
import { LinhaComInterruptor } from "../LinhaComInterruptor";
import { ReadinessFaixa } from "../ReadinessFaixa";
import { ServerWarmup } from "../ServerWarmup";
import { StatCard } from "../brand/StatCard";
import { TabBarIcon } from "../TabBarIcon";
import { ownerCompletion } from "@lib/completion";
import { useTemaStore } from "@store/tema.store";
import { BRANCO, coresDoTema, interruptorDoTema, type Tema } from "@theme/tema";
import { TEMAS, contrasteDasClasses, razao, tokenDaClasse } from "../../test-utils/contraste";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { commit: "abc1234" } } },
}));
// O escuro so vale com a liberacao aberta (src/theme/liberacao.ts): o teste a
// abre para ler o que cada componente resolve nos DOIS temas.
jest.mock("@theme/liberacao", () => ({ ESCURO_LIBERADO: true }));

// DEC-75: estes componentes escreviam forest como texto e hex em icones. No
// escuro o forest e a surface (1:1) e o hex nao troca de tema. Cada teste le a
// cor que o componente RESOLVE em cada tema e mede o contraste, em vez de
// conferir o nome de uma classe.
const TEXTO = 4.5; // WCAG AA, texto
const GRAFICO = 3; // WCAG 1.4.11, icone e componente grafico

function usar(tema: Tema) {
  act(() => {
    useTemaStore.setState({ preferencia: tema, restaurado: true });
  });
}

/** O primeiro no (de qualquer tipo) cuja classe pede esse fundo. */
function comFundo(classe: string) {
  const achado = screen.UNSAFE_getAllByType(View).find((v) => (v.props.className ?? "").split(/\s+/).includes(classe));
  if (!achado) throw new Error(`nenhum View com a classe ${classe}`);
  return achado;
}

describe.each(TEMAS)("componentes no tema %s", (tema) => {
  const cores = coresDoTema(tema);
  // Relogio falso: as animacoes de entrada (faixa, aviso, abertura) nao andam
  // depois do teste e nao vazam atualizacao para o seguinte.
  beforeEach(() => {
    jest.useFakeTimers();
    usar(tema);
  });
  afterEach(() => {
    usar("claro");
    jest.useRealTimers();
  });

  describe("LinhaComInterruptor", () => {
    it("o interruptor e o do tema: trilho border e green, bolinha branca", () => {
      render(<LinhaComInterruptor rotulo="Aviso" descricao="Ligado" ligado onMudar={jest.fn()} />);
      const interruptor = screen.UNSAFE_getByType(Switch);
      expect(interruptor.props.trackColor).toEqual({ false: cores.border, true: cores.green });
      expect(interruptor.props.thumbColor).toBe(BRANCO);
      expect(interruptor.props.ios_backgroundColor).toBe(cores.border);
      expect({
        trackColor: interruptor.props.trackColor,
        thumbColor: interruptor.props.thumbColor,
        ios_backgroundColor: interruptor.props.ios_backgroundColor,
      }).toEqual(interruptorDoTema(cores));
    });

    it("o trilho desligado aparece sobre o cartao (1,2:1, o minimo do divisor da Design)", () => {
      expect(razao(cores.border, cores.surface)).toBeGreaterThanOrEqual(1.2);
    });

    it("rotulo e explicacao passam em 4,5:1 sobre o cartao surface", () => {
      render(<LinhaComInterruptor rotulo="Aviso na hora da refeição" descricao="Ligado" ligado onMudar={jest.fn()} />);
      const cartao = screen.root as unknown as { props: { className: string } };
      expect(tokenDaClasse(cartao, "bg")).toBe("surface");
      expect(contrasteDasClasses(screen.getByText("Aviso na hora da refeição"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      expect(contrasteDasClasses(screen.getByText("Ligado"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
    });
  });

  describe("ExpedienteCard", () => {
    it("o horario e o rotulo passam em 4,5:1 sobre o cartao surface", () => {
      render(
        <ExpedienteCard
          periodo="week"
          workdays={[{ date: "2026-10-03", start: "08:00", end: "10:00", workedMinutes: 120 }]}
        />
      );
      const cartao = screen.root as unknown as { props: { className: string } };
      expect(tokenDaClasse(cartao, "bg")).toBe("surface");
      for (const texto of ["Expediente", "2h00", "em 1 dia"]) {
        expect(contrasteDasClasses(screen.getByText(texto), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      }
    });

    it("o estado vazio tambem", () => {
      render(<ExpedienteCard periodo="day" workdays={[]} />);
      expect(
        contrasteDasClasses(screen.getByText("Sem expediente no período"), screen.root as never, tema)
      ).toBeGreaterThanOrEqual(TEXTO);
    });
  });

  describe("StatCard", () => {
    it("comum: o numero e o rotulo passam em 4,5:1 sobre a surface", () => {
      render(<StatCard label="Na fila" value="7" />);
      const cartao = screen.getByTestId("stat-card");
      expect(tokenDaClasse(cartao, "bg")).toBe("surface");
      expect(contrasteDasClasses(screen.getByText("7"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      expect(contrasteDasClasses(screen.getByText("Na fila"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
    });

    it("heroi: sobre o green os dois textos sao o onGreen, que e o mesmo hex nos dois temas", () => {
      render(<StatCard label="Na fila" value="7" hero />);
      const cartao = screen.getByTestId("stat-card");
      expect(tokenDaClasse(cartao, "bg")).toBe("green");
      expect(tokenDaClasse(screen.getByText("7"), "text")).toBe("onGreen");
      expect(tokenDaClasse(screen.getByText("Na fila"), "text")).toBe("onGreen");
      expect(contrasteDasClasses(screen.getByText("7"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      expect(contrasteDasClasses(screen.getByText("Na fila"), cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
    });
  });

  describe("ReadinessFaixa", () => {
    const pendente = ownerCompletion({
      hasName: true,
      hasServiceType: false,
      hasAddress: false,
      hasHours: false,
      hasProfessionalWithService: false,
      hasPhone: false,
      hasInstagram: false,
    });

    it("textos, icone e barra sao o par do greenTint e passam sobre ele", () => {
      render(<ReadinessFaixa completion={pendente} targetRoute="/x" goalNoun="aparecer aos clientes" />);
      const faixa = comFundo("bg-vupth-greenTint");
      const textos = [screen.getByText(/passos para abrir/), screen.getByText(/1 de 5/), screen.getByText(/para aparecer aos clientes/)];
      for (const texto of textos) {
        expect(tokenDaClasse(texto, "text")).toBe("onGreenTint");
        expect(contrasteDasClasses(texto, faixa, tema)).toBeGreaterThanOrEqual(TEXTO);
      }
      // o X de fechar
      const fechar = screen.UNSAFE_getByType(X);
      expect(fechar.props.color).toBe(cores.onGreenTint);
      expect(razao(fechar.props.color, cores.greenTint)).toBeGreaterThanOrEqual(GRAFICO);
    });

    it("o preenchimento da barra se separa do cartao (3:1) e o trilho e o mesmo token a 15%", () => {
      render(<ReadinessFaixa completion={pendente} targetRoute="/x" goalNoun="atender clientes" />);
      const preenchimento = comFundo("bg-vupth-onGreenTint");
      expect(razao(cores[tokenDaClasse(preenchimento, "bg") as "onGreenTint"], cores.greenTint)).toBeGreaterThanOrEqual(GRAFICO);
      const trilho = screen.UNSAFE_getAllByType(View).find((v) => (v.props.className ?? "").includes("bg-vupth-onGreenTint/15"));
      expect(trilho).toBeTruthy();
    });
  });

  describe("AvisoLojaSemPonto", () => {
    it("textos e icones sao o par do pessego (onAccentPeach) e passam em 4,5:1", () => {
      render(<AvisoLojaSemPonto endereco={{ locationStatus: "UNRESOLVED" }} onReler={jest.fn()} />);
      const cartao = comFundo("bg-vupth-accentPeach");
      for (const texto of [
        screen.getByText("Sua loja não aparece para quem busca por perto"),
        screen.getByText(/Não achamos o endereço/),
        screen.getByText("Usar localização"),
      ]) {
        expect(tokenDaClasse(texto, "text")).toBe("onAccentPeach");
        expect(contrasteDasClasses(texto, cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      }
      for (const Icone of [MapPin, ArrowRight]) {
        const cor = screen.UNSAFE_getByType(Icone).props.color;
        expect(cor).toBe(cores.onAccentPeach);
        expect(razao(cor, cores.accentPeach)).toBeGreaterThanOrEqual(TEXTO);
      }
    });
  });

  describe("TabBarIcon", () => {
    it("o icone ativo e o onGreenTint sobre a pilula greenTint; o inativo e o textSecondary sobre a barra", () => {
      const ativa = render(<TabBarIcon name="home" focused />);
      const corAtiva = ativa.UNSAFE_getByType(House).props.color;
      expect(corAtiva).toBe(cores.onGreenTint);
      expect(razao(corAtiva, cores.greenTint)).toBeGreaterThanOrEqual(TEXTO);
      ativa.unmount();

      const inativa = render(<TabBarIcon name="home" focused={false} />);
      const corInativa = inativa.UNSAFE_getByType(House).props.color;
      expect(corInativa).toBe(cores.textSecondary);
      // a barra das abas e o `background` do tema (os layouts leem cores.background)
      expect(razao(corInativa, cores.background)).toBeGreaterThanOrEqual(TEXTO);
    });
  });

  describe("ServerWarmup (a abertura segue o tema)", () => {
    const tinta = (no: { props: { style?: unknown } }) => StyleSheet.flatten(no.props.style as ImageStyle)?.tintColor;

    it("o fundo e o background do tema e o V so e repintado no escuro (green, 3:1 ou mais)", () => {
      const { UNSAFE_getAllByType, toJSON } = render(<ServerWarmup />);
      const raiz = toJSON() as { props: { className: string } };
      expect(tokenDaClasse(raiz, "bg")).toBe("background");
      const imagens = UNSAFE_getAllByType(Animated.Image);
      expect(imagens).toHaveLength(1);
      if (tema === "claro") {
        // o claro e o PNG como esta: sem tinta
        expect(tinta(imagens[0])).toBeUndefined();
      } else {
        expect(tinta(imagens[0])).toBe(cores.green);
        expect(razao(cores.green, cores.background)).toBeGreaterThanOrEqual(GRAFICO);
      }
    });

    it("falhou: o V parado leva a mesma tinta e o aviso passa em 4,5:1 sobre o fundo", () => {
      const { getByTestId, getByText, toJSON } = render(<ServerWarmup failed />);
      const raiz = toJSON() as { props: { className: string } };
      expect(tinta(getByTestId("abertura-v"))).toBe(tema === "escuro" ? cores.green : undefined);
      for (const texto of [getByText("Não foi possível abrir o app"), getByText("Confira a sua internet e tente de novo.")]) {
        expect(contrasteDasClasses(texto, raiz, tema)).toBeGreaterThanOrEqual(TEXTO);
      }
    });
  });
});

// O claro tem de ser EXATAMENTE o de antes (os hex que o codigo escrevia).
describe("no claro as cores sao as de antes da conversao", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    usar("claro");
  });
  afterEach(() => jest.useRealTimers());

  it("icone da aba: ativo forest, inativo #454745", () => {
    const ativa = render(<TabBarIcon name="home" focused />);
    expect(ativa.UNSAFE_getByType(House).props.color).toBe("#163300");
    ativa.unmount();
    const inativa = render(<TabBarIcon name="home" focused={false} />);
    expect(inativa.UNSAFE_getByType(House).props.color).toBe("#454745");
  });

  it("icones da faixa e do aviso: forest", () => {
    render(<ReadinessFaixa completion={ownerCompletion({ hasName: false, hasServiceType: false, hasAddress: false, hasHours: false, hasProfessionalWithService: false, hasPhone: false, hasInstagram: false })} targetRoute="/x" goalNoun="atender" />);
    expect(screen.UNSAFE_getByType(X).props.color).toBe("#163300");
  });

  it("a abertura e branca e o V nao tem tinta", () => {
    const { toJSON } = render(<ServerWarmup />);
    expect(tokenDaClasse(toJSON() as never, "bg")).toBe("background");
    expect(coresDoTema("claro").background).toBe("#FFFFFF");
  });
});
