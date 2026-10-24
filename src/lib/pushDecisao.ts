import { api } from "@lib/api";

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
