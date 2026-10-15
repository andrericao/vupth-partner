// Os tipos de servico que o profissional oferece, por especialidade. O mesmo
// enum ServiceItemType do backend; a especialidade e texto livre la (max 100).

export type TipoDeServico = { label: string; value: string; specialties: string[] };

export const TIPOS_DE_SERVICO: readonly TipoDeServico[] = [
  { label: "Corte a maquina", value: "CORTE_MAQUINA", specialties: ["BARBER"] },
  { label: "Corte a tesoura", value: "CORTE_TESOURA", specialties: ["BARBER"] },
  { label: "Barba", value: "BARBA", specialties: ["BARBER"] },
  { label: "Design de sobrancelha", value: "SOBRANCELHA", specialties: ["BARBER", "EYEBROW_TECH"] },
  { label: "Pintura", value: "PINTURA", specialties: ["BARBER", "HAIRDRESSER"] },
  { label: "Recorte das pontas", value: "RECORTE_PONTAS", specialties: ["HAIRDRESSER"] },
  { label: "Escova", value: "ESCOVA", specialties: ["HAIRDRESSER"] },
  { label: "Hidratacao capilar", value: "HIDRATACAO", specialties: ["HAIRDRESSER"] },
  { label: "Progressiva", value: "PROGRESSIVA", specialties: ["HAIRDRESSER"] },
  { label: "Manicure", value: "MANICURE", specialties: ["NAIL_TECH"] },
  { label: "Pedicure", value: "PEDICURE", specialties: ["NAIL_TECH"] },
  { label: "Unhas em gel", value: "UNHAS_GEL", specialties: ["NAIL_TECH"] },
  { label: "Nail art", value: "NAIL_ART", specialties: ["NAIL_TECH"] },
  { label: "Massagem relaxante", value: "MASSAGEM_RELAXANTE", specialties: ["MASSEUSE"] },
  { label: "Massagem modeladora", value: "MASSAGEM_MODELADORA", specialties: ["MASSEUSE"] },
  { label: "Limpeza de pele", value: "LIMPEZA_PELE", specialties: ["MASSEUSE", "ESTHETICIAN"] },
  { label: "Depilacao", value: "DEPILACAO", specialties: ["MASSEUSE"] },
  { label: "Drenagem linfatica", value: "DRENAGEM", specialties: ["MASSEUSE"] },
  { label: "Peeling facial", value: "PEELING", specialties: ["ESTHETICIAN"] },
  { label: "Aplicacao de botox", value: "BOTOX", specialties: ["ESTHETICIAN"] },
  { label: "Microagulhamento", value: "MICROAGULHAMENTO", specialties: ["ESTHETICIAN"] },
];

// Rotulo do cadastro -> codigo: quem foi criado com o nome ("Barbeiro") tambem acha os tipos.
const CODIGO_PELO_NOME: Record<string, string> = {
  BARBEIRO: "BARBER",
  "CABELEIREIRO(A)": "HAIRDRESSER",
  CABELEIREIRO: "HAIRDRESSER",
  CABELEIREIRA: "HAIRDRESSER",
  MANICURE: "NAIL_TECH",
  "DESIGNER DE SOBRANCELHA": "EYEBROW_TECH",
  MASSAGISTA: "MASSEUSE",
  ESTETICISTA: "ESTHETICIAN",
};

/**
 * Os tipos da especialidade do profissional. tipo-de-servico-sumiu (PAR-14,
 * Andre 15/10): uma especialidade fora da lista (ex. "Corte", das contas de
 * teste) deixava a grade vazia e o cadastro travado. Sem par, valem todos.
 */
export function tiposDaEspecialidade(especialidade: string | null | undefined): readonly TipoDeServico[] {
  const bruto = (especialidade ?? "").trim().toUpperCase();
  const codigo = CODIGO_PELO_NOME[bruto] ?? bruto;
  const daEspecialidade = TIPOS_DE_SERVICO.filter((t) => t.specialties.includes(codigo));
  return daEspecialidade.length > 0 ? daEspecialidade : TIPOS_DE_SERVICO;
}

/**
 * O tipo que vai no cadastro. tipo-uma-vez (PAR-15, Andre 15/10): o
 * profissional ja disse o que faz; o tipo nao trava o cadastro — sem escolha
 * (ou com uma que nao e da lista), vale o primeiro da especialidade.
 */
export function tipoDoServico(tipos: readonly TipoDeServico[], escolhido: string | null | undefined): string {
  if (escolhido && tipos.some((t) => t.value === escolhido)) return escolhido;
  return tipos[0]?.value ?? TIPOS_DE_SERVICO[0].value;
}
