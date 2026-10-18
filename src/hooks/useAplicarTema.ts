import { useEffect } from "react";
import { Platform } from "react-native";
import { espelharNaWeb, pedirEsquemaAoSistema } from "@lib/aplicarTema";
import { useTema } from "@hooks/useTema";
import { ESCURO_LIBERADO } from "@theme/liberacao";

/**
 * Chamado UMA vez, no layout raiz: leva o tema escolhido ao sistema e, na web,
 * ao <html>. Sem a liberacao do escuro nao faz nada — o app fica exatamente
 * como era (claro, e o sistema segue o aparelho).
 */
export function useAplicarTema(): void {
  const { tema, preferencia, cores, vars } = useTema();

  useEffect(() => {
    if (ESCURO_LIBERADO) pedirEsquemaAoSistema(preferencia);
  }, [preferencia]);

  useEffect(() => {
    if (ESCURO_LIBERADO && Platform.OS === "web") espelharNaWeb(tema, cores, vars);
  }, [tema, cores, vars]);
}
