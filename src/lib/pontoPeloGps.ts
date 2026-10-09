import * as SecureStore from "expo-secure-store";

// ponto-da-loja-pelo-gps (Andre, 05/10): o Endereco oferece marcar o ponto da
// loja pelo GPS ao abrir. "Uma vez marcado, nao perguntar de novo" (DEC-23): a
// marca fica no aparelho, por loja. O backend nao diz de onde veio a
// coordenada — se um dia disser, esta marca sai.
const chave = (establishmentId: string) => `ponto_gps_${establishmentId.replace(/[^A-Za-z0-9._-]/g, "")}`;

export async function pontoJaMarcado(establishmentId: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(chave(establishmentId))) === "1";
  } catch {
    return false;
  }
}

export async function marcarPonto(establishmentId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(chave(establishmentId), "1");
  } catch {
    // sem o storage, pergunta de novo na proxima vez — nada quebra
  }
}
