import fs from "fs";
import path from "path";

// 🔴 Andre, 18/09: "desci até bem embaixo e cliquei no ícone da aba já ativa —
// a tela não voltou ao topo". É o gesto padrão de quem desceu demais numa
// lista, e nenhuma aba o tratava. O client corrigiu o lado deles no mesmo dia.
//
// A API é o `useScrollToTop` do @react-navigation/native, embrulhado em
// `useVoltarAoTopo` (o cast do tipo mora lá, com o motivo escrito).
//
// Teste de POSIÇÃO, não de aparência: a regressão é silenciosa — nada quebra se
// alguém trocar o ScrollView e esquecer o ref, e o gesto simplesmente morre.
const RAIZ = path.resolve(__dirname, "../../..");

const ABAS = [
  "app/(professional)/queue.tsx",
  "app/(professional)/cut-requests.tsx",
  "app/(professional)/my-day.tsx",
  "app/(professional)/settings.tsx",
  "app/(owner)/(tabs)/dashboard.tsx",
  "app/(owner)/(tabs)/queues.tsx",
  "app/(owner)/(tabs)/menu.tsx",
];

describe("tocar na aba ativa volta ao topo", () => {
  it.each(ABAS)("%s usa o useScrollToTop e passa o ref ao ScrollView", (arquivo) => {
    const src = fs.readFileSync(path.join(RAIZ, arquivo), "utf8");
    expect(src).toContain("useVoltarAoTopo()");
    // o ref tem de chegar ao contêiner que rola
    expect(src).toMatch(/<ScrollView[\s\S]{0,400}?ref=\{rolagemRef\}/);
  });
});

// 24/09 (Andre): além do toque na aba ativa, a pílula "↑ Voltar ao topo" —
// que surge ao descer. As mesmas 7 abas.
describe("a pílula voltar ao topo está nas abas", () => {
  it.each(ABAS)("%s mostra a pílula e liga a rolagem nela", (arquivo) => {
    const src = fs.readFileSync(path.join(RAIZ, arquivo), "utf8");
    expect(src).toContain("usePilulaTopo(rolagemRef)");
    expect(src).toMatch(/<PilulaVoltarAoTopo[^>]*visivel=\{pilula\.visivel\}/);
    // Direto, ou por um handler que tambem chama a pilula (o Seu dia pede a
    // proxima pagina do historico na mesma rolagem — historico-paginado).
    expect(src).toMatch(/onScroll=\{pilula\.onScroll\}|pilula\.onScroll\(e\)/);
  });
});

