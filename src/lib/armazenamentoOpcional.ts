/* eslint-disable @typescript-eslint/no-require-imports */
// partner-cai-de-novo (01/11, logcat do André): o async-storage e modulo NATIVO e o
// build de 25/10 nao o tem. O require protegido nao bastou: o pacote lancou dentro de
// um efeito e o React tratou como fatal. A regra agora e uma so:
//   1. so se TOCA no pacote depois de confirmar que o modulo nativo existe;
//   2. leitura, gravacao e remocao NUNCA lancam (devolvem null/false), nem de forma
//      sincrona, nem no meio de um efeito.
// Este e o UNICO arquivo que pode citar o pacote (travado em
// src/__tests__/projeto/modulosNativosSobDemanda.test.ts).

export type Armazem = {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  removeItem: (k: string) => Promise<void>;
};

// Os nomes sob os quais o nativo do async-storage 2.x se registra.
const NOMES_DO_NATIVO = ["PlatformLocalStorage", "RNC_AsyncSQLiteDBStorage", "RNCAsyncStorage"];

/** O binario instalado tem o modulo nativo do async-storage? */
export function nativoPresente(): boolean {
  try {
    const { NativeModules, TurboModuleRegistry } = require("react-native");
    return NOMES_DO_NATIVO.some(
      (n) => TurboModuleRegistry?.get?.(n) != null || NativeModules?.[n] != null
    );
  } catch {
    return false;
  }
}

/** O armazem, ou null se o binario nao tem o modulo nativo (o pacote nem e carregado). */
export function carregarArmazem(): Armazem | null {
  try {
    if (!nativoPresente()) return null;
    const m = require("@react-native-async-storage/async-storage");
    const a = (m?.default ?? m) as Armazem | undefined;
    return a && typeof a.getItem === "function" ? a : null;
  } catch {
    return null;
  }
}

export async function lerItem(chave: string): Promise<string | null> {
  try {
    const a = carregarArmazem();
    return a ? await a.getItem(chave) : null;
  } catch {
    return null;
  }
}

export async function gravarItem(chave: string, valor: string): Promise<boolean> {
  try {
    const a = carregarArmazem();
    if (!a) return false;
    await a.setItem(chave, valor);
    return true;
  } catch {
    return false;
  }
}

export async function removerItem(chave: string): Promise<boolean> {
  try {
    const a = carregarArmazem();
    if (!a) return false;
    await a.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}
