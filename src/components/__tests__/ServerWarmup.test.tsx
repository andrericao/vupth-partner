import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { ServerWarmup } from "../ServerWarmup";

// Desenho do client (Pencil CLIENT · 23), escolhido pelo Andre em 16/09 para
// os dois apps: badge redondo, titulo por passo, legenda do ~50s e pontos.
describe("ServerWarmup", () => {
  it("aquecendo: titulo do passo, legenda do tempo e os pontos de progresso", () => {
    const { getByText, getByTestId } = render(<ServerWarmup />);
    expect(getByText("Abrindo o app")).toBeTruthy();
    expect(getByText(/na primeira vez pode levar até ~50s/)).toBeTruthy();
    expect(getByTestId("warmup-dots").children).toHaveLength(4);
  });

  it("falhou: explica e oferece tentar de novo", () => {
    const { getByText } = render(<ServerWarmup failed onRetry={jest.fn()} />);
    expect(getByText("Não foi possível conectar ao servidor")).toBeTruthy();
    expect(getByText("Tentar de novo")).toBeTruthy();
  });
});
