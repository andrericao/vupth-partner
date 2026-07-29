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
  // Auto-fechamento (BUG1 / S1 fatia 5): quando chega o WS `CLOSING_PROMPT`,
  // guardamos o `graceUntil` (fim da carencia de 15min, ISO) e a tela mostra o
  // prompt "quer fechar?" com countdown. null = sem prompt ativo. Efemero.
  closingGraceUntil: string | null;
  showClosingPrompt: (graceUntil: string | null) => void;
  dismissClosingPrompt: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  faixaDismissed: false,
  dismissFaixa: () => set({ faixaDismissed: true }),
  resetFaixa: () => set({ faixaDismissed: false }),
  closingGraceUntil: null,
  showClosingPrompt: (graceUntil) => set({ closingGraceUntil: graceUntil }),
  dismissClosingPrompt: () => set({ closingGraceUntil: null }),
}));
