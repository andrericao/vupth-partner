// Nomes das especialidades do profissional — os mesmos rotulos do cadastro.
// O backend manda o codigo ("NAIL_TECH"); a tela nunca mostra o codigo.
const NOMES: Record<string, string> = {
  BARBER: "Barbeiro",
  HAIRDRESSER: "Cabeleireiro(a)",
  NAIL_TECH: "Manicure",
  EYEBROW_TECH: "Designer de sobrancelha",
  MASSEUSE: "Massagista",
  ESTHETICIAN: "Esteticista",
};

export function nomeDaEspecialidade(codigo: string | null | undefined): string {
  return (codigo && NOMES[codigo]) || "";
}
