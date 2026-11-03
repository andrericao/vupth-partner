import { cpfParaMostrar, cpfValido, erroDoCpf } from "../cpf";
import { maskCPF } from "../masks";

describe("cpf (campo-cpf-no-perfil, DEC-164)", () => {
  it("valida os digitos verificadores, com ou sem mascara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("123")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });

  it("vazio vale (opcional, apaga); invalido da erro curto sem eco do numero", () => {
    expect(erroDoCpf("")).toBeNull();
    expect(erroDoCpf("  ")).toBeNull();
    expect(erroDoCpf("529.982.247-25")).toBeNull();
    const erro = erroDoCpf("529.982.247-26");
    expect(erro).toMatch(/inválido/);
    expect(erro).not.toContain("529");
  });

  it("mostra o CPF mascarado do Backend ou o travessao", () => {
    expect(cpfParaMostrar("***.982.247-**")).toBe("***.982.247-**");
    expect(cpfParaMostrar(null)).toBe("—");
    expect(cpfParaMostrar(undefined)).toBe("—");
    expect(cpfParaMostrar("  ")).toBe("—");
  });

  it("maskCPF formata enquanto digita", () => {
    expect(maskCPF("")).toBe("");
    expect(maskCPF("529")).toBe("529");
    expect(maskCPF("5299")).toBe("529.9");
    expect(maskCPF("529982")).toBe("529.982");
    expect(maskCPF("5299822")).toBe("529.982.2");
    expect(maskCPF("529982247")).toBe("529.982.247");
    expect(maskCPF("5299822472")).toBe("529.982.247-2");
    expect(maskCPF("52998224725999")).toBe("529.982.247-25");
  });
});
