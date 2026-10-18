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

/**
 * versao-so-nas-configuracoes (Andre, 17/10): o numero do commit fica a vista
 * nos builds de teste (a trava da bateria o le) e SAI na producao, onde a versao
 * fica so nas Configuracoes. O canal do EAS Update diz qual e: "production" so
 * no build de producao (eas.json); preview, development e sem canal (dev, web)
 * mostram.
 */
export function commitVisivelNoCanal(canal: string | null | undefined): boolean {
  return canal !== "production";
}
