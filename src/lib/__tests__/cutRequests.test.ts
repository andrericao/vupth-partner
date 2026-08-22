import {
  activeCutRequests,
  minutesToExpire,
  cutRequestServices,
  cutRequestTitle,
  cutRequestClientName,
  cutRequestTotal,
  isCutRequestEvent,
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
