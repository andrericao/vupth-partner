import { api } from "@lib/api";

// aceitar-encaixe (DEC-136 a 141; Backend 580596e): o cliente pede para ser
// encaixado na fila do dia pagando um adicional. O profissional aceita, recusa
// ou contrapoe o valor. Sigilo total (DEC-141): a resposta nao traz o nome do
// cliente, so quantos ficam na frente, o horario e o adicional.

export type StatusDoEncaixe = "PENDING" | "COUNTERED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";

export type PedidoDeEncaixe = {
  id: string;
  status: StatusDoEncaixe;
  aheadCount: number;
  desiredTime: string;
  currentExtra: number;
  lastOfferBy: string | null;
  attendanceId: string | null;
  createdAt: string;
};

export type ApoioDoEncaixe = {
  aheadNow: number;
  behindNow: number;
  durationMinutes: number;
  sliceMinutesPerClient: number;
  absorbedUnnoticed: boolean;
  estimatedFinish: string | null;
  closesAt: string | null;
  passesClosing: boolean;
};

function doPedido(d: any): PedidoDeEncaixe {
  return {
    id: d.id,
    status: d.status,
    aheadCount: d.ahead_count ?? 0,
    desiredTime: d.desired_time,
    currentExtra: Number(d.current_extra ?? 0),
    lastOfferBy: d.last_offer_by ?? null,
    attendanceId: d.attendance_id ?? null,
    createdAt: d.created_at,
  };
}

export async function listarEncaixes(): Promise<PedidoDeEncaixe[]> {
  const { data } = await api.get("/attendances/fit-in-requests");
  return (Array.isArray(data) ? data : []).map(doPedido);
}

export async function aceitarEncaixe(id: string): Promise<PedidoDeEncaixe> {
  const { data } = await api.put(`/attendances/fit-in-requests/${id}/accept`);
  return doPedido(data);
}

export async function recusarEncaixe(id: string): Promise<PedidoDeEncaixe> {
  const { data } = await api.put(`/attendances/fit-in-requests/${id}/decline`);
  return doPedido(data);
}

export async function contraporEncaixe(id: string, extra: number): Promise<PedidoDeEncaixe> {
  const { data } = await api.put(`/attendances/fit-in-requests/${id}/counter`, { extra });
  return doPedido(data);
}

export async function apoioDoEncaixe(id: string): Promise<ApoioDoEncaixe> {
  const { data } = await api.get(`/attendances/fit-in-requests/${id}/support`);
  return {
    aheadNow: data.aheadNow ?? data.ahead_now ?? 0,
    behindNow: data.behindNow ?? data.behind_now ?? 0,
    durationMinutes: data.durationMinutes ?? data.duration_minutes ?? 0,
    sliceMinutesPerClient: data.sliceMinutesPerClient ?? data.slice_minutes_per_client ?? 0,
    absorbedUnnoticed: !!(data.absorbedUnnoticed ?? data.absorbed_unnoticed),
    estimatedFinish: data.estimatedFinish ?? data.estimated_finish ?? null,
    closesAt: data.closesAt ?? data.closes_at ?? null,
    passesClosing: !!(data.passesClosing ?? data.passes_closing),
  };
}

/** Os que esperam resposta DO PROFISSIONAL: o cliente pediu e ainda nao foi respondido. */
export function encaixesParaResponder(lista: PedidoDeEncaixe[] | undefined): PedidoDeEncaixe[] {
  return (lista ?? []).filter((p) => p.status === "PENDING");
}

/** A contraproposta do profissional, esperando o cliente. */
export function encaixesEsperandoOCliente(lista: PedidoDeEncaixe[] | undefined): PedidoDeEncaixe[] {
  return (lista ?? []).filter((p) => p.status === "COUNTERED");
}

/** "12,50" ou "12.5" -> 12.5; vazio, zero ou negativo -> null. */
export function lerValor(texto: string): number | null {
  const n = Number(texto.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** O que o apoio diz ao profissional, em frases curtas. */
export function frasesDoApoio(a: ApoioDoEncaixe): string[] {
  const frases: string[] = [];
  const n = a.aheadNow + a.behindNow;
  if (a.absorbedUnnoticed) {
    frases.push(`${n} ${n === 1 ? "cliente absorve" : "clientes absorvem"} o tempo sem perceber.`);
  } else {
    frases.push(`O encaixe adiciona ${a.sliceMinutesPerClient} min para cada um dos ${n} clientes.`);
  }
  if (a.passesClosing) {
    frases.push(`Passa do fechamento${a.closesAt ? ` (${a.closesAt.slice(0, 5)})` : ""}.`);
  }
  return frases;
}
