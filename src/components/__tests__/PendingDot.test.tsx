import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { PendingDot } from "../PendingDot";

describe("PendingDot", () => {
  it("renderiza o indicador com label de acessibilidade", () => {
    const { getByLabelText } = renderWithProvider(<PendingDot />);
    expect(getByLabelText("Pendencias no cadastro")).toBeTruthy();
  });
});
