import { render } from "@testing-library/react-native";
import { AvisoLojaDesativada } from "../AvisoLojaDesativada";

// S42 (Andre, 08/10): "os profissionais sao informados de que a loja esta
// desativada e que nao aparecerao mais para os clientes, recomendando-os a sair".
describe("AvisoLojaDesativada", () => {
  it("so aparece com a loja DEACTIVATED", () => {
    const { toJSON } = render(<AvisoLojaDesativada status="ACTIVE" nomeDaLoja="Barbearia Ana" />);
    expect(toJSON()).toBeNull();
    const { toJSON: nulo } = render(<AvisoLojaDesativada status={null} nomeDaLoja="Barbearia Ana" />);
    expect(nulo()).toBeNull();
  });

  it("diz que a loja saiu da busca e recomenda sair", () => {
    const { getByText } = render(<AvisoLojaDesativada status="DEACTIVATED" nomeDaLoja="Barbearia Ana" />);
    expect(getByText(/Barbearia Ana foi desativada/)).toBeTruthy();
    expect(getByText(/Recomendamos que você saia/)).toBeTruthy();
  });
});
