import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EstablishmentWithProfessionals } from "@lib/types";

// estudo-desempenho 5 (DEC-151): o ULTIMO snapshot da fila fica guardado so para
// o app abrir pintado enquanto o GET real atualiza. Sem persister do React Query:
// uma chave, gravar e ler. Sai tudo ao sair da conta.
const CHAVE = "vupth_ultima_fila";

type Guardado = { establishmentId: string; data: EstablishmentWithProfessionals };

export async function salvarUltimaFila(
  establishmentId: string,
  data: EstablishmentWithProfessionals
): Promise<void> {
  try {
    const g: Guardado = { establishmentId, data };
    await AsyncStorage.setItem(CHAVE, JSON.stringify(g));
  } catch {
    // best-effort: sem armazenamento o app so abre sem o ultimo dado
  }
}

/** So devolve o que foi guardado para ESTE estabelecimento. */
export async function lerUltimaFila(
  establishmentId: string
): Promise<EstablishmentWithProfessionals | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    if (!bruto) return null;
    const g = JSON.parse(bruto) as Guardado;
    return g.establishmentId === establishmentId ? g.data : null;
  } catch {
    return null;
  }
}

export async function limparUltimaFila(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE);
  } catch {
    // best-effort
  }
}
