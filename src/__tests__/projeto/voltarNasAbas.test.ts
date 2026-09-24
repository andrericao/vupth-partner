import fs from "fs";
import path from "path";
import { TabRouter, TabActions, CommonActions } from "@react-navigation/routers";

// 🔴 Teste do Andre (24/09), versão WEB no celular: na tela Sistema, o VOLTAR
// levava à Home (a Fila), e não às Configurações.
//
// A causa não era o botão do cabeçalho — esse navega para o destino certo. Era
// o voltar do SISTEMA: no navegador do Android ele vira "voltar do histórico",
// e quem decide o destino é o navegador de ABAS. O padrão do React Navigation
// para abas é `backBehavior: "firstRoute"` — voltar sempre para a PRIMEIRA aba.
// E a tela Sistema, como Dados cadastrais e Meus Serviços, é uma aba OCULTA
// (href: null): pelo histórico, todas caíam na Fila.
//
// Com `backBehavior: "history"`, voltar leva à aba visitada antes.
const ROTAS = ["queue", "cut-requests", "my-day", "settings", "sistema"];
const params = Object.fromEntries(ROTAS.map((r) => [r, undefined]));

function voltarDoSistema(backBehavior: "firstRoute" | "history") {
  const router = TabRouter({ backBehavior });
  const opts = { routeNames: ROTAS, routeParamList: params, routeGetIdList: {} } as any;
  let state = router.getInitialState(opts);
  state = router.getStateForAction(state, TabActions.jumpTo("settings"), opts) as any;
  state = router.getStateForAction(state, TabActions.jumpTo("sistema"), opts) as any;
  state = router.getStateForAction(state, CommonActions.goBack(), opts) as any;
  return state.routes[state.index].name;
}

describe("voltar nas abas volta para a aba anterior", () => {
  it("o padrão (firstRoute) levava à Fila — era o defeito", () => {
    expect(voltarDoSistema("firstRoute")).toBe("queue");
  });

  it("com history, volta às Configurações", () => {
    expect(voltarDoSistema("history")).toBe("settings");
  });

  it.each(["app/(professional)/_layout.tsx", "app/(owner)/(tabs)/_layout.tsx"])(
    "%s declara backBehavior=\"history\"",
    (arquivo) => {
      const src = fs.readFileSync(path.resolve(__dirname, "../../..", arquivo), "utf8");
      const abertura = src.slice(src.indexOf("<Tabs"), src.indexOf("screenOptions"));
      expect(abertura).toContain('backBehavior="history"');
    }
  );
});
