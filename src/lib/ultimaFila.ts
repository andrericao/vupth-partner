import type { EstablishmentWithProfessionals } from "@lib/types";

// estudo-desempenho 5 (DEC-151): o ULTIMO snapshot da fila fica guardado so para
// o app abrir pintado enquanto o GET real atualiza. Sem persister do React Query:
// uma chave, gravar e ler. Sai tudo ao sair da conta.
const CHAVE = "vupth_ultima_fila";

type Armazem = Pick<
  typeof import("@react-native-async-storage/async-storage").default,
  "getItem" | "setItem" | "removeItem"
>;

/**
 * O async-storage e modulo NATIVO e, no build antigo, nao existe: o `import` do
 * pacote LANCA ao carregar ("NativeModule: AsyncStorage is null") e derruba o
 * bundle inteiro (tela branca, 01/11). Por isso o carregamento e tardio e
 * protegido; sem o modulo, o app so abre sem o ultimo dado.
 */
export function carregarArmazem(): Armazem | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require("@react-native-async-storage/async-storage");
    return (m?.default ?? m) as Armazem;
  } catch {
    return null;
  }
}

type Guardado = { establishmentId: string; data: EstablishmentWithProfessionals };

export async function salvarUltimaFila(
  establishmentId: string,
  data: EstablishmentWithProfessionals
): Promise<void> {
  try {
    const a = carregarArmazem();
    if (!a) return;
    const g: Guardado = { establishmentId, data };
    await a.setItem(CHAVE, JSON.stringify(g));
  } catch {
    // best-effort: sem armazenamento o app so abre sem o ultimo dado
  }
}

/** So devolve o que foi guardado para ESTE estabelecimento. */
export async function lerUltimaFila(
  establishmentId: string
): Promise<EstablishmentWithProfessionals | null> {
  try {
    const a = carregarArmazem();
    if (!a) return null;
    const bruto = await a.getItem(CHAVE);
    if (!bruto) return null;
    const g = JSON.parse(bruto) as Guardado;
    return g.establishmentId === establishmentId ? g.data : null;
  } catch {
    return null;
  }
}

export async function limparUltimaFila(): Promise<void> {
  try {
    await carregarArmazem()?.removeItem(CHAVE);
  } catch {
    // best-effort
  }
}
