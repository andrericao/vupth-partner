import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { SecaoRecolhivel } from "@components/SecaoRecolhivel";
import { NaoRealizadosCard } from "@components/NaoRealizadosCard";

// relatorios-com-dropdown (Andre, 22/10)
describe("SecaoRecolhivel", () => {
  it("vem recolhida e abre e fecha no toque do titulo", () => {
    const { getByTestId, queryByText } = render(
      <SecaoRecolhivel testID="sec" titulo="A conta do período">
        <Text>conteudo</Text>
      </SecaoRecolhivel>,
    );
    expect(queryByText("conteudo")).toBeNull();
    fireEvent.press(getByTestId("sec-titulo"));
    expect(queryByText("conteudo")).not.toBeNull();
    fireEvent.press(getByTestId("sec-titulo"));
    expect(queryByText("conteudo")).toBeNull();
  });

  it("pode comecar aberta", () => {
    const { queryByText } = render(
      <SecaoRecolhivel titulo="T" inicialmenteAberta>
        <Text>conteudo</Text>
      </SecaoRecolhivel>,
    );
    expect(queryByText("conteudo")).not.toBeNull();
  });
});

describe("NaoRealizadosCard", () => {
  it("recolhido por padrao: so o titulo; aberto mostra o motivo e o atraso", () => {
    const { getByTestId, queryByText } = render(
      <NaoRealizadosCard
        naoRealizados={{ client_cancelled: 2, professional_removed: 1, removed_for_lateness: 0 }}
        concluidosComAtraso={3}
      />,
    );
    expect(queryByText("Não realizados")).not.toBeNull();
    expect(queryByText("Profissional removeu o cliente")).toBeNull();
    fireEvent.press(getByTestId("nao-realizados-por-motivo-titulo"));
    expect(queryByText("Profissional removeu o cliente")).not.toBeNull();
    expect(queryByText("3 concluídos com atraso do cliente")).not.toBeNull();
  });

  it("nada a mostrar: nao aparece", () => {
    const { queryByTestId } = render(<NaoRealizadosCard naoRealizados={null} concluidosComAtraso={0} />);
    expect(queryByTestId("nao-realizados-por-motivo")).toBeNull();
  });
});
