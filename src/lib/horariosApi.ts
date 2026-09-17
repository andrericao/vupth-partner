import { api } from "@lib/api";
import {
  normalizarHorarios,
  corpoDoDia,
  type DiaSemanal,
  type HorarioDoDia,
  type HorariosDaLoja,
} from "@lib/horarioSemanal";

// Chamadas do horario por dia (S27). Contrato em src/lib/horarioSemanal.ts.

/**
 * A semana da loja. `null` = o backend ainda nao tem a rota (404): quem chama
 * cai no horario unico antigo. O app nao pode depender da ordem dos deploys.
 */
export async function buscarHorarios(establishmentId: string): Promise<HorariosDaLoja | null> {
  try {
    const { data } = await api.get(`/establishment/${establishmentId}/hours`);
    return normalizarHorarios(data);
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function salvarSemana(
  establishmentId: string,
  dias: DiaSemanal[]
): Promise<HorariosDaLoja> {
  const { data } = await api.put(`/establishment/${establishmentId}/hours/weekly`, {
    days: dias.map((d) => ({ day: d.day, ...corpoDoDia(d) })),
  });
  return normalizarHorarios(data);
}

export async function salvarData(
  establishmentId: string,
  dataIso: string,
  h: HorarioDoDia
): Promise<HorariosDaLoja> {
  const { data } = await api.put(
    `/establishment/${establishmentId}/hours/dates/${dataIso}`,
    corpoDoDia(h)
  );
  return normalizarHorarios(data);
}

export async function removerData(establishmentId: string, dataIso: string): Promise<void> {
  await api.delete(`/establishment/${establishmentId}/hours/dates/${dataIso}`);
}
