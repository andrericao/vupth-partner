import { avisar } from "@lib/confirmar";
import { compartilharLink } from "@lib/linkPublico";

/** Compartilha e, quando o sistema nao abriu a propria folha, diz o que houve. */
export async function compartilharComAviso(
  link: string,
  texto: { titulo: string; mensagem: string }
): Promise<void> {
  const r = await compartilharLink(link, texto);
  if (r === "copiado") {
    await avisar({ titulo: "Link copiado", mensagem: `Cole onde quiser: ${link}` });
  } else if (r === "falhou") {
    await avisar({ titulo: "Seu link", mensagem: `Copie e envie: ${link}` });
  }
}
