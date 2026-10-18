import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { preferenciaValida, type Preferencia } from "@theme/tema";

// A escolha de Perfil → Aparência → Tema fica no aparelho, como o tamanho da
// letra (fonte.store.ts). O PADRAO e claro: quem nunca abriu a tela continua
// vendo o app como sempre viu, e uma chave ausente ou corrompida nunca liga o
// escuro sozinha.
const CHAVE = "vupth_tema";

// O layout raiz segura a primeira tela ate a leitura terminar. Um cofre que nao
// responde nunca pode virar o spinner eterno de 27/08 (fonte que nao carregava):
// passado o limite o app abre no padrao.
export const LIMITE_DA_LEITURA_MS = 1500;

function comLimite<T>(leitura: Promise<T>, ms: number): Promise<T | null> {
  let relogio: ReturnType<typeof setTimeout> | undefined;
  const estouro = new Promise<null>((resolve) => {
    relogio = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([leitura, estouro]).finally(() => clearTimeout(relogio));
}

type TemaState = {
  preferencia: Preferencia;
  /**
   * `true` quando a leitura do aparelho terminou (deu certo ou nao). O layout
   * raiz segura a primeira pintura ate aqui: sem isso quem escolheu o escuro
   * veria um clarao branco a cada abertura.
   */
  restaurado: boolean;
  escolher: (preferencia: Preferencia) => Promise<void>;
  restaurar: () => Promise<void>;
};

export const useTemaStore = create<TemaState>((set) => ({
  preferencia: "claro",
  restaurado: false,
  escolher: async (preferencia) => {
    const p = preferenciaValida(preferencia);
    set({ preferencia: p });
    try {
      await SecureStore.setItemAsync(CHAVE, p);
    } catch {}
  },
  restaurar: async () => {
    try {
      const guardado = await comLimite(SecureStore.getItemAsync(CHAVE), LIMITE_DA_LEITURA_MS);
      set({ preferencia: preferenciaValida(guardado) });
    } catch {
      // Sem acesso ao cofre do aparelho o app abre no padrao (claro).
    } finally {
      set({ restaurado: true });
    }
  },
}));
