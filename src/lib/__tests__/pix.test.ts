import { api } from "@lib/api";
import {
  TIPOS_DE_CHAVE,
  erroDaChave,
  titularDoPix,
  normalizarChave,
  chaveParaMostrar,
  obterChavePix,
  salvarChavePix,
  apagarChavePix,
} from "@lib/pix";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

// pagamento-pix (contrato BAK 2a2b0ec): PUT/GET/DELETE /professional/me/pix.
// Andre, 10/10: recomendar aleatoria, telefone ou e-mail; nao exibir CPF.
describe("pix — os tipos de chave", () => {
  it("a aleatoria vem primeiro e e a recomendada; o CPF vem por ultimo, com aviso", () => {
    expect(TIPOS_DE_CHAVE[0]).toMatchObject({ tipo: "RANDOM", recomendada: true });
    const cpf = TIPOS_DE_CHAVE[TIPOS_DE_CHAVE.length - 1];
    expect(cpf.tipo).toBe("CPF");
    expect(cpf.aviso).toMatch(/CPF/);
    expect(TIPOS_DE_CHAVE.map((t) => t.tipo)).toEqual(["RANDOM", "PHONE", "EMAIL", "CNPJ", "CPF"]);
  });
});

describe("pix — validar a chave", () => {
  it("aleatoria: o UUID do banco", () => {
    expect(erroDaChave("RANDOM", "123e4567-e89b-12d3-a456-426614174000")).toBeNull();
    expect(erroDaChave("RANDOM", "abc")).toMatch(/aleatória/);
  });

  it("telefone: com DDD (10 ou 11 digitos), com ou sem +55", () => {
    expect(erroDaChave("PHONE", "(11) 98888-7777")).toBeNull();
    expect(erroDaChave("PHONE", "+55 11 98888-7777")).toBeNull();
    expect(erroDaChave("PHONE", "98888-7777")).toMatch(/DDD/);
  });

  it("e-mail", () => {
    expect(erroDaChave("EMAIL", "ana@exemplo.com")).toBeNull();
    expect(erroDaChave("EMAIL", "ana@")).toMatch(/e-mail/);
  });

  it("CPF e CNPJ com digito verificador", () => {
    expect(erroDaChave("CPF", "529.982.247-25")).toBeNull();
    expect(erroDaChave("CPF", "529.982.247-26")).toMatch(/CPF/);
    expect(erroDaChave("CPF", "111.111.111-11")).toMatch(/CPF/);
    expect(erroDaChave("CNPJ", "11.222.333/0001-81")).toBeNull();
    expect(erroDaChave("CNPJ", "11.222.333/0001-82")).toMatch(/CNPJ/);
    expect(erroDaChave("CNPJ", "00.000.000/0000-00")).toMatch(/CNPJ/);
  });

  it("digito verificador 0 (resto 10 no CPF, resto < 2 no CNPJ)", () => {
    expect(erroDaChave("CPF", "631.086.193-06")).toBeNull();
    expect(erroDaChave("CNPJ", "50.142.209/0061-07")).toBeNull();
  });

  it("vazio pede a chave", () => {
    expect(erroDaChave("EMAIL", "  ")).toMatch(/Informe/);
  });
});

// pix-sem-nome (PAR-6, Andre 15/10): o titular nao se pergunta; vai o nome
// da conta, ate 25 letras (o backend ainda o exige).
describe("pix — o titular vai sozinho", () => {
  it("o nome da conta, sem espacos sobrando, ate 25 letras", () => {
    expect(titularDoPix("  Ana   Souza ")).toBe("Ana Souza");
    expect(titularDoPix("A".repeat(30))).toHaveLength(25);
    expect(titularDoPix("Maria Aparecida da Silva Santos")).toBe("Maria Aparecida da Silva");
  });

  it("sem nome: VUPTH", () => {
    expect(titularDoPix(null)).toBe("VUPTH");
    expect(titularDoPix("  ")).toBe("VUPTH");
  });
});

describe("pix — normalizar para o backend", () => {
  it("telefone vira +55DDDNUMERO", () => {
    expect(normalizarChave("PHONE", "(11) 98888-7777")).toBe("+5511988887777");
    expect(normalizarChave("PHONE", "+55 (11) 98888-7777")).toBe("+5511988887777");
  });
  it("CPF e CNPJ so digitos; e-mail e aleatoria sem espaco e em minusculas", () => {
    expect(normalizarChave("CPF", "529.982.247-25")).toBe("52998224725");
    expect(normalizarChave("CNPJ", "11.222.333/0001-81")).toBe("11222333000181");
    expect(normalizarChave("EMAIL", " Ana@Exemplo.com ")).toBe("ana@exemplo.com");
    expect(normalizarChave("RANDOM", " 123E4567-E89B-12D3-A456-426614174000 ")).toBe(
      "123e4567-e89b-12d3-a456-426614174000"
    );
  });
});

describe("pix — mostrar a chave salva", () => {
  it("o nome do tipo e a chave legivel", () => {
    expect(chaveParaMostrar({ key_type: "PHONE", key: "+5511988887777", holder_name: "Ana" })).toBe(
      "Telefone · (11) 98888-7777"
    );
    expect(chaveParaMostrar({ key_type: "EMAIL", key: "ana@exemplo.com", holder_name: "Ana" })).toBe(
      "E-mail · ana@exemplo.com"
    );
  });

  it("tipo que o app nao conhece: mostra o codigo do tipo", () => {
    expect(chaveParaMostrar({ key_type: "EVP" as never, key: "x", holder_name: "Ana" })).toBe("EVP · x");
  });
});

describe("pix — a API", () => {
  beforeEach(() => jest.resetAllMocks());

  it("obter: a chave, ou null quando ainda nao ha (404 PIX_KEY_NOT_SET)", async () => {
    const chave = { key_type: "EMAIL", key: "ana@exemplo.com", holder_name: "Ana" };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: chave });
    await expect(obterChavePix()).resolves.toEqual(chave);
    expect(api.get).toHaveBeenCalledWith("/professional/me/pix");

    (api.get as jest.Mock).mockRejectedValueOnce({ response: { status: 404, data: { code: "PIX_KEY_NOT_SET" } } });
    await expect(obterChavePix()).resolves.toBeNull();
  });

  it("obter: outro erro sobe", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({ response: { status: 500 } });
    await expect(obterChavePix()).rejects.toBeTruthy();
  });

  it("salvar manda a chave normalizada e o titular sem espacos nas pontas", async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({ data: { key_type: "PHONE", key: "+5511988887777", holder_name: "Ana" } });
    await salvarChavePix({ tipo: "PHONE", chave: "(11) 98888-7777", titular: " Ana " });
    expect(api.put).toHaveBeenCalledWith("/professional/me/pix", {
      key_type: "PHONE",
      key: "+5511988887777",
      holder_name: "Ana",
    });
  });

  it("apagar", async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({});
    await apagarChavePix();
    expect(api.delete).toHaveBeenCalledWith("/professional/me/pix");
  });
});
