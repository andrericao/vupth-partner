// Tipo de estabelecimento (enum do backend, ex.: "BARBER") — lista/rotulo
// UNICOS para o picker (SelectService, cadastro) e para qualquer tela que
// EXIBE o tipo (dashboard, menu, busca). Antes cada tela mostrava o
// `service_type` cru do backend ("BARBER" na cara do dono/cliente); so o
// picker tinha o rotulo em portugues, e so na hora de CRIAR.
export const SERVICE_TYPES = [
  { label: "Barbearia", value: "BARBER" },
  { label: "Salão de Beleza", value: "BEAUTY_SALON" },
  { label: "Manicure / Pedicure", value: "NAIL_SALON" },
  { label: "Sobrancelha", value: "EYEBROW" },
  { label: "SPA", value: "SPA" },
  { label: "Clínica", value: "CLINIC" },
] as const;

/**
 * Rotulo em portugues do tipo de estabelecimento. Enum desconhecido ou vazio
 * cai no proprio valor recebido (nunca fica em branco) — mais seguro do que
 * esconder a informacao quando o backend adicionar um tipo novo antes do app.
 */
export function serviceTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return SERVICE_TYPES.find((t) => t.value === value)?.label ?? value;
}
