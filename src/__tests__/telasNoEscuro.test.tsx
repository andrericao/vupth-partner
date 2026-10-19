import { Text, View } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ArrowLeftRight, ChevronRight, Share2, Star } from "lucide-react-native";

import ProfessionalSettingsScreen from "../../app/(professional)/settings";
import AlsoProfessionalScreen from "../../app/(owner)/onboarding/also-professional";
import { useAuthStore } from "@store/auth.store";
import { useProfessionalStore } from "@store/professional.store";
import { useTemaStore } from "@store/tema.store";
import { coresDoTema, type Tema } from "@theme/tema";
import { TEMAS, contrasteDasClasses, razao, tokenDaClasse } from "../test-utils/contraste";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ establishmentId: "est-1", ownerName: "Ana" }),
}));
jest.mock("@hooks/useMinhaFoto", () => ({ useMinhaFoto: () => ({ uri: null, trocar: jest.fn() }) }));
// `useScrollToTop` pede uma rota de navegacao, que a tela fora do navegador nao tem.
jest.mock("@hooks/useVoltarAoTopo", () => ({
  ...jest.requireActual("@hooks/useVoltarAoTopo"),
  useVoltarAoTopo: () => ({ current: null }),
}));
// A barra de status pede o navegador (`useIsFocused`) e nao tem cor para medir.
jest.mock("@components/BarraDeStatus", () => ({ BarraDeStatusClara: () => null }));
// O escuro so vale com a liberacao aberta (src/theme/liberacao.ts).
jest.mock("@theme/liberacao", () => ({ ESCURO_LIBERADO: true }));

// DEC-75: estas telas escreviam forest como texto e hex nos icones. Cada teste
// le a cor que a tela RESOLVE em cada tema e mede o contraste.
const TEXTO = 4.5; // WCAG AA, texto
const GRAFICO = 3; // WCAG 1.4.11, icone

const metricas = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function usar(tema: Tema) {
  act(() => {
    useTemaStore.setState({ preferencia: tema, restaurado: true });
  });
}

/** O primeiro View cuja classe e exatamente essa (ex.: "bg-vupth-surface"). */
function comClasse(classe: string) {
  const achado = screen.UNSAFE_getAllByType(View).find((v) => (v.props.className ?? "").split(/\s+/).includes(classe));
  if (!achado) throw new Error(`nenhum View com a classe ${classe}`);
  return achado;
}

describe.each(TEMAS)("telas no tema %s", (tema) => {
  const cores = coresDoTema(tema);
  beforeEach(() => {
    jest.useFakeTimers();
    usar(tema);
  });
  afterEach(() => {
    usar("claro");
    jest.useRealTimers();
  });

  describe("Perfil do profissional (settings)", () => {
    beforeEach(() => {
      useAuthStore.setState({ user: { roles: ["PROFESSIONAL", "OWNER"] } as never });
      useProfessionalStore.setState({
        professional: {
          id: "p1",
          name: "Bia Souza",
          nickname: "Bia",
          specialty: "BARBER",
          establishment_id: "est-1",
          establishment_name: "Barbearia Central",
          rating_average: 4.8,
          rating_count: 12,
        } as never,
        myServices: [{ id: "s1" }] as never,
        fetchMyAffiliations: jest.fn(async () => []) as never,
        fetchMyServices: jest.fn(async () => undefined) as never,
      });
      render(
        <SafeAreaProvider initialMetrics={metricas}>
          <ProfessionalSettingsScreen />
        </SafeAreaProvider>
      );
    });

    it("os cartoes do menu: titulo e explicacao passam em 4,5:1 sobre a surface", () => {
      const grupo = comClasse("bg-vupth-surface");
      expect(tokenDaClasse(grupo, "bg")).toBe("surface");
      for (const titulo of ["Meus serviços", "Refeições", "Dados cadastrais", "Aparência"]) {
        const texto = screen.getByText(titulo);
        expect(tokenDaClasse(texto, "text")).toBe("textPrimary");
        expect(contrasteDasClasses(texto, grupo, tema)).toBeGreaterThanOrEqual(TEXTO);
      }
      expect(contrasteDasClasses(screen.getByText("preços e duração do que você oferece"), grupo, tema)).toBeGreaterThanOrEqual(TEXTO);
    });

    it("a seta de cada cartao e o textPrimary do tema e se separa da surface (3:1)", () => {
      // a primeira seta e a do cartao Area do dono (greenTint); o resto e do menu
      const [, ...doMenu] = screen.UNSAFE_getAllByType(ChevronRight);
      expect(doMenu.length).toBeGreaterThan(5);
      for (const seta of doMenu) {
        expect(seta.props.color).toBe(cores.textPrimary);
        expect(razao(seta.props.color, cores.surface)).toBeGreaterThanOrEqual(GRAFICO);
      }
    });

    it("Area do dono: texto, icone e seta sao o par do greenTint", () => {
      const cartao = comClasse("bg-vupth-greenTint");
      const texto = screen.getByText("Área do dono");
      expect(tokenDaClasse(texto, "text")).toBe("onGreenTint");
      expect(contrasteDasClasses(texto, cartao, tema)).toBeGreaterThanOrEqual(TEXTO);
      const troca = screen.UNSAFE_getByType(ArrowLeftRight);
      expect(troca.props.color).toBe(cores.onGreenTint);
      expect(razao(troca.props.color, cores.greenTint)).toBeGreaterThanOrEqual(TEXTO);
      const [seta] = screen.UNSAFE_getAllByType(ChevronRight);
      expect(seta.props.color).toBe(cores.onGreenTint);
      expect(razao(seta.props.color, cores.greenTint)).toBeGreaterThanOrEqual(GRAFICO);
    });

    it("o cabecalho e forest nos dois temas: o branco (tema-fixo) e o green sobre ele passam em 4,5:1", () => {
      const cabecalho = comClasse("bg-vupth-forest");
      expect(cores.forest).toBe(coresDoTema("claro").forest);
      // nome e nota: branco, o mesmo nos dois temas porque o fundo tambem e
      expect(screen.getByText("Bia Souza").props.className).toContain("text-white");
      expect(razao("#FFFFFF", cores.forest)).toBeGreaterThanOrEqual(TEXTO);
      // o subtitulo (a loja) e o green do tema
      // (a loja tambem e a explicacao do cartao Vinculo, mais abaixo)
      const subtitulo = screen.getAllByText("Barbearia Central").find((t) => tokenDaClasse(t, "text") === "green");
      if (!subtitulo) throw new Error("sem subtitulo green no cabecalho");
      expect(contrasteDasClasses(subtitulo, cabecalho, tema)).toBeGreaterThanOrEqual(TEXTO);
      // compartilhar e a estrela: green do tema, 3:1 sobre o forest
      for (const Icone of [Share2, Star]) {
        const icone = screen.UNSAFE_getByType(Icone);
        expect(icone.props.color).toBe(cores.green);
        expect(razao(icone.props.color, cores.forest)).toBeGreaterThanOrEqual(GRAFICO);
      }
      expect(screen.UNSAFE_getByType(Star).props.fill).toBe(cores.green);
    });

    it("so o cabecalho tem texto branco fixo; o resto da tela le o tema", () => {
      const brancos = screen.UNSAFE_getAllByType(Text).filter((t) => (t.props.className ?? "").includes("text-white"));
      expect(brancos.map((t) => t.props.children).flat().join("|")).toContain("Bia Souza");
      expect(brancos).toHaveLength(2); // o nome e a nota
    });
  });

  describe("Voce tambem vai atender? (also-professional)", () => {
    it("o titulo da secao e textPrimary e passa em 4,5:1 sobre o fundo da tela", () => {
      useAuthStore.setState({ user: { roles: ["OWNER"] } as never });
      render(
        <SafeAreaProvider initialMetrics={metricas}>
          <AlsoProfessionalScreen />
        </SafeAreaProvider>
      );
      const titulo = screen.getByText("Especialidade");
      expect(tokenDaClasse(titulo, "text")).toBe("textPrimary");
      // a tela nao pinta fundo proprio: o fundo e o `background` do tema (o ThemeProvider do layout raiz)
      expect(razao(cores.textPrimary, cores.background)).toBeGreaterThanOrEqual(TEXTO);
    });
  });
});
