import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { QrDoLink } from "../QrDoLink";

// qr-da-loja-e-do-perfil (Andre, 22/10)
describe("QrDoLink", () => {
  it("o botao abre o QR do link e o Fechar esconde", () => {
    const { getByTestId, queryByTestId, getByLabelText, getByText } = renderWithProvider(
      <QrDoLink alvo="da loja" link="https://vupth.pages.dev/loja/L1" />
    );
    expect(queryByTestId("qr-do-link-codigo")).toBeNull();
    fireEvent.press(getByLabelText("QR Code da loja"));
    expect(getByTestId("qr-do-link-codigo")).toBeTruthy();
    getByText("QR Code da loja");
    fireEvent.press(getByTestId("qr-do-link-fechar"));
    expect(queryByTestId("qr-do-link-codigo")).toBeNull();
  });
});
