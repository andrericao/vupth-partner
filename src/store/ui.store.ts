import { create } from "zustand";

// Estado de UI efemero — NAO persistido de proposito, para resetar a cada
// abertura do app (o modulo e recarregado no launch). Usado pela faixa de
// prontidao (ReadinessFaixa): a faixa aparece a cada abertura enquanto houver
// pendencia de "Pronto para atender"; o usuario pode fecha-la (X) e ela nao
// volta naquela sessao, mas reaparece no proximo launch. (Decisao Andre 2026-07-11.)
type UiState = {
  faixaDismissed: boolean;
  dismissFaixa: () => void;
  resetFaixa: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  faixaDismissed: false,
  dismissFaixa: () => set({ faixaDismissed: true }),
  resetFaixa: () => set({ faixaDismissed: false }),
}));
