import * as ImagePicker from "expo-image-picker";
import {
  mensagemDoErroDaFoto,
  escolherFoto,
  enviarFoto,
  removerFoto,
  trocarFotoDePerfil,
  rotaDaFotoDaLoja,
  editarFoto,
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

  it("escolhe sem o recorte do Android e, sem tela de ajuste, recorta o quadrado do meio", async () => {
    const p = picker({ canceled: false, assets: [{ uri: "file:///orig.jpg", width: 1200, height: 800 }] });
    await expect(escolherFoto({ picker: p as any, reduzir })).resolves.toEqual({
      uri: "file:///reduzida.jpg",
    });
    // foto-ux (Andre, 15/10): o recorte do Android so tinha icones
    expect(p.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: false }));
    expect(reduzir).toHaveBeenCalledWith("file:///orig.jpg", { originX: 200, originY: 0, width: 800, height: 800 });
  });

  it("sem o tamanho da foto: reduz sem recortar", async () => {
    const p = picker({ canceled: false, assets: [{ uri: "file:///orig.jpg" }] });
    await escolherFoto({ picker: p as any, reduzir });
    expect(reduzir).toHaveBeenCalledWith("file:///orig.jpg", undefined);
  });

  it("o 'Ajuste a foto' recebe a foto com o tamanho e o recorte dele vale", async () => {
    const p = picker({ canceled: false, assets: [{ uri: "file:///orig.jpg", width: 600, height: 900 }] });
    const recorte = { originX: 0, originY: 100, width: 600, height: 600 };
    const enquadrar = jest.fn(async () => ({ recorte }));
    await escolherFoto({ picker: p as any, reduzir, enquadrar });
    expect(enquadrar).toHaveBeenCalledWith({ uri: "file:///orig.jpg", width: 600, height: 900 });
    expect(reduzir).toHaveBeenCalledWith("file:///orig.jpg", recorte);
  });

  it("Cancelar no 'Ajuste a foto': nada sobe", async () => {
    const p = picker({ canceled: false, assets: [{ uri: "file:///orig.jpg", width: 10, height: 10 }] });
    await expect(escolherFoto({ picker: p as any, reduzir, enquadrar: async () => null })).resolves.toBeNull();
    expect(reduzir).not.toHaveBeenCalled();
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
    expect(p.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: false }));
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
  it("com recorte: corta antes de reduzir", async () => {
    const { manipulateAsync } = jest.requireMock("expo-image-manipulator");
    const picker = {
      requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
      launchImageLibraryAsync: jest.fn(async () => ({
        canceled: false,
        assets: [{ uri: "file:///o.jpg", width: 100, height: 300 }],
      })),
    };
    await escolherFoto({ picker: picker as any });
    expect(manipulateAsync).toHaveBeenLastCalledWith(
      "file:///o.jpg",
      [{ crop: { originX: 0, originY: 100, width: 100, height: 100 } }, { resize: { width: 800 } }],
      { compress: 0.8, format: "jpeg" }
    );
  });

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

// 🔴 Andre, 26/09, na web: escolheu a foto e ao salvar apareceu "sem conexao
// com o servidor". O servidor estava bem (upload testado no staging, R2 ok).
// Na web a reducao roda no navegador (canvas) e, quando falha, rejeita com um
// Event sem `message` — que caia na frase de "sem conexao".
describe("web: reducao que falha e erros sem mensagem", () => {
  it("se a reducao falhar, sobe a foto original (o backend confere o tamanho)", async () => {
    const { manipulateAsync } = jest.requireMock("expo-image-manipulator");
    manipulateAsync.mockRejectedValueOnce({ type: "error" });
    const picker = {
      requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
      launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: "blob:http://x/orig" }] })),
    };
    await expect(escolherFoto({ picker: picker as any })).resolves.toEqual({ uri: "blob:http://x/orig" });
  });

  it("erro sem resposta e sem mensagem nao vira 'sem conexao'", async () => {
    const avisar = jest.fn(async () => undefined);
    await trocarFotoDePerfil(false, {
      perguntar: async () => "galeria",
      escolher: async () => {
        throw { type: "error" };
      },
      enviar: jest.fn(),
      remover: jest.fn(),
      aoMudar: jest.fn(),
      avisar,
    });
    expect(avisar).toHaveBeenCalledWith(expect.stringMatching(/preparar a foto/));
    expect(avisar).not.toHaveBeenCalledWith(expect.stringMatching(/conex/i));
  });

  it("falha de rede de verdade (axios sem resposta) vai para a frase da API", async () => {
    const avisar = jest.fn(async () => undefined);
    await trocarFotoDePerfil(false, {
      perguntar: async () => "galeria",
      escolher: async () => ({ uri: "x" }),
      enviar: async () => {
        throw { isAxiosError: true, message: "Network Error" };
      },
      remover: jest.fn(),
      aoMudar: jest.fn(),
      avisar,
    });
    // Neste arquivo o getApiErrorMessage e mockado e devolve o fallback; no app
    // de verdade, sem resposta, ele diz "Sem conexão".
    expect(avisar).toHaveBeenCalledWith("Não foi possível salvar a foto.");
  });
});

// Foto da LOJA (Andre, 26/09): mesma mecanica, outra rota — pedida ao Backend.
describe("foto da loja", () => {
  beforeEach(() => {
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("sobe na rota da loja e aceita a resposta com url_image", async () => {
    mockPut.mockResolvedValue({ data: { url_image: "https://pub/loja.jpg" } });
    const url = await enviarFoto("file:///l.jpg", { plataforma: "android", rota: rotaDaFotoDaLoja("e1") });
    expect(mockPut.mock.calls[0][0]).toBe("/establishment/e1/photo");
    expect(url).toBe("https://pub/loja.jpg");
  });

  it("remover na rota da loja", async () => {
    mockDelete.mockResolvedValue({});
    await removerFoto(rotaDaFotoDaLoja("e1"));
    expect(mockDelete).toHaveBeenCalledWith("/establishment/e1/photo");
  });

  it("enquanto o servidor nao tem a rota (404/405): frase clara", () => {
    expect(mensagemDoErroDaFoto({ response: { status: 404 } })).toMatch(/ainda não pode ser enviada/);
    expect(mensagemDoErroDaFoto({ response: { status: 405 } })).toMatch(/ainda não pode ser enviada/);
  });
});

describe("editarFoto", () => {
  it("monta a pergunta (com Remover so se ja ha foto) e usa a rota dada", async () => {
    const perguntar = jest.fn(async () => "remover" as const);
    const aoMudar = jest.fn();
    mockDelete.mockResolvedValue({});
    await editarFoto({
      temFoto: true,
      rota: "/establishment/e1/photo",
      aoMudar,
      titulo: "Foto da loja",
      perguntar,
      avisar: jest.fn(async () => undefined),
    });
    const pergunta = (perguntar.mock.calls[0] as any)[0];
    expect(pergunta.titulo).toBe("Foto da loja");
    expect(pergunta.opcoes.map((o: any) => o.valor)).toEqual(["remover", "galeria", "camera"]);
    expect(mockDelete).toHaveBeenCalledWith("/establishment/e1/photo");
    expect(aoMudar).toHaveBeenCalledWith(null);
  });

  it("sem foto: nao oferece remover; o erro vai para o aviso com o titulo", async () => {
    const perguntar = jest.fn(async () => "galeria" as const);
    const avisar = jest.fn(async () => undefined);
    jest
      .spyOn(ImagePicker, "requestMediaLibraryPermissionsAsync")
      .mockResolvedValue({ granted: false } as any);
    await editarFoto({ temFoto: false, rota: "/profile/me/photo", aoMudar: jest.fn(), perguntar, avisar });
    expect((perguntar.mock.calls[0] as any)[0].opcoes.map((o: any) => o.valor)).toEqual(["galeria", "camera"]);
    expect(avisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Foto de perfil" }));
  });

  it("passa o 'Ajuste a foto' para a escolha; Cancelar nele nao sobe nada", async () => {
    jest.spyOn(ImagePicker, "requestMediaLibraryPermissionsAsync").mockResolvedValue({ granted: true } as any);
    jest
      .spyOn(ImagePicker, "launchImageLibraryAsync")
      .mockResolvedValue({ canceled: false, assets: [{ uri: "file:///g.jpg", width: 4, height: 4 }] } as any);
    const enquadrar = jest.fn(async () => null);
    mockPut.mockReset();
    await editarFoto({
      temFoto: false,
      rota: "/profile/me/photo",
      aoMudar: jest.fn(),
      enquadrar,
      perguntar: async () => "galeria",
      avisar: jest.fn(async () => undefined),
    });
    expect(enquadrar).toHaveBeenCalledWith({ uri: "file:///g.jpg", width: 4, height: 4 });
    expect(mockPut).not.toHaveBeenCalled();
  });
});
