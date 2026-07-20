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
