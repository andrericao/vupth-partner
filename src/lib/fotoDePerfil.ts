import { Platform } from "react-native";
import type * as ImagePicker from "expo-image-picker";
import { carregarImagePicker, carregarImageManipulator, SEM_MODULO } from "@lib/modulosNativos";
import { api, getApiErrorMessage } from "@lib/api";

// Foto de perfil (S22). O backend recebe o arquivo e guarda no Cloudflare R2
// (contrato em 46f1f74): o app nunca conhece credencial do storage.

const LADO = 800;
const QUALIDADE = 0.8;

export function mensagemDoErroDaFoto(error: any): string {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  if (status === 503 || code === "STORAGE_NOT_CONFIGURED") {
    return "O envio de foto está indisponível no momento. Tente de novo mais tarde.";
  }
  if (status === 404 || status === 405) {
    return "A foto ainda não pode ser enviada. Tente de novo mais tarde.";
  }
  if (code === "INVALID_PROFILE_PHOTO") {
    return "Use uma foto JPG, PNG ou WebP de até 2 MB.";
  }
  return getApiErrorMessage(error, "Não foi possível salvar a foto.");
}

type Picker = Pick<
  typeof ImagePicker,
  | "requestMediaLibraryPermissionsAsync"
  | "launchImageLibraryAsync"
  | "requestCameraPermissionsAsync"
  | "launchCameraAsync"
>;

export type OrigemDaFoto = "galeria" | "camera";

/** A foto saida da galeria/camera, com o tamanho original (quando o sistema diz). */
export type FotoEscolhida = { uri: string; width?: number; height?: number };
/** O quadrado escolhido no "Ajuste a foto", em pixels da original. */
export type Recorte = { originX: number; originY: number; width: number; height: number };
/** Mostra o "Ajuste a foto": null = Cancelar; { recorte } = Usar foto. */
export type Enquadrar = (foto: FotoEscolhida) => Promise<{ recorte?: Recorte } | null>;

async function reduzirPadrao(uri: string, recorte?: Recorte): Promise<{ uri: string }> {
  try {
    const M = carregarImageManipulator();
    if (!M) return { uri }; // binario sem o modulo: sobe a original
    const acoes = [...(recorte ? [{ crop: recorte }] : []), { resize: { width: LADO } }];
    const r = await M.manipulateAsync(uri, acoes, {
      compress: QUALIDADE,
      format: M.SaveFormat.JPEG,
    });
    return { uri: r.uri };
  } catch {
    // Na web a reducao roda num canvas do navegador e pode falhar (Andre,
    // 26/09). Sobe a original: se passar de 2 MB, o backend diz com clareza.
    return { uri };
  }
}

/**
 * Abre a galeria ou a camera, mostra o "Ajuste a foto" (enquadrar), recorta
 * quadrada e reduz. null = a pessoa desistiu. A camera entrou no build 1.4.0
 * junto com a galeria (26/09): no salao, tirar a foto na hora e o caminho
 * natural. foto-ux (Andre, 15/10): o recorte do Android (allowsEditing) saiu —
 * so icones, "os botoes nao sao claros"; o recorte e o nosso, com texto.
 */
export async function escolherFoto(
  deps: {
    origem?: OrigemDaFoto;
    picker?: Picker;
    reduzir?: (uri: string, recorte?: Recorte) => Promise<{ uri: string }>;
    enquadrar?: Enquadrar;
  } = {}
): Promise<{ uri: string } | null> {
  const picker = deps.picker ?? carregarImagePicker();
  if (!picker) throw new Error(SEM_MODULO);
  const reduzir = deps.reduzir ?? reduzirPadrao;
  const camera = deps.origem === "camera";

  const permissao = camera
    ? await picker.requestCameraPermissionsAsync()
    : await picker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    throw new Error(
      camera
        ? "Permita o acesso à câmera para tirar a foto."
        : "Permita o acesso à galeria para escolher a foto."
    );
  }
  const opcoes = { mediaTypes: ["images" as const], allowsEditing: false, quality: 1 };
  const r = camera ? await picker.launchCameraAsync(opcoes) : await picker.launchImageLibraryAsync(opcoes);
  const asset = r.canceled ? undefined : r.assets?.[0];
  if (!asset) return null;
  const foto: FotoEscolhida = { uri: asset.uri, width: asset.width, height: asset.height };
  const enquadrado = deps.enquadrar ? await deps.enquadrar(foto) : { recorte: recorteDoCentro(foto) };
  if (!enquadrado) return null;
  return reduzir(asset.uri, enquadrado.recorte);
}

/** Sem a tela de ajuste: o quadrado do meio (sem tamanho conhecido, nada). */
export function recorteDoCentro(foto: FotoEscolhida): Recorte | undefined {
  if (!foto.width || !foto.height) return undefined;
  const lado = Math.min(foto.width, foto.height);
  return {
    originX: Math.round((foto.width - lado) / 2),
    originY: Math.round((foto.height - lado) / 2),
    width: lado,
    height: lado,
  };
}

/** Sobe a foto ja reduzida; devolve a URL publica nova. */
export async function enviarFoto(
  uri: string,
  deps: { plataforma?: typeof Platform.OS; rota?: string } = {}
): Promise<string> {
  const plataforma = deps.plataforma ?? Platform.OS;
  const corpo = new FormData();
  if (plataforma === "web") {
    // Na web a uri e um blob: do navegador; o FormData precisa do arquivo.
    const blob = await (await fetch(uri)).blob();
    corpo.append("file", blob, "foto.jpg");
  } else {
    corpo.append("file", { uri, name: "foto.jpg", type: "image/jpeg" } as any);
  }
  const { data } = await api.put(deps.rota ?? ROTA_DO_PERFIL, corpo, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.profile_image_url ?? data.url_image;
}

export async function removerFoto(rota: string = ROTA_DO_PERFIL): Promise<void> {
  await api.delete(rota);
}

/** Foto do profissional/usuario (contrato 46f1f74). */
export const ROTA_DO_PERFIL = "/profile/me/photo";

/**
 * Foto da LOJA (pedido do Andre, 26/09). A rota foi pedida ao Backend no mesmo
 * formato da do perfil; ate existir, o 404/405 vira "ainda nao disponivel".
 */
export const rotaDaFotoDaLoja = (establishmentId: string) => `/establishment/${establishmentId}/photo`;

/**
 * Resposta do servidor -> a frase do contrato; falha de rede (axios sem
 * resposta) -> "sem conexao"; erro nosso com mensagem (permissao) -> ela; e o
 * resto (ex.: o Event sem mensagem que a web devolve) -> "preparar a foto".
 */
function fraseDoErro(error: any): string {
  if (error?.response || error?.isAxiosError) return mensagemDoErroDaFoto(error);
  if (typeof error?.message === "string" && error.message) return error.message;
  return "Não foi possível preparar a foto. Tente outra imagem.";
}

/**
 * O toque na foto do Perfil: pergunta de onde vem a foto (camera ou galeria) e,
 * se ja ha uma, oferece remover. Erros viram UMA frase — inclusive o 503 de
 * storage ainda nao configurado, que nao e culpa de quem tocou.
 */
export async function trocarFotoDePerfil(
  temFoto: boolean,
  deps: {
    perguntar: (temFoto: boolean) => Promise<OrigemDaFoto | "remover" | null>;
    escolher: (origem: OrigemDaFoto) => Promise<{ uri: string } | null>;
    enviar: (uri: string) => Promise<string>;
    remover: () => Promise<void>;
    aoMudar: (uri: string | null) => void;
    avisar: (mensagem: string) => Promise<void>;
  }
): Promise<void> {
  try {
    const acao = await deps.perguntar(temFoto);
    if (!acao) return;
    if (acao === "remover") {
      await deps.remover();
      deps.aoMudar(null);
      return;
    }
    const foto = await deps.escolher(acao);
    if (!foto) return;
    deps.aoMudar(await deps.enviar(foto.uri));
  } catch (error: any) {
    await deps.avisar(fraseDoErro(error));
  }
}

/**
 * O toque na foto com as caixas do app: pergunta a origem (camera/galeria, e
 * remover se ja ha foto), sobe na `rota` e avisa o erro. Usado na foto do
 * perfil (Dados cadastrais) e na da loja (Dados do estabelecimento).
 */
export function editarFoto(a: {
  temFoto: boolean;
  rota: string;
  aoMudar: (uri: string | null) => void;
  titulo?: string;
  enquadrar?: Enquadrar;
  perguntar: (texto: {
    titulo: string;
    mensagem: string;
    opcoes: { texto: string; valor: OrigemDaFoto | "remover"; destrutivo?: boolean }[];
  }) => Promise<OrigemDaFoto | "remover" | null>;
  avisar: (texto: { titulo: string; mensagem: string }) => Promise<void>;
}): Promise<void> {
  const titulo = a.titulo ?? "Foto de perfil";
  return trocarFotoDePerfil(a.temFoto, {
    perguntar: (temFoto) =>
      a.perguntar({
        titulo,
        mensagem: "O cliente vê esta foto no app.",
        opcoes: [
          ...(temFoto ? [{ texto: "Remover foto", valor: "remover" as const, destrutivo: true }] : []),
          { texto: "Escolher da galeria", valor: "galeria" as const },
          { texto: "Tirar foto", valor: "camera" as const },
        ],
      }),
    escolher: (origem) => escolherFoto({ origem, enquadrar: a.enquadrar }),
    enviar: (uri) => enviarFoto(uri, { rota: a.rota }),
    remover: () => removerFoto(a.rota),
    aoMudar: a.aoMudar,
    avisar: (mensagem) => a.avisar({ titulo, mensagem }),
  });
}
