import { activeCutRequests, minutesToExpire, cutRequestServices } from "../cutRequests";
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

  it("descarta expires_at invalido (nao mantem lixo na tela)", () => {
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

  it("data invalida -> 0", () => {
    expect(minutesToExpire("banana", NOW)).toBe(0);
  });
});

describe("cutRequestServices", () => {
  const myServices = [
    { id: "svc-1", customName: "Corte" },
    { id: "svc-2", customName: "Barba" },
  ];

  it("resolve os ids contra os servicos do profissional", () => {
    expect(cutRequestServices(["svc-1", "svc-2"], myServices)).toBe("Corte + Barba");
  });

  it("ignora id desconhecido, mantendo os conhecidos", () => {
    expect(cutRequestServices(["svc-1", "svc-x"], myServices)).toBe("Corte");
  });

  it("nada resolvido ganha rotulo generico (card nao fica em branco)", () => {
    expect(cutRequestServices(["svc-x"], myServices)).toBe("Servico nao identificado");
    expect(cutRequestServices([], myServices)).toBe("Servico nao identificado");
  });
});
