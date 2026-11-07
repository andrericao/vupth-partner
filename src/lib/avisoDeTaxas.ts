import { api } from "@lib/api";
import { avisar } from "@lib/confirmar";

// taxas-riscadas-e-modal-unico (PAR-6; contrato BAK-10, d3d2d31): o Backend diz se as taxas valem
// para este profissional e se o modal unico deve aparecer. Sem resposta, vale como desligado.
// Nenhuma tela escreve qual chave esta ligada (Andre, 06/11).
export type AvisoDeTaxas = { mostrar: boolean; taxasAtivas: boolean };

export const CHAVE_AVISO_DE_TAXAS = ["avisoDeTaxas"];

export const TEXTO_TAXAS_ATIVAS =
  "As taxas dos relatórios serão cobradas. Elas serão descontadas a cada serviço realizado. Se receber em mãos, o valor das taxas ficam como dívida com a VUPTH.";
export const TEXTO_TAXAS_DESLIGADAS = "As taxas de serviço não serão descontadas. Isso não cria dívidas para você";

export async function buscarAvisoDeTaxas(): Promise<AvisoDeTaxas> {
  try {
    const { data } = await api.get("/professional/me/fee-notice");
    return { mostrar: data?.show === true, taxasAtivas: data?.fees_active === true };
  } catch {
    return { mostrar: false, taxasAtivas: false };
  }
}

/** Depois de um corte concluido: mostra o modal, se o Backend pedir, e marca como visto. */
export async function mostrarAvisoDeTaxas(
  deps: { buscar?: typeof buscarAvisoDeTaxas; aviso?: typeof avisar } = {}
): Promise<void> {
  const { mostrar, taxasAtivas } = await (deps.buscar ?? buscarAvisoDeTaxas)();
  if (!mostrar) return;
  await (deps.aviso ?? avisar)({
    titulo: "Taxas de serviço",
    mensagem: taxasAtivas ? TEXTO_TAXAS_ATIVAS : TEXTO_TAXAS_DESLIGADAS,
  });
  await api.post("/professional/me/fee-notice/seen").catch(() => {});
}
