// Checklists de prontidao (feature "2 completes", PRD 2026-07-09).
// Logica PURA (sem UI, sem rede) — os componentes passam flags calculadas
// dos dados que ja tem, e aqui montamos os dois medidores por perfil:
//   basic   = "Pronto para atender" (portao funcional, regra #31 do backend)
//   profile = "Perfil completo" (extras que melhoram a apresentacao; nao bloqueiam)
// (nao confundir com src/lib/readiness.ts, que e o cold-start do backend.)

export type CompletionItem = {
  key: string;
  label: string;
  done: boolean;
};

export type CompletionTracker = {
  items: CompletionItem[];
  done: number;
  total: number;
  pending: number;
  percent: number;
};

export type Completion = {
  basic: CompletionTracker;
  profile: CompletionTracker;
};

function tracker(items: CompletionItem[]): CompletionTracker {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const pending = total - done;
  // Nada exigido = 100% (nao ha o que completar).
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);
  return { items, done, total, pending, percent };
}

export type OwnerCompletionInput = {
  hasName: boolean;
  hasServiceType: boolean;
  hasAddress: boolean;
  hasHours: boolean;
  hasProfessionalWithService: boolean;
  isOpen: boolean;
  // extras (perfil):
  hasPhone: boolean;
  hasInstagram: boolean;
};

export function ownerCompletion(i: OwnerCompletionInput): Completion {
  const basic = tracker([
    { key: "name", label: "Nome", done: i.hasName },
    { key: "serviceType", label: "Tipo de serviço", done: i.hasServiceType },
    { key: "address", label: "Endereço (bairro)", done: i.hasAddress },
    { key: "hours", label: "Horário de funcionamento", done: i.hasHours },
    // MVP: sem lista completa de profissionais, "vinculado" e "com serviço"
    // colapsam num item so (ver HANDOFF_BACKEND — falta GET de todos os
    // profissionais, incl. os sem servico, que o professionals-with-queue esconde).
    { key: "professionalWithService", label: "1+ profissional com serviço", done: i.hasProfessionalWithService },
    { key: "open", label: "Abrir estabelecimento", done: i.isOpen },
  ]);
  const profile = tracker([
    { key: "phone", label: "Telefone", done: i.hasPhone },
    { key: "instagram", label: "Instagram", done: i.hasInstagram },
  ]);
  return { basic, profile };
}

export type ProfessionalCompletionInput = {
  isAffiliated: boolean;
  hasService: boolean;
  establishmentReady: boolean;
  // extras (perfil):
  hasNickname: boolean;
  hasSpecialty: boolean;
};

export function professionalCompletion(i: ProfessionalCompletionInput): Completion {
  const basic = tracker([
    { key: "affiliated", label: "Vinculado a um estabelecimento", done: i.isAffiliated },
    { key: "service", label: "1+ serviço cadastrado", done: i.hasService },
    { key: "establishmentReady", label: "Estabelecimento pronto e aberto", done: i.establishmentReady },
  ]);
  const profile = tracker([
    { key: "nickname", label: "Apelido", done: i.hasNickname },
    { key: "specialty", label: "Especialidade", done: i.hasSpecialty },
  ]);
  return { basic, profile };
}
