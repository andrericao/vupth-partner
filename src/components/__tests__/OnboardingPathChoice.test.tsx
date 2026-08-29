import { render, fireEvent } from "@testing-library/react-native";
import { OnboardingPathChoice } from "../OnboardingPathChoice";

// S23 — a porta que faltava no onboarding do profissional.
//
// Antes desta tela, quem criava o perfil de profissional caia DIRETO em
// "Buscar estabelecimento": o dono de barbearia que se identifica como
// profissional ficava preso no fluxo de afiliacao, sem nunca ser perguntado se
// queria abrir a propria loja. O backend ja aceitava os dois caminhos (auditoria
// de 27/08: `quick-create` nao barra quem e PROFESSIONAL, papeis sao
// acumulativos); faltava a pergunta.
describe("OnboardingPathChoice (S23)", () => {
  it("oferece os DOIS caminhos — e o da propria loja e o que nao existia", () => {
    const view = render(<OnboardingPathChoice onOwnShop={jest.fn()} onExistingShop={jest.fn()} />);

    expect(view.getByText("Na minha própria loja")).toBeTruthy();
    expect(view.getByText("Numa loja que já existe")).toBeTruthy();
  });

  it("escolher a propria loja chama onOwnShop", () => {
    const onOwnShop = jest.fn();
    const view = render(<OnboardingPathChoice onOwnShop={onOwnShop} onExistingShop={jest.fn()} />);

    fireEvent.press(view.getByText("Na minha própria loja"));
    expect(onOwnShop).toHaveBeenCalledTimes(1);
  });

  it("escolher loja existente chama onExistingShop", () => {
    const onExistingShop = jest.fn();
    const view = render(<OnboardingPathChoice onOwnShop={jest.fn()} onExistingShop={onExistingShop} />);

    fireEvent.press(view.getByText("Numa loja que já existe"));
    expect(onExistingShop).toHaveBeenCalledTimes(1);
  });

  it("nenhum caminho dispara sozinho ao montar", () => {
    // As duas opcoes sao legitimas e escolher por engano custa desafiliacao
    // depois — entao nao ha default nem pre-selecao.
    const onOwnShop = jest.fn();
    const onExistingShop = jest.fn();
    render(<OnboardingPathChoice onOwnShop={onOwnShop} onExistingShop={onExistingShop} />);

    expect(onOwnShop).not.toHaveBeenCalled();
    expect(onExistingShop).not.toHaveBeenCalled();
  });

  it("cada opcao explica o que acontece depois", () => {
    // Sem a explicacao, "propria loja" e "loja que existe" parecem a mesma
    // coisa para quem nunca usou o app.
    const view = render(<OnboardingPathChoice onOwnShop={jest.fn()} onExistingShop={jest.fn()} />);

    expect(view.getByText(/abre o estabelecimento/i)).toBeTruthy();
    expect(view.getByText(/dono aprova/i)).toBeTruthy();
  });
});
