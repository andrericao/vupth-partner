import { api } from "@lib/api";
import { acaoDoPush } from "@lib/push";

// push-acoes-por-pergunta: o que "Aceitar" e "Recusar" no push chamam. Sao os
// mesmos endpoints da tela: o pedido de corte (PATCH .../cut-requests/{id}) e o
// convite de dono (POST /ownership-transfers/{id}) e o "ja paguei" do cliente
// (POST /attendances/{id}/payment/confirm|refuse). Resolve em segundo plano, sem
// abrir o app. Devolve false quando o push nao traz o id (nada a decidir) ou a
// chamada falha — quem chama entao abre a tela, onde o profissional decide.
export async function decidirPeloPush(data: any, decisao: "aceitar" | "recusar"): Promise<boolean> {
  const type = data?.type;
  const verbo = decisao === "aceitar" ? "accept" : "refuse";
  try {
    if (type === "CUT_REQUESTED" && typeof data?.cutRequestId === "string" && data.cutRequestId) {
      await api.patch(`/attendances/cut-requests/${data.cutRequestId}/${verbo}`);
      return true;
    }
    if (type === "PAYMENT_CLAIMED" && typeof data?.attendanceId === "string" && data.attendanceId) {
      await api.post(`/attendances/${data.attendanceId}/payment/${decisao === "aceitar" ? "confirm" : "refuse"}`);
      return true;
    }
    if (type === "OWNERSHIP_TRANSFER_REQUESTED" && typeof data?.transferId === "string" && data.transferId) {
      await api.post(`/ownership-transfers/${data.transferId}/${verbo}`);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

// push-resolve-sem-abrir-o-app (Andre, 24/10): o botao do push resolve SEM abrir o app.
// Com o app morto quem roda e a tarefa de notificacao em segundo plano (expo-task-manager,
// ver pushBackground); com o app vivo, o listener de resposta do hook. Os dois recebem a
// mesma resposta, entao cada toque (id da notificacao + botao) e decidido uma vez so.
const jaDecididas = new Set<string>();

export type ResultadoDaAcao = "feito" | "falhou" | "repetida" | "ignorada";

type RespostaDoPush = {
  actionIdentifier: string;
  notification?: { request?: { identifier?: string; content?: { data?: any } } };
};

export async function resolverAcaoDoPush(resposta: RespostaDoPush): Promise<ResultadoDaAcao> {
  const acao = acaoDoPush(resposta);
  if (acao !== "aceitar" && acao !== "recusar") return "ignorada";
  const id = `${resposta.notification?.request?.identifier ?? ""}:${resposta.actionIdentifier}`;
  if (jaDecididas.has(id)) return "repetida";
  jaDecididas.add(id);
  const ok = await decidirPeloPush(resposta.notification?.request?.content?.data, acao);
  if (!ok) jaDecididas.delete(id);
  return ok ? "feito" : "falhou";
}
