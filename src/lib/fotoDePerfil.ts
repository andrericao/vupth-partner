import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
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

async function reduzirPadrao(uri: string): Promise<{ uri: string }> {
  const r = await manipulateAsync(uri, [{ resize: { width: LADO } }], {
    compress: QUALIDADE,
    format: SaveFormat.JPEG,
  });
  return { uri: r.uri };
}

/**
 * Abre a galeria ou a camera, recorta quadrada e reduz. null = a pessoa
 * desistiu. A camera entrou no build 1.4.0 junto com a galeria (26/09): no
 * salao, tirar a foto na hora e o caminho natural.
 */
export async function escolherFoto(
  deps: {
    origem?: OrigemDaFoto;
    picker?: Picker;
    reduzir?: (uri: string) => Promise<{ uri: string }>;
  } = {}
): Promise<{ uri: string } | null> {
  const picker = deps.picker ?? ImagePicker;
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
  const opcoes = { mediaTypes: ["images" as const], allowsEditing: true, aspect: [1, 1] as [number, number], quality: 1 };
  const r = camera ? await picker.launchCameraAsync(opcoes) : await picker.launchImageLibraryAsync(opcoes);
  if (r.canceled || !r.assets?.[0]) return null;
  return reduzir(r.assets[0].uri);
}

/** Sobe a foto ja reduzida; devolve a URL publica nova. */
export async function enviarFoto(
  uri: string,
  deps: { plataforma?: typeof Platform.OS } = {}
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
  const { data } = await api.put("/profile/me/photo", corpo, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.profile_image_url;
}

export async function removerFoto(): Promise<void> {
  await api.delete("/profile/me/photo");
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
    await deps.avisar(error?.response ? mensagemDoErroDaFoto(error) : error?.message ?? mensagemDoErroDaFoto(error));
  }
}
