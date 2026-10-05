import { erroDoTelefoneDeContato, telefoneParaMostrar } from "../telefoneDeContato";

// telefone-de-contato (Andre, 05/10; contrato BAK 02dd5ef): opcional, so
// numero. Vazio = o cliente nao ve telefone nenhum.
describe("erroDoTelefoneDeContato", () => {
  it("vazio vale: e o jeito de nao mostrar", () => {
    expect(erroDoTelefoneDeContato("")).toBeNull();
    expect(erroDoTelefoneDeContato("   ")).toBeNull();
  });

  it("celular e fixo com DDD valem", () => {
    expect(erroDoTelefoneDeContato("(11) 98888-7777")).toBeNull();
    expect(erroDoTelefoneDeContato("(11) 3333-4444")).toBeNull();
  });

  it("sem DDD ou pela metade, pede o numero inteiro", () => {
    expect(erroDoTelefoneDeContato("(11) 9888")).toMatch(/DDD/);
    expect(erroDoTelefoneDeContato("98888-7777")).toMatch(/DDD/);
  });
});

describe("telefoneParaMostrar", () => {
  it("formata o que veio do backend e mostra traco quando nao ha", () => {
    expect(telefoneParaMostrar("11988887777")).toBe("(11) 98888-7777");
    expect(telefoneParaMostrar("(11) 98888-7777")).toBe("(11) 98888-7777");
    expect(telefoneParaMostrar(null)).toBe("—");
    expect(telefoneParaMostrar("")).toBe("—");
  });

  it("numero com +55 (gravado por outro caminho) aparece sem o 55", () => {
    expect(telefoneParaMostrar("+55 (11) 98888-7777")).toBe("(11) 98888-7777");
  });
});
