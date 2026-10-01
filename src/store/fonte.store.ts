import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { passoValido } from "@lib/fonte";

// O passo da letra escolhido no Perfil/Menu — fica no aparelho (como no Client).
const CHAVE = "vupth_passo_da_fonte";

type FonteState = {
  passo: number;
  escolher: (passo: number) => Promise<void>;
  restaurar: () => Promise<void>;
};

export const useFonteStore = create<FonteState>((set) => ({
  passo: 0,
  escolher: async (passo) => {
    const p = passoValido(passo);
    set({ passo: p });
    try {
      await SecureStore.setItemAsync(CHAVE, String(p));
    } catch {}
  },
  restaurar: async () => {
    try {
      set({ passo: passoValido(await SecureStore.getItemAsync(CHAVE)) });
    } catch {}
  },
}));

/** Tamanho escrito direto num style (fontSize: 12) somado ao passo escolhido. */
export function fs(tamanho: number): number {
  return tamanho + useFonteStore.getState().passo;
}

/**
 * O mesmo `fs`, mas que REDESENHA o componente quando o passo muda. Use dentro
 * de componentes; o layout nao remonta a arvore (remontar levaria a pessoa de
 * volta a tela inicial).
 */
export function useFs(): (tamanho: number) => number {
  const passo = useFonteStore((s) => s.passo);
  return (tamanho: number) => tamanho + passo;
}
