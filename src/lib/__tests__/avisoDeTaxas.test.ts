import { api } from "@lib/api";
import {
  buscarAvisoDeTaxas,
  mostrarAvisoDeTaxas,
  TEXTO_TAXAS_ATIVAS,
  TEXTO_TAXAS_DESLIGADAS,
} from "../avisoDeTaxas";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

describe("avisoDeTaxas (PAR-6, BAK-10)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    post.mockResolvedValue({});
  });

  it("le o show e o fees_active", async () => {
    get.mockResolvedValue({ data: { show: true, fees_active: true } });
    await expect(buscarAvisoDeTaxas()).resolves.toEqual({ mostrar: true, taxasAtivas: true });
    expect(get).toHaveBeenCalledWith("/professional/me/fee-notice");
  });

  it("sem resposta vale como desligado", async () => {
    get.mockRejectedValue(new Error("rede"));
    await expect(buscarAvisoDeTaxas()).resolves.toEqual({ mostrar: false, taxasAtivas: false });
  });

  it("sem show nao abre o modal nem marca visto", async () => {
    const aviso = jest.fn();
    await mostrarAvisoDeTaxas({ buscar: async () => ({ mostrar: false, taxasAtivas: true }), aviso });
    expect(aviso).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("chave ligada: texto da cobranca, e marca visto depois do OK", async () => {
    const aviso = jest.fn().mockResolvedValue(undefined);
    await mostrarAvisoDeTaxas({ buscar: async () => ({ mostrar: true, taxasAtivas: true }), aviso });
    expect(aviso.mock.calls[0][0].mensagem).toBe(TEXTO_TAXAS_ATIVAS);
    expect(post).toHaveBeenCalledWith("/professional/me/fee-notice/seen");
  });

  it("chave desligada: texto sem cobranca; falha ao marcar nao quebra o fluxo", async () => {
    post.mockRejectedValue(new Error("rede"));
    const aviso = jest.fn().mockResolvedValue(undefined);
    await expect(
      mostrarAvisoDeTaxas({ buscar: async () => ({ mostrar: true, taxasAtivas: false }), aviso })
    ).resolves.toBeUndefined();
    expect(aviso.mock.calls[0][0].mensagem).toBe(TEXTO_TAXAS_DESLIGADAS);
  });
});
