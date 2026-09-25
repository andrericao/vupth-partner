/**
 * O subtitulo das Configuracoes do profissional. So a loja: a especialidade
 * aparecia como o codigo cru do backend ("NAIL_TECH") — Andre, 25/09.
 */
export function subtituloDasConfiguracoes(
  prof: { specialty?: string | null; establishment_name?: string | null } | null | undefined
): string {
  return prof?.establishment_name || "Complete seu cadastro para atender";
}
