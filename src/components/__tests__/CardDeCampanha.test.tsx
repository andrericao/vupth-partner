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

  // promocoes-ativar-e-codigo (Andre, 24/10): na tela de ativar, o ticket mostra o codigo.
  it("o ticket mostra o codigo do cupom quando ele vem; sem codigo, nada", () => {
    const com = render(
      <CardDeCampanha campanha={{ type: "DISCOUNT", name: "Lancamento", value_percent: 10 }} codigo="VUPTH10" testID="c" />
    );
    expect(com.getByTestId("c-codigo").props.children).toBe("Código: VUPTH10");
    com.unmount();
    const sem = render(<CardDeCampanha campanha={{ type: "DISCOUNT", name: "Lancamento", value_percent: 10 }} testID="c" />);
    expect(sem.queryByTestId("c-codigo")).toBeNull();
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

// cards-de-promocao-iguais-ao-client (Andre, 29/10): as mesmas cores, borda e raio do CartaoTicket do
// Client — greenTint com onGreenTint, borda tracejada de 2 px, picote so na esquerda, sem hex solto.
describe("CardDeCampanha igual ao do Client", () => {
  const campanha = { type: "DISCOUNT", name: "Lancamento", value_percent: 10 } as const;
  const classes = (r: ReturnType<typeof render>) =>
    String(r.UNSAFE_root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.className === "string" && n.props.className.includes("border-dashed"))[0].props.className);

  it("fundo greenTint, borda tracejada de 2 px em onGreenTint, raio do card e padding vertical 16", () => {
    const c = classes(render(<CardDeCampanha campanha={campanha} testID="c" />));
    expect(c).toContain("bg-vupth-greenTint");
    expect(c).toContain("border-2");
    expect(c).toContain("border-dashed");
    expect(c).toContain("border-vupth-onGreenTint");
    expect(c).toContain("rounded-card");
    expect(c).toContain("py-4");
    expect(c).not.toMatch(/bg-vupth-surface|border-vupth-border|#[0-9a-fA-F]{3,6}/);
  });

  it("texto em onGreenTint (valor, nome e linha) e so um picote, na esquerda", () => {
    const r = render(<CardDeCampanha campanha={campanha} linha="ate 30/11" testID="c" />);
    expect(r.getByTestId("c-valor").props.className).toContain("text-vupth-onGreenTint");
    expect(r.getByText("Lancamento").props.className).toContain("text-vupth-onGreenTint");
    expect(r.getByText("ate 30/11").props.className).toContain("text-vupth-onGreenTint");
    const picotes = r.UNSAFE_root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.className === "string" && n.props.className.includes("-left-2.5"));
    expect(picotes.length).toBeGreaterThan(0);
    expect(r.UNSAFE_root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.className === "string" && n.props.className.includes("-right-2.5")).length).toBe(0);
  });
});
