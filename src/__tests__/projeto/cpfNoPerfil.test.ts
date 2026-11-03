import fs from "fs";
import path from "path";

// campo-cpf-no-perfil (DEC-164): o campo mora em Dados cadastrais, so para quem tem perfil profissional.
const RAIZ = path.resolve(__dirname, "../../..");
const tela = fs.readFileSync(path.join(RAIZ, "app/(professional)/settings-account.tsx"), "utf8");

describe("CPF em Dados cadastrais", () => {
  it("opcional, com mascara, teclado numerico e o texto do aviso", () => {
    expect(tela).toContain('label="CPF (opcional)"');
    expect(tela).toContain("maskCPF(");
    expect(tela).toContain('keyboardType="number-pad"');
    expect(tela).toContain('testID="cpf-do-profissional"');
    expect(tela).toContain("O CPF será pedido quando o app passar a cobrar taxas");
  });

  it("valida antes de salvar e salva por setCpf", () => {
    expect(tela).toContain("erroDoCpf(cpf)");
    expect(tela).toContain("setCpf(cpf)");
  });

  it("fica dentro do bloco do perfil profissional", () => {
    const inicio = tela.indexOf("{temPerfilProfissional && (");
    const fim = tela.indexOf("</>", inicio);
    const campo = tela.indexOf('label="CPF (opcional)"');
    expect(campo).toBeGreaterThan(inicio);
    expect(campo).toBeLessThan(fim);
  });

  it("o CPF nunca vai a console nem a Sentry", () => {
    expect(tela).not.toMatch(/console\.\w+\([^)]*cpf/i);
    expect(tela).not.toMatch(/Sentry[^;]*cpf/i);
  });
});
