import {
  mensagemDoErroDaFoto,
  escolherFoto,
  enviarFoto,
  removerFoto,
  trocarFotoDePerfil,
} from "@lib/fotoDePerfil";

// Foto de perfil (S22). Contrato do backend (46f1f74, em staging 25/09):
//   PUT /profile/me/photo (multipart, campo "file") -> { profile_image_url }
//   DELETE /profile/me/photo -> 204
//   JPEG/PNG/WebP ate 2 MB, conferidos pelos bytes -> 400 INVALID_PROFILE_PHOTO
//   storage (R2) nao configurado -> 503 STORAGE_NOT_CONFIGURED: "indisponivel
//   no momento", nao erro do usuario.
// O backend pede reduzir no aparelho antes (800 px, qualidade 0.8).

const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock("@lib/api", () => ({
  api: {
    put: (...a: unknown[]) => mockPut(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
  getApiErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

describe("mensagemDoErroDaFoto", () => {
  it("503 (storage nao configurado): indisponivel no momento", () => {
    const e = { response: { status: 503, data: { code: "STORAGE_NOT_CONFIGURED" } } };
    expect(mensagemDoErroDaFoto(e)).toMatch(/indisponível no momento/);
  });

  it("400 (arquivo recusado): tipo e tamanho", () => {
    const e = { response: { status: 400, data: { code: "INVALID_PROFILE_PHOTO" } } };
    expect(mensagemDoErroDaFoto(e)).toMatch(/JPG, PNG ou WebP.*2 MB/);
  });

  it("outro erro: a mensagem padrao", () => {
    expect(mensagemDoErroDaFoto({})).toMatch(/Não foi possível/);
  });
});

describe("escolherFoto", () => {
  const picker = (resultado: any, permitido = true) => ({
    requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: permitido })),
    launchImageLibraryAsync: jest.fn(async () => resultado),
  });
  const reduzir = jest.fn(async () => ({ uri: "file:///reduzida.jpg" }));

  beforeEach(() => reduzir.mockClear());

  it("escolhe, recorta quadrada e reduz para 800 px / 0.8", async () => {
    const p = picker({ canceled: false, assets: [{ uri: "file:///orig.jpg" }] });
    await expect(escolherFoto({ picker: p as any, reduzir })).resolves.toEqual({
      uri: "file:///reduzida.jpg",
    });
    expect(p.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: true, aspect: [1, 1] })
    );
    expect(reduzir).toHaveBeenCalledWith("file:///orig.jpg");
  });

  it("cancelou: nada", async () => {
    const p = picker({ canceled: true, assets: null });
    await expect(escolherFoto({ picker: p as any, reduzir })).resolves.toBeNull();
    expect(reduzir).not.toHaveBeenCalled();
  });

  it("sem permissao da galeria: avisa com o motivo", async () => {
    const p = picker({ canceled: false }, false);
    await expect(escolherFoto({ picker: p as any, reduzir })).rejects.toThrow(/galeria/);
  });
});

describe("enviarFoto / removerFoto", () => {
  beforeEach(() => {
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("envia multipart no campo 'file' e devolve a URL nova", async () => {
    mockPut.mockResolvedValue({ data: { profile_image_url: "https://pub.r2.dev/profile/a.jpg" } });
    const url = await enviarFoto("file:///reduzida.jpg", { plataforma: "android" });
    expect(url).toBe("https://pub.r2.dev/profile/a.jpg");
    const [rota, corpo, config] = mockPut.mock.calls[0];
    expect(rota).toBe("/profile/me/photo");
    expect(corpo).toBeInstanceOf(FormData);
    expect(config.headers["Content-Type"]).toBe("multipart/form-data");
  });

  it("remover chama o DELETE", async () => {
    mockDelete.mockResolvedValue({ status: 204 });
    await removerFoto();
    expect(mockDelete).toHaveBeenCalledWith("/profile/me/photo");
  });
});

describe("trocarFotoDePerfil", () => {
  const base = () => ({
    perguntar: jest.fn(async (_t: boolean) => "galeria" as any),
    escolher: jest.fn(async (_o: string) => ({ uri: "file:///r.jpg" }) as any),
    enviar: jest.fn(async () => "https://pub/r.jpg"),
    remover: jest.fn(async () => undefined),
    aoMudar: jest.fn(),
    avisar: jest.fn(async () => undefined),
  });

  it("pergunta de onde vem (sabendo se ja ha foto) e sobe a escolhida", async () => {
    const d = base();
    d.perguntar.mockResolvedValue("camera");
    await trocarFotoDePerfil(false, d);
    expect(d.perguntar).toHaveBeenCalledWith(false);
    expect(d.escolher).toHaveBeenCalledWith("camera");
    expect(d.aoMudar).toHaveBeenCalledWith("https://pub/r.jpg");
  });

  it("remover apaga e limpa", async () => {
    const d = base();
    d.perguntar.mockResolvedValue("remover");
    await trocarFotoDePerfil(true, d);
    expect(d.remover).toHaveBeenCalled();
    expect(d.aoMudar).toHaveBeenCalledWith(null);
  });

  it("cancelou a pergunta: nada", async () => {
    const d = base();
    d.perguntar.mockResolvedValue(null);
    await trocarFotoDePerfil(true, d);
    expect(d.escolher).not.toHaveBeenCalled();
    expect(d.remover).not.toHaveBeenCalled();
  });

  it("desistiu na galeria/camera: nada sobe", async () => {
    const d = base();
    d.escolher.mockResolvedValue(null);
    await trocarFotoDePerfil(false, d);
    expect(d.enviar).not.toHaveBeenCalled();
  });

  it("erro (ex.: 503 do storage): avisa com a frase certa e nao muda a foto", async () => {
    const d = base();
    d.enviar.mockRejectedValue({ response: { status: 503 } });
    await trocarFotoDePerfil(false, d);
    expect(d.aoMudar).not.toHaveBeenCalled();
    expect(d.avisar).toHaveBeenCalledWith(expect.stringMatching(/indisponível/));
  });

  it("sem permissao: avisa o motivo", async () => {
    const d = base();
    d.escolher.mockRejectedValue(new Error("Permita o acesso à câmera para tirar a foto."));
    await trocarFotoDePerfil(false, d);
    expect(d.avisar).toHaveBeenCalledWith(expect.stringMatching(/câmera/));
  });
});

describe("escolherFoto pela camera", () => {
  const camera = (resultado: any, permitido = true) => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(async () => ({ granted: permitido })),
    launchCameraAsync: jest.fn(async () => resultado),
  });
  const reduzir = jest.fn(async () => ({ uri: "file:///r.jpg" }));

  it("pede a permissao da camera, tira, recorta e reduz", async () => {
    const p = camera({ canceled: false, assets: [{ uri: "file:///c.jpg" }] });
    await expect(escolherFoto({ origem: "camera", picker: p as any, reduzir })).resolves.toEqual({ uri: "file:///r.jpg" });
    expect(p.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true, aspect: [1, 1] }));
    expect(p.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("sem permissao da camera: o motivo certo", async () => {
    const p = camera({}, false);
    await expect(escolherFoto({ origem: "camera", picker: p as any, reduzir })).rejects.toThrow(/câmera/);
  });
});

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(async () => ({ uri: "file:///800.jpg" })),
  SaveFormat: { JPEG: "jpeg" },
}));

describe("reducao padrao e envio na web", () => {
  it("sem reduzir injetado: 800 px de largura, JPEG a 0.8", async () => {
    const { manipulateAsync } = jest.requireMock("expo-image-manipulator");
    const picker = {
      requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
      launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: "file:///o.jpg" }] })),
    };
    await expect(escolherFoto({ picker: picker as any })).resolves.toEqual({ uri: "file:///800.jpg" });
    expect(manipulateAsync).toHaveBeenCalledWith("file:///o.jpg", [{ resize: { width: 800 } }], {
      compress: 0.8,
      format: "jpeg",
    });
  });

  it("na web o arquivo vai como blob", async () => {
    const blob = new Blob(["x"], { type: "image/jpeg" });
    const fetchOriginal = global.fetch;
    global.fetch = jest.fn(async () => ({ blob: async () => blob })) as any;
    mockPut.mockResolvedValue({ data: { profile_image_url: "https://pub/w.jpg" } });
    try {
      await expect(enviarFoto("blob:http://x/1", { plataforma: "web" })).resolves.toBe("https://pub/w.jpg");
      expect(global.fetch).toHaveBeenCalledWith("blob:http://x/1");
    } finally {
      global.fetch = fetchOriginal;
    }
  });
});
