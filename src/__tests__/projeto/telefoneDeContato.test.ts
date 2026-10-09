import fs from "fs";
import path from "path";

// telefone-de-contato (Andre, 05/10; mockup v2 aprovado): o profissional
// preenche e edita o numero em Dados cadastrais. So para quem tem perfil
// profissional — o dono sem esse perfil nao ve o campo.
const RAIZ = path.resolve(__dirname, "../../..");
const tela = fs.readFileSync(path.join(RAIZ, "app/(professional)/settings-account.tsx"), "utf8");

describe("telefone de contato em Dados cadastrais", () => {
  it("o campo existe, opcional, com mascara e teclado de telefone", () => {
    expect(tela).toContain('label="Telefone de contato (opcional)"');
    expect(tela).toContain("maskPhone(");
    expect(tela).toContain('keyboardType="phone-pad"');
    expect(tela).toContain('testID="telefone-de-contato"');
  });

  it("salva pelo setContactPhone depois de validar", () => {
    expect(tela).toContain("erroDoTelefoneDeContato(phone)");
    expect(tela).toContain("setContactPhone(phone)");
  });

  it("fica dentro do bloco do perfil profissional", () => {
    const inicio = tela.indexOf("{temPerfilProfissional && (");
    const fim = tela.indexOf("</>", inicio);
    const campo = tela.indexOf('label="Telefone de contato (opcional)"');
    expect(inicio).toBeGreaterThan(-1);
    expect(campo).toBeGreaterThan(inicio);
    expect(campo).toBeLessThan(fim);
  });
});
