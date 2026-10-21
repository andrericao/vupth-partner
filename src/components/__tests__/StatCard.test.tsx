import { render } from "@testing-library/react-native";
import { StatCard } from "../brand/StatCard";

// Migração NativeWind, lote de 19/09. O que este card promete é uma decisão só:
// ele é o herói da seção ou não. `hero` = o único verde-marca da tela — quando
// tudo é verde, nada é. A API continua pobre de propósito: foi por um `color`
// cru que um azul que não existe na marca entrou no relatório do dono.
describe("StatCard", () => {
  it("mostra o número e o rótulo", () => {
    const { getByText } = render(<StatCard label="Na fila" value="7" />);
    expect(getByText("7")).toBeTruthy();
    expect(getByText("Na fila")).toBeTruthy();
  });

  it("comum: fundo de superfície e rótulo em texto secundário", () => {
    const { getByTestId, getByText } = render(<StatCard label="Na fila" value="0" />);
    expect(getByTestId("stat-card").props.className).toContain("bg-vupth-surface");
    expect(getByText("Na fila").props.className).toContain("text-vupth-textSecondary");
  });

  it("herói: fundo verde-marca, e o rótulo passa a onGreen (forest no claro) para contrastar", () => {
    const { getByTestId, getByText } = render(<StatCard label="Na fila" value="7" hero />);
    expect(getByTestId("stat-card").props.className).toContain("bg-vupth-green");
    expect(getByText("Na fila").props.className).toContain("text-vupth-onGreen");
  });

  it("o número usa a fonte de display da marca", () => {
    const { getByText } = render(<StatCard label="x" value="12" />);
    expect(getByText("12").props.className).toContain("font-display");
  });
});
