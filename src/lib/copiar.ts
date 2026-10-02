import { carregarClipboard } from "@lib/modulosNativos";
import { avisar } from "@lib/confirmar";

/**
 * Copia para a area de transferencia e diz o que foi copiado. Se o aparelho
 * recusar, mostra o texto para copiar a mao — nunca some calado.
 */
export async function copiarComAviso(texto: string, oQue: string): Promise<void> {
  try {
    // Carregado na hora: sem o modulo no binario, cai no "copie a mao".
    const Clipboard = carregarClipboard();
    if (!Clipboard) throw new Error("sem modulo");
    await Clipboard.setStringAsync(texto);
    await avisar({ titulo: `${oQue} copiado`, mensagem: texto });
  } catch {
    await avisar({ titulo: "Não deu para copiar", mensagem: `Copie à mão: ${texto}` });
  }
}
