/**
 * O commit do codigo que esta rodando, carimbado pelo app.config.js em
 * `extra.commit` (no build e no OTA). A bateria Maestro o confere antes de
 * comecar (bateria-confere-versao, Andre 03/10). Sem carimbo: null.
 */
export function commitDoCodigo(
  expoConfig?: { extra?: Record<string, unknown> | null } | null
): string | null {
  const commit = expoConfig?.extra?.commit;
  return typeof commit === "string" && commit.trim() ? commit.trim() : null;
}
