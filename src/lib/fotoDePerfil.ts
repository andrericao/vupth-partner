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

type Picker = Pick<typeof ImagePicker, "requestMediaLibraryPermissionsAsync" | "launchImageLibraryAsync">;

async function reduzirPadrao(uri: string): Promise<{ uri: string }> {
  const r = await manipulateAsync(uri, [{ resize: { width: LADO } }], {
    compress: QUALIDADE,
    format: SaveFormat.JPEG,
  });
  return { uri: r.uri };
}

/** Abre a galeria, recorta quadrada e reduz. null = a pessoa desistiu. */
export async function escolherFoto(
  deps: { picker?: Picker; reduzir?: (uri: string) => Promise<{ uri: string }> } = {}
): Promise<{ uri: string } | null> {
  const picker = deps.picker ?? ImagePicker;
  const reduzir = deps.reduzir ?? reduzirPadrao;

  const permissao = await picker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    throw new Error("Permita o acesso à galeria para escolher a foto.");
  }
  const r = await picker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
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
 * O toque na foto do Perfil. Sem foto, vai direto a galeria; com foto,
 * pergunta (escolher outra / remover). Erros viram UMA frase — inclusive o 503
 * de storage ainda nao configurado, que nao e culpa de quem tocou.
 */
export async function trocarFotoDePerfil(
  temFoto: boolean,
  deps: {
    perguntar: () => Promise<"escolher" | "remover" | null>;
    escolher: () => Promise<{ uri: string } | null>;
    enviar: (uri: string) => Promise<string>;
    remover: () => Promise<void>;
    aoMudar: (uri: string | null) => void;
    avisar: (mensagem: string) => Promise<void>;
  }
): Promise<void> {
  try {
    const acao = temFoto ? await deps.perguntar() : "escolher";
    if (acao === "remover") {
      await deps.remover();
      deps.aoMudar(null);
      return;
    }
    if (acao !== "escolher") return;
    const foto = await deps.escolher();
    if (!foto) return;
    deps.aoMudar(await deps.enviar(foto.uri));
  } catch (error: any) {
    await deps.avisar(error?.response ? mensagemDoErroDaFoto(error) : error?.message ?? mensagemDoErroDaFoto(error));
  }
}
