import * as SecureStore from "expo-secure-store";

// Preferencia do popup de refeicao. Andre 2026-07-20: "nao quero popup na tela;
// essa que aparece no horario deve ter a opcao de nao ver mais, assim ficaria
// apenas o dot, com a contagem, no menu".
//
// Desligado => o aviso vive SO no menu (dot + contagem regressiva). E reversivel
// em Configuracoes > Refeicoes, para nao virar beco sem saida.
const KEY = "meal_nudge_disabled";

/** O profissional pediu para nao ver mais o popup? */
export async function isMealNudgeDisabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) === "1";
}

/** Liga/desliga o popup. Desligar apaga nada alem da preferencia. */
export async function setMealNudgeDisabled(disabled: boolean): Promise<void> {
  if (disabled) {
    await SecureStore.setItemAsync(KEY, "1");
  } else {
    await SecureStore.deleteItemAsync(KEY);
  }
}

/**
 * O popup de refeicao so pergunta a quem esta TRABALHANDO numa loja ABERTA.
 * Andre, 25/09: "o estabelecimento fechado, o profissional fora e com fila
 * fechada — o app perguntou se eu iria jantar". Refeicao e pausa do trabalho;
 * sem trabalho, a pergunta nao existe.
 *
 * "Aberta" e a de fato: `is_open` quando vem (OPEN dentro do horario), senao o
 * `open_status` (backend antigo). Sem status ou sem a fila: silencio.
 */
export function devePerguntarRefeicao(
  workStatus: string | null | undefined,
  loja: { open_status?: string | null; is_open?: boolean | null } | null | undefined
): boolean {
  if (workStatus !== "WORKING" || !loja) return false;
  if (loja.open_status !== "OPEN") return false;
  return loja.is_open !== false;
}
