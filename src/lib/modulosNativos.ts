/* eslint-disable @typescript-eslint/no-require-imports */
// Bibliotecas NATIVAS carregadas so na hora do uso.
//
// 🔴 Andre, 27/09: rodando o app num binario anterior ao 1.4.0 (dev client
// velho), o import no topo do arquivo de "expo-clipboard" e "expo-location"
// derrubava a TELA inteira — "Cannot find native module", e Dados cadastrais e
// Dados do estabelecimento viravam "unmatched route". Uma funcao ausente nao
// pode levar a tela junto: carregando aqui, a tela abre e so a funcao avisa.
//
// `null` = o binario instalado nao tem o modulo (precisa do build 1.4.0+).

type Clipboard = typeof import("expo-clipboard");
type Location = typeof import("expo-location");
type ImagePicker = typeof import("expo-image-picker");
type ImageManipulator = typeof import("expo-image-manipulator");
type ExpoImage = typeof import("expo-image");

function tentar<T>(carregar: () => T): T | null {
  try {
    return carregar();
  } catch {
    return null;
  }
}

export const carregarClipboard = (): Clipboard | null => tentar(() => require("expo-clipboard"));
export const carregarLocation = (): Location | null => tentar(() => require("expo-location"));
export const carregarImagePicker = (): ImagePicker | null => tentar(() => require("expo-image-picker"));
export const carregarImageManipulator = (): ImageManipulator | null =>
  tentar(() => require("expo-image-manipulator"));

// expo-image (melhoria de 02/10): o require do JS pode passar num binario sem o
// ExpoImage e a falha so aparecer ao desenhar. Pergunta-se ao expo-modules-core
// antes — ausente, null, e a FotoRemota cai no Image do RN (sem cache em disco).
export const carregarExpoImage = (): ExpoImage | null =>
  tentar(() => {
    const { requireOptionalNativeModule } = require("expo-modules-core");
    return requireOptionalNativeModule("ExpoImage") ? require("expo-image") : null;
  });

/** A frase quando o aparelho ainda nao tem o modulo. */
export const SEM_MODULO = "Esta função precisa da versão nova do app. Atualize o app para usá-la.";
