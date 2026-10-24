import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { CardDeCampanha } from "@components/CardDeCampanha";
import { valorDoCard } from "@lib/campanhas";

// card-ticket-pontilhado (Andre, 24/10): o ticket do Client nos dois apps.
describe("CardDeCampanha", () => {
  it("os tres tipos: desconto, sem taxa e indicacao", () => {
    expect(valorDoCard({ type: "DISCOUNT", name: "Lancamento", value_percent: 10 })).toBe("10%");
    expect(valorDoCard({ type: "DISCOUNT", name: "Lancamento", value_amount: 5 })).toBe("R$ 5,00");
    expect(valorDoCard({ type: "FEE_WAIVER", name: "Sem taxa em novembro" })).toBe("Sem taxa");
    expect(valorDoCard({ type: "REFERRAL_BONUS", name: "Indique", value_amount: 10 })).toBe("R$ 10,00");
    expect(valorDoCard({ type: "REFERRAL_BONUS", name: "Indique" })).toBe("Bônus");
    expect(valorDoCard({ type: "NOVO", name: "Outra" })).toBe("Outra");
  });

  it("mostra o valor, o nome e a linha; sem toque nao e botao", () => {
    const r = render(
      <CardDeCampanha
        campanha={{ type: "REFERRAL_BONUS", name: "Indique e ganhe", value_amount: 10 }}
        linha="R$ 10,00 por cliente indicado · até 30/11"
        testID="c"
      />
    );
    expect(r.getByTestId("c-valor").props.children).toBe("R$ 10,00");
    expect(r.getByText("Indique e ganhe")).toBeTruthy();
    expect(r.getByText("R$ 10,00 por cliente indicado · até 30/11")).toBeTruthy();
    expect(r.queryByTestId("c-estado")).toBeNull();
  });

  it("encerrada e esgotada levam o selo, em portugues", () => {
    const base = { type: "DISCOUNT", name: "Lancamento", value_percent: 10 };
    const a = render(<CardDeCampanha campanha={base} estado="ENCERRADA" testID="c" />);
    expect(a.getByText("Encerrada")).toBeTruthy();
    a.unmount();
    const b = render(<CardDeCampanha campanha={base} estado="ESGOTADA" testID="c" />);
    expect(b.getByText("Esgotada")).toBeTruthy();
  });

  it("toca quando tem acao; mostra o que vier dentro", () => {
    const onPress = jest.fn();
    const r = render(
      <CardDeCampanha campanha={{ type: "DISCOUNT", name: "X", value_percent: 5 }} onPress={onPress} testID="c">
        <Text>dentro</Text>
      </CardDeCampanha>
    );
    fireEvent.press(r.getByTestId("c"));
    expect(onPress).toHaveBeenCalled();
    expect(r.getByText("dentro")).toBeTruthy();
  });
});
