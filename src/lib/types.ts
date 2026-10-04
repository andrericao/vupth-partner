export type AttendanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "FINISHED"
  | "CANCELLED"
  // A LOJA tirou o cliente da fila (backend, 18/09) — CANCELLED ficou so para o
  // cliente que desistiu. Ver src/lib/statusAtendimento.ts.
  | "REMOVED"
  | "LATE";

export type AttendanceServiceItem = {
  id: string;
  customName: string;
  estimatedMinutes: number;
};

// C2 "solicitar corte" (backend BUG5 C2). Entidade PROPRIA — nunca aparece em
// read-model de fila. O profissional dono decide o pedido PENDING (accept ->
// nasce Attendance SCHEDULED na cauda; refuse -> descartado). Ver HANDOFF_BACKEND.
export type CutRequestStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "EXPIRED";

/**
 * Envelope do WS pessoal `/user/queue/notifications` (PRD_BACKEND 18b).
 * `cutRequestId` e campo proprio desde o desbloqueio do C2 (2026-07-22): vem
 * preenchido em todos os eventos CUT_* (no CUT_ACCEPTED junto do attendanceId
 * do atendimento gerado) e null nos demais.
 */
export type QueueNotification = {
  type: string;
  attendanceId?: string | null;
  establishmentId?: string | null;
  cutRequestId?: string | null;
  // Auto-fechamento (BUG1 / S1 fatia 5): no evento CLOSING_PROMPT vem o fim da
  // carencia de 15min (ISO) para o countdown server-authoritative do prompt.
  graceUntil?: string | null;
  message?: string | null;
  timestamp?: string | null;
};

export type CutRequestResponse = {
  id: string;
  status: CutRequestStatus;
  professional_id: string;
  establishment_id: string;
  client_id: string;
  /**
   * Nice-to-have pedido ao backend (2026-07-22): o response ainda NAO traz o
   * nome. Campo opcional de proposito — quando eles adicionarem, o card passa
   * a mostrar o nome sem nenhuma mudanca no front (fallback: "Cliente").
   */
  client_name?: string | null;
  service_item_ids: string[];
  expires_at: string;
  created_at: string;
  resulting_attendance_id: string | null;
  /** Quando o cliente quer (S26, 36c4359); null = assim que abrir. So informa. */
  desired_time?: string | null;
};

export type AttendanceInQueue = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  professionalId: string;
  professionalName: string;
  clientId: string;
  clientName: string;
  services: AttendanceServiceItem[];
  status: AttendanceStatus;
  totalValue: number;
  scheduledTime: string;
  estimatedMinutes: number;
  durationInMinutes: number | null;
};

export type AttendanceInProgress = AttendanceInQueue & {
  startTime: string;
  elapsedMinutes: number;
  pausedTimeMinutes: number;
  totalElapsedMinutes: number;
  remainingMinutes: number;
  isPaused: boolean;
};

export type ProfessionalWithQueue = {
  id: string;
  name: string;
  specialty: string;
  is_available: boolean;
  current_attendance: AttendanceInQueue | null;
  waiting_list: AttendanceInQueue[];
  queue_count: number;
  estimated_wait_minutes: number;
  // Avaliacao agregada (backend popula em professionals-with-queue, #6). Opcional
  // por seguranca; o front so exibe quando ha avaliacoes (ver src/lib/rating.ts).
  rating_average?: number | null;
  rating_count?: number | null;
  /** Foto de perfil (S22, 46f1f74). Nula sem foto. */
  profile_image_url?: string | null;
};

export type EstablishmentWithProfessionals = {
  id: string;
  name: string;
  url_image: string | null;
  services: string[];
  owner_id: string;
  /** Chave MANUAL persistida (OPEN/CLOSED/TEMPORARILY_CLOSED) — o que o toggle escreve. */
  open_status: string;
  /**
   * "Aberto agora" EFETIVO (backend BUG5 parte B): `open_status == OPEN` **E**
   * horario atual dentro de `[opening_time, closing_time)`. Read-only, derivado.
   * E o que o CLIENTE enxerga e o que o gate de entrada (409
   * ESTABLISHMENT_NOT_OPEN) usa — por isso o partner nao pode dizer "aberta"
   * so pelo `open_status`. Opcional por seguranca (deploy antigo do backend).
   */
  is_open?: boolean | null;
  total_in_queue: number;
  available_professionals: number;
  /**
   * O cadastro do ESTABELECIMENTO tem pendencia? (pedido ao backend, 10/09.)
   *
   * O profissional pode ter o proprio cadastro 100% e mesmo assim nao aparecer
   * para os clientes, porque falta algo na loja — e hoje ele nao tem como
   * saber: este snapshot traz nome, aberto/fechado e a lista de profissionais,
   * nada sobre endereco, horario ou cadastro.
   *
   * Decisao do Andre: NAO precisa dizer O QUE falta, basta a flag. Opcional
   * ate o backend entregar — enquanto vier `undefined`, o app nao afirma nada,
   * que e melhor do que afirmar errado.
   */
  establishment_pending?: boolean | null;
  professionals: ProfessionalWithQueue[];
};

export type QueueResponse = {
  professionalId: string;
  professionalName: string;
  establishmentId: string;
  establishmentName: string;
  size: number;
  attendancesInQueue: AttendanceInQueue[];
  totalEstimatedMinutes: number;
  totalElapsedMinutes: number;
  totalRemainingMinutes: number;
  inAttendance: AttendanceInProgress | null;
};

export type AttendanceHistoryItem = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  professionalId: string;
  professionalName: string;
  clientId: string | null;
  clientName: string;
  services: AttendanceServiceItem[];
  status: AttendanceStatus;
  totalValue: number;
  scheduledTime: string;
  startTime: string | null;
  endTime: string | null;
  durationInMinutes: number | null;
};
