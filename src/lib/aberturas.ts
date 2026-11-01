import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

// log-de-falha-na-abertura (André, 01/11): protecao contra laco de queda.
//
// A marca "abrindo" e gravada no inicio do bundle e apagada quando a primeira
// tela esta de pe (ou apos JANELA_MS, o que vier primeiro). Se a proxima abertura
// ainda achar a marca, o app caiu no caminho: duas quedas seguidas = modo seguro,
// que so desliga o OPCIONAL (ultima fila, push em segundo plano, gesto nativo).
// Login e dados nunca saem. Tudo aqui e try/catch: a marca nao pode derrubar a abertura.
// Fica no expo-secure-store, que ja esta em todo build (nao depende de modulo novo).
const CHAVE = "vupth_abertura";
export const LIMITE_QUEDAS = 2;
export const JANELA_MS = 15_000;

export type Marca = { abrindo: boolean; quedas: number };
export type Armazem = {
  getItemAsync: (k: string) => Promise<string | null>;
  setItemAsync: (k: string, v: string) => Promise<void>;
};

export type ResultadoDaAbertura = { quedas: number; modoSeguro: boolean };

/** Lógica pura: a marca encontrada na abertura diz quantas quedas seguidas houve. */
export function decidirAbertura(marca: Marca | null): ResultadoDaAbertura {
  const quedas = marca?.abrindo ? (marca.quedas ?? 0) + 1 : 0;
  return { quedas, modoSeguro: quedas >= LIMITE_QUEDAS };
}

export function lerMarca(bruto: string | null): Marca | null {
  try {
    if (!bruto) return null;
    const m = JSON.parse(bruto) as Partial<Marca>;
    return { abrindo: m.abrindo === true, quedas: Number.isFinite(m.quedas) ? Number(m.quedas) : 0 };
  } catch {
    return null;
  }
}

type EstadoDoModo = { seguro: boolean; quedas: number; definir: (r: ResultadoDaAbertura) => void; reset: () => void };
export const useModoSeguro = create<EstadoDoModo>((set) => ({
  seguro: false,
  quedas: 0,
  definir: (r) => set({ seguro: r.modoSeguro, quedas: r.quedas }),
  reset: () => set({ seguro: false, quedas: 0 }),
}));

export function emModoSeguro(): boolean {
  return useModoSeguro.getState().seguro;
}

let pronta: Promise<void> = Promise.resolve();
/** Resolve quando a leitura da marca terminou: quem decide algo opcional espera por ela. */
export function aguardarAbertura(): Promise<void> {
  return pronta;
}

/**
 * Chamada no inicio do bundle. Le a marca, decide o modo e grava "abrindo".
 * Nunca lanca: sem armazenamento, abre normal.
 */
export function iniciarAbertura(
  armazem: Armazem = SecureStore,
  motivo: (r: ResultadoDaAbertura) => void = () => {}
): Promise<ResultadoDaAbertura> {
  const trabalho = (async (): Promise<ResultadoDaAbertura> => {
    let r: ResultadoDaAbertura = { quedas: 0, modoSeguro: false };
    try {
      r = decidirAbertura(lerMarca(await armazem.getItemAsync(CHAVE)));
      useModoSeguro.getState().definir(r);
      if (r.quedas > 0) motivo(r);
      await armazem.setItemAsync(CHAVE, JSON.stringify({ abrindo: true, quedas: r.quedas } satisfies Marca));
    } catch {
      // a marca e protecao: nunca derruba a abertura
    }
    return r;
  })();
  pronta = trabalho.then(() => undefined);
  return trabalho;
}

/** A primeira tela esta de pe (ou a janela acabou): a abertura deu certo. */
export async function aberturaEstavel(armazem: Armazem = SecureStore): Promise<void> {
  try {
    await armazem.setItemAsync(CHAVE, JSON.stringify({ abrindo: false, quedas: 0 } satisfies Marca));
  } catch {
    // idem
  }
}
