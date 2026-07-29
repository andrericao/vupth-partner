import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { BenchIcon } from "../BenchIcon";

// SVG puro (sem logica): o teste garante que renderiza com props customizadas
// e mantem o componente coberto agora que so a Fila (tela, fora do coverage)
// o usa diretamente.
it("renderiza o banco com tamanho/cor customizados", () => {
  const view = renderWithProvider(<BenchIcon size={30} color="#123456" />);
  expect(view.toJSON()).toBeTruthy();
});
