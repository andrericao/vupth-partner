import {
  activeCutRequests,
  releDepoisDeDecidir,
  minutesToExpire,
  cutRequestServices,
  cutRequestTitle,
  cutRequestClientName,
  cutRequestTotal,
  isCutRequestEvent,
  resumoDeSolicitacoes,
  quandoOClienteQuer,
  ehDeOutroDia,
  oQueAconteceAoAceitar,
  seloDoPrazo,
  isAgendaReleasePromptEvent,
} from "../cutRequests";
import type { CutRequestResponse } from "@lib/types";

const NOW = Date.parse("2026-07-22T12:00:00Z");

const req = (over: Partial<CutRequestResponse> = {}): CutRequestResponse => ({
  id: "cut-1",
  status: "PENDING",
  professional_id: "prof-1",
  establishment_id: "estab-1",
  client_id: "client-1",
  service_item_ids: ["svc-1"],
  expires_at: "2026-07-22T12:05:00Z",
  created_at: "2026-07-22T12:00:00Z",
  resulting_attendance_id: null,
  ...over,
});

describe("activeCutRequests", () => {
  it("lista nula/vazia vira []", () => {
    expect(activeCutRequests(null, NOW)).toEqual([]);
    expect(activeCutRequests(undefined, NOW)).toEqual([]);
    expect(activeCutRequests([], NOW)).toEqual([]);
  });

  it("mantem PENDING dentro da validade", () => {
    expect(activeCutRequests([req()], NOW)).toHaveLength(1);
  });

  it("descarta expirado LOCALMENTE (orientacao do backend: usar o expires_at)", () => {
    expect(activeCutRequests([req({ expires_at: "2026-07-22T11:59:00Z" })], NOW)).toEqual([]);
  });

  it("descarta status decidido (ACCEPTED/REFUSED/EXPIRED)", () => {
    expect(activeCutRequests([req({ status: "ACCEPTED" })], NOW)).toEqual([]);
    expect(activeCutRequests([req({ status: "REFUSED" })], NOW)).toEqual([]);
    expect(activeCutRequests([req({ status: "EXPIRED" })], NOW)).toEqual([]);
  });

  it("descarta expires_at inválido (não mantem lixo na tela)", () => {
    expect(activeCutRequests([req({ expires_at: "banana" })], NOW)).toEqual([]);
  });

  // pedido-de-corte-outro-dia (DEC-27, Backend d8039b5): o de outro dia vem com
  // expires_at nulo — sem os 5 min. Antes ele sumia da lista (data invalida).
  it("mantem o pedido de outro dia (expires_at nulo = sem prazo)", () => {
    expect(activeCutRequests([req({ expires_at: null })], NOW)).toHaveLength(1);
  });
});

describe("minutesToExpire", () => {
  it("arredonda para CIMA (4min30s -> 5)", () => {
    expect(minutesToExpire("2026-07-22T12:04:30Z", NOW)).toBe(5);
  });

  it("exatamente agora ou passado -> 0", () => {
    expect(minutesToExpire("2026-07-22T12:00:00Z", NOW)).toBe(0);
    expect(minutesToExpire("2026-07-22T11:50:00Z", NOW)).toBe(0);
  });

  it("data inválida -> 0", () => {
    expect(minutesToExpire("banana", NOW)).toBe(0);
  });

  it("sem prazo (pedido de outro dia) -> null, nao 0: nao e 'expira agora'", () => {
    expect(minutesToExpire(null, NOW)).toBeNull();
  });
});

describe("cutRequestServices", () => {
  const myServices = [
    { id: "svc-1", customName: "Corte" },
    { id: "svc-2", customName: "Barba" },
  ];

  it("resolve os ids contra os serviços do profissional", () => {
    expect(cutRequestServices(["svc-1", "svc-2"], myServices)).toBe("Corte + Barba");
  });

  it("ignora id desconhecido, mantendo os conhecidos", () => {
    expect(cutRequestServices(["svc-1", "svc-x"], myServices)).toBe("Corte");
  });

  it("nada resolvido ganha rotulo generico (card não fica em branco)", () => {
    expect(cutRequestServices(["svc-x"], myServices)).toBe("Serviço não identificado");
    expect(cutRequestServices([], myServices)).toBe("Serviço não identificado");
  });
});

describe("cutRequestTitle", () => {
  const myServices = [
    { id: "svc-1", customName: "Corte" },
    { id: "svc-2", customName: "Barba" },
  ];

  it("usa o client_name quando o backend enviar (campo futuro)", () => {
    expect(
      cutRequestTitle({ client_name: "Joao", service_item_ids: ["svc-1", "svc-2"] }, myServices)
    ).toBe("Joao quer: Corte + Barba");
  });

  it("sem o campo (backend atual) cai no fallback 'Cliente'", () => {
    expect(cutRequestTitle({ service_item_ids: ["svc-1"] }, myServices)).toBe("Cliente quer: Corte");
    expect(
      cutRequestTitle({ client_name: null, service_item_ids: ["svc-1"] }, myServices)
    ).toBe("Cliente quer: Corte");
  });

  it("nome vazio/so espacos também cai no fallback", () => {
    expect(
      cutRequestTitle({ client_name: "   ", service_item_ids: ["svc-1"] }, myServices)
    ).toBe("Cliente quer: Corte");
  });
});

describe("cutRequestClientName", () => {
  it("usa o client_name quando presente", () => {
    expect(cutRequestClientName({ client_name: "Joao" })).toBe("Joao");
  });

  it("cai no fallback 'Cliente' quando ausente, nulo ou só espacos", () => {
    expect(cutRequestClientName({})).toBe("Cliente");
    expect(cutRequestClientName({ client_name: null })).toBe("Cliente");
    expect(cutRequestClientName({ client_name: "   " })).toBe("Cliente");
  });
});

describe("cutRequestTotal", () => {
  const myServices = [
    { id: "svc-1", price: 35 },
    { id: "svc-2", price: 15 },
  ];

  it("soma os precos dos serviços resolvidos", () => {
    expect(cutRequestTotal(["svc-1", "svc-2"], myServices)).toBe(50);
  });

  it("id desconhecido conta como 0, sem quebrar a soma", () => {
    expect(cutRequestTotal(["svc-1", "svc-x"], myServices)).toBe(35);
  });

  it("nada resolvido ou lista vazia -> 0", () => {
    expect(cutRequestTotal(["svc-x"], myServices)).toBe(0);
    expect(cutRequestTotal([], myServices)).toBe(0);
  });
});

describe("isCutRequestEvent", () => {
  it("true para qualquer evento de corte (prefixo CUT_)", () => {
    expect(isCutRequestEvent("CUT_REQUESTED")).toBe(true);
    expect(isCutRequestEvent("CUT_ACCEPTED")).toBe(true);
    expect(isCutRequestEvent("CUT_EXPIRED")).toBe(true);
  });

  it("false para eventos de atendimento e lixo", () => {
    expect(isCutRequestEvent("ATTENDANCE_STARTED")).toBe(false);
    expect(isCutRequestEvent("")).toBe(false);
    expect(isCutRequestEvent(null)).toBe(false);
    expect(isCutRequestEvent(undefined)).toBe(false);
  });
});

// 🔴 ITEM 1 DA LISTA, aberto desde 05/08: "solicitei corte e nada apareceu na
// tela do profissional". O pedido existe e chega — o que nao existe e presenca:
// ele so acende um ponto de 12px dentro do menu ☰.
//
// Em 07/09 isso deixou de ser incomodo de UI. Com a decisao de que FILA FECHADA
// CONTINUA ACEITANDO SOLICITACAO, este vira o UNICO caminho do cliente para
// quem nao esta de expediente — e um pedido que so aparece como um ponto e um
// pedido perdido, com o cliente esperando resposta que nunca vem.
//
// Este resumo e o que o card da Fila mostra. Ele responde tres coisas de uma
// vez: quantos, quem, e quanto tempo resta no MAIS URGENTE — porque o pedido
// expira em 5 minutos e a decisao e por pedido, nao pela lista.
describe("resumoDeSolicitacoes", () => {
  const pedido = (over: Partial<CutRequestResponse>): CutRequestResponse =>
    ({
      id: "r1",
      status: "PENDING",
      professional_id: "p1",
      establishment_id: "e1",
      client_id: "c1",
      service_item_ids: ["s1"],
      expires_at: new Date(NOW + 5 * 60000).toISOString(),
      ...over,
    }) as CutRequestResponse;

  it("sem pedidos, nao ha card — silencio e o estado correto", () => {
    expect(resumoDeSolicitacoes([], NOW)).toBeNull();
    expect(resumoDeSolicitacoes(null, NOW)).toBeNull();
  });

  it("um pedido: singular, e o nome de quem pediu", () => {
    const r = resumoDeSolicitacoes([pedido({ client_name: "Ana" })], NOW)!;

    expect(r.titulo).toBe("1 solicitação de encaixe");
    expect(r.quem).toBe("Ana");
    expect(r.expiraEm).toBe(5);
  });

  it("varios: plural, e o resto vira contagem — nome de todo mundo nao cabe", () => {
    const r = resumoDeSolicitacoes(
      [
        pedido({ id: "r1", client_name: "Ana" }),
        pedido({ id: "r2", client_name: "Bruno" }),
        pedido({ id: "r3", client_name: "Caio" }),
      ],
      NOW
    )!;

    expect(r.titulo).toBe("3 solicitações de encaixe");
    expect(r.quem).toBe("Ana e mais 2");
  });

  it("o relogio e o do MAIS URGENTE, nao o do primeiro da lista", () => {
    const r = resumoDeSolicitacoes(
      [
        pedido({ id: "r1", expires_at: new Date(NOW + 4 * 60000).toISOString() }),
        pedido({ id: "r2", expires_at: new Date(NOW + 60000).toISOString() }),
      ],
      NOW
    )!;

    expect(r.expiraEm).toBe(1);
  });

  it("o pedido sem prazo nao entra no relogio; so ele, o card fica sem relogio", () => {
    const outroDia = pedido({ id: "r9", expires_at: null });
    const comPrazo = pedido({ id: "r1", expires_at: new Date(NOW + 3 * 60000).toISOString() });

    expect(resumoDeSolicitacoes([outroDia, comPrazo], NOW)!.expiraEm).toBe(3);
    expect(resumoDeSolicitacoes([outroDia], NOW)!.expiraEm).toBeNull();
  });

  it("diz a hora em que o mais urgente vence (BAK-1: o de hoje sem horario vale ate 23:59)", () => {
    const vence = new Date(NOW + 260 * 60000);
    const r = resumoDeSolicitacoes([pedido({ id: "r1", expires_at: vence.toISOString() })], NOW)!;
    const pad = (n: number) => String(n).padStart(2, "0");

    expect(r.expiraEm).toBe(260);
    expect(r.venceAs).toBe(`${pad(vence.getHours())}:${pad(vence.getMinutes())}`);
  });

  it("so pedido sem prazo: sem hora de vencimento", () => {
    expect(resumoDeSolicitacoes([pedido({ id: "r9", expires_at: null })], NOW)!.venceAs).toBeNull();
  });

  it("o pedido de outro dia com vencimento (BAK-1) tambem fica fora do relogio", () => {
    const amanha = new Date(NOW + 36 * 3600000).toISOString();
    const outroDia = pedido({ id: "r9", desired_time: amanha, expires_at: amanha });
    const comPrazo = pedido({ id: "r1", expires_at: new Date(NOW + 3 * 60000).toISOString() });

    expect(resumoDeSolicitacoes([outroDia, comPrazo], NOW)!.expiraEm).toBe(3);
    expect(resumoDeSolicitacoes([outroDia], NOW)!.expiraEm).toBeNull();
  });

  it("expirado nao conta — decidir sobre pedido morto e pior que nao ver", () => {
    const expirado = pedido({ expires_at: new Date(NOW - 60000).toISOString() });
    expect(resumoDeSolicitacoes([expirado], NOW)).toBeNull();
  });

  it("sem nome do backend, o fallback nao deixa o card mudo", () => {
    const r = resumoDeSolicitacoes([pedido({ client_name: null })], NOW)!;
    expect(r.quem).toBe("Cliente");
  });
});

// 🔴 Andre, 25/09 (duas vezes): aceitou o encaixe e continuou "Fora". Aceitar
// rele o status e, se nao veio Trabalhando, o app faz a troca.
describe("releDepoisDeDecidir", () => {
  const montar = (statusDepois: string) => ({
    releStatus: jest.fn(async () => undefined),
    statusAtual: jest.fn(() => statusDepois),
    ficarTrabalhando: jest.fn(async () => undefined),
    invalidar: jest.fn(),
  });

  it("aceitar com o backend ja trocando: so rele status e filas", async () => {
    const f = montar("WORKING");
    await releDepoisDeDecidir(true, f);
    expect(f.releStatus).toHaveBeenCalledTimes(1);
    expect(f.ficarTrabalhando).not.toHaveBeenCalled();
    expect(f.invalidar).toHaveBeenCalledWith(["professionals-with-queue"]);
    expect(f.invalidar).toHaveBeenCalledWith(["professional-queue"]);
  });

  it("aceitar e o status seguir Fora: o app poe Trabalhando", async () => {
    const f = montar("OFF");
    await releDepoisDeDecidir(true, f);
    expect(f.ficarTrabalhando).toHaveBeenCalledTimes(1);
  });

  it("recusar: nada alem da lista", async () => {
    const f = montar("OFF");
    await releDepoisDeDecidir(false, f);
    expect(f.releStatus).not.toHaveBeenCalled();
    expect(f.ficarTrabalhando).not.toHaveBeenCalled();
    expect(f.invalidar).not.toHaveBeenCalled();
  });

  it("falha ao reler nao desfaz o aceite (as filas relem igual)", async () => {
    const f = montar("OFF");
    f.releStatus.mockRejectedValueOnce(new Error("rede"));
    await expect(releDepoisDeDecidir(true, f)).resolves.toBeUndefined();
    expect(f.invalidar).toHaveBeenCalledTimes(2);
  });
});

// corte-com-horario (S26, Backend 36c4359): o desired_time so informa — o card
// diz o dia e o horario que o cliente quer; null = "assim que abrir".
describe("quandoOClienteQuer", () => {
  // Datas locais: o teste roda em qualquer fuso
  const local = (a: number, m: number, d: number, h: number, min: number) =>
    new Date(a, m - 1, d, h, min).toISOString();
  const agora = new Date(2026, 9, 4, 9, 0).getTime(); // dom, 04/10 09:00

  it("sem horario escolhido diz que e assim que abrir", () => {
    expect(quandoOClienteQuer(null, agora)).toBe("Quer assim que abrir");
    expect(quandoOClienteQuer(undefined, agora)).toBe("Quer assim que abrir");
  });

  it("hoje", () => {
    expect(quandoOClienteQuer(local(2026, 10, 4, 14, 30), agora)).toBe("Quer hoje às 14:30");
  });

  it("amanha", () => {
    expect(quandoOClienteQuer(local(2026, 10, 5, 9, 5), agora)).toBe("Quer amanhã às 09:05");
  });

  it("outro dia diz o dia da semana e a data", () => {
    expect(quandoOClienteQuer(local(2026, 10, 7, 18, 0), agora)).toBe("Quer qua, 07/10 às 18:00");
  });

  it("data invalida cai no assim que abrir", () => {
    expect(quandoOClienteQuer("nao-e-data", agora)).toBe("Quer assim que abrir");
  });
});

// texto-do-aceite (Backend ba38b81): aceitar o pedido de outro dia o agenda
// naquele dia; o de hoje entra no fim da fila. pedido-vence-no-horario (BAK-1,
// 0f18380): o expires_at vem sempre preenchido — o dia sai do desired_time.
describe("oQueAconteceAoAceitar", () => {
  const local = (a: number, m: number, d: number, h: number, min: number) =>
    new Date(a, m - 1, d, h, min).toISOString();
  const agora = new Date(2026, 9, 10, 15, 6).getTime(); // 10/10 15:06

  it("desired_time amanha: fica agendado, mesmo com expires_at preenchido", () => {
    const amanha = { desired_time: local(2026, 10, 11, 10, 0), expires_at: local(2026, 10, 11, 10, 0) };
    expect(ehDeOutroDia(amanha, agora)).toBe(true);
    expect(oQueAconteceAoAceitar(amanha, agora)).toBe("fica agendado para esse dia");
  });

  // avisos-de-agenda-e-solicitacao (Backend 651514f): o dia pedido estava fechado.
  it("solicitacao de outro dia (agenda_requested): aceitar abre a agenda desse dia", () => {
    const amanha = {
      desired_time: local(2026, 10, 11, 10, 0),
      expires_at: local(2026, 10, 11, 10, 0),
      agenda_requested: true,
    };
    expect(oQueAconteceAoAceitar(amanha, agora)).toBe("abre a agenda desse dia");
  });

  it("solicitacao de hoje (agenda_requested): o aceite nao abre dia nenhum, entra na fila", () => {
    const hoje = {
      desired_time: local(2026, 10, 10, 18, 0),
      expires_at: local(2026, 10, 10, 18, 0),
      agenda_requested: true,
    };
    expect(oQueAconteceAoAceitar(hoje, agora)).toBe("entra no fim da sua fila");
  });

  it("desired_time hoje: entra no fim da fila", () => {
    const hoje = { desired_time: local(2026, 10, 10, 18, 0), expires_at: local(2026, 10, 10, 18, 0) };
    expect(ehDeOutroDia(hoje, agora)).toBe(false);
    expect(oQueAconteceAoAceitar(hoje, agora)).toBe("entra no fim da sua fila");
  });

  it("sem desired_time: entra no fim da fila", () => {
    expect(ehDeOutroDia({ desired_time: null, expires_at: local(2026, 10, 10, 15, 11) }, agora)).toBe(false);
    expect(ehDeOutroDia({ expires_at: local(2026, 10, 10, 15, 11) }, agora)).toBe(false);
  });

  it("desired_time invalido: entra no fim da fila", () => {
    expect(ehDeOutroDia({ desired_time: "banana", expires_at: null }, agora)).toBe(false);
  });

  it("legado (antes do BAK-1): expires_at nulo sem desired_time conta como outro dia", () => {
    expect(ehDeOutroDia({ expires_at: null }, agora)).toBe(true);
    expect(oQueAconteceAoAceitar({ expires_at: null }, agora)).toBe("fica agendado para esse dia");
  });
});

// O selo do card: ate 60 min, o relogio em minutos; mais longe, a hora em que
// o pedido vence ("vale até 10:00"); sem vencimento (legado), "sem prazo".
describe("seloDoPrazo", () => {
  const local = (a: number, m: number, d: number, h: number, min: number) =>
    new Date(a, m - 1, d, h, min).toISOString();
  const agora = new Date(2026, 9, 10, 15, 6).getTime();

  it("perto: minutos, urgente ate 2", () => {
    expect(seloDoPrazo(local(2026, 10, 10, 15, 11), agora)).toEqual({ texto: "5 min", urgente: false });
    expect(seloDoPrazo(local(2026, 10, 10, 15, 8), agora)).toEqual({ texto: "2 min", urgente: true });
    expect(seloDoPrazo(local(2026, 10, 10, 16, 6), agora)).toEqual({ texto: "60 min", urgente: false });
  });

  it("longe: a hora em que vence", () => {
    expect(seloDoPrazo(local(2026, 10, 11, 10, 0), agora)).toEqual({ texto: "vale até 10:00", urgente: false });
    expect(seloDoPrazo(local(2026, 10, 10, 18, 30), agora)).toEqual({ texto: "vale até 18:30", urgente: false });
  });

  it("sem vencimento: sem prazo", () => {
    expect(seloDoPrazo(null, agora)).toEqual({ texto: "sem prazo", urgente: false });
  });

  it("data invalida: 0 min, urgente", () => {
    expect(seloDoPrazo("banana", agora)).toEqual({ texto: "0 min", urgente: true });
  });
});

describe("isAgendaReleasePromptEvent", () => {
  it("so o AGENDA_RELEASE_PROMPT do Backend (nao e um CUT_*)", () => {
    expect(isAgendaReleasePromptEvent("AGENDA_RELEASE_PROMPT")).toBe(true);
    expect(isAgendaReleasePromptEvent("CUT_REQUESTED")).toBe(false);
    expect(isAgendaReleasePromptEvent(undefined)).toBe(false);
    expect(isCutRequestEvent("AGENDA_RELEASE_PROMPT")).toBe(false);
  });
});
