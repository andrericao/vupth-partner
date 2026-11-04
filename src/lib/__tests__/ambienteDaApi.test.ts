import fs from "fs";
import path from "path";

import { ambienteDaApiConfere } from "../ambienteDaApi";

// checar-ambiente-da-api (F20, DEC-184): o build de producao recusa seguir se
// GET /actuator/info disser env=staging. So recusa com a prova.
const resposta = (body: unknown, ok = true) => ({ ok, json: async () => body });

describe("ambienteDaApiConfere", () => {
  it("recusa o build de producao quando a API diz staging", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(resposta({ env: "staging" }));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", url: "x", fetchImpl })).resolves.toBe(false);
    expect(fetchImpl).toHaveBeenCalledWith("x", expect.any(Object));
  });

  it("recusa mesmo com espaco e maiuscula", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(resposta({ env: " Staging " }));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl })).resolves.toBe(false);
  });

  it("segue quando a API de producao diz production", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(resposta({ env: "production" }));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl })).resolves.toBe(true);
  });

  it("segue sem o campo env (Backend antigo)", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(resposta({ git: {} }));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl })).resolves.toBe(true);
  });

  it("segue com corpo que nao e JSON", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error("x"); } });
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl })).resolves.toBe(true);
  });

  it("segue com erro HTTP e com falha de rede", async () => {
    const http = jest.fn().mockResolvedValue(resposta({ env: "staging" }, false));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl: http })).resolves.toBe(true);
    const rede = jest.fn().mockRejectedValue(new Error("offline"));
    await expect(ambienteDaApiConfere({ apiEnv: "prod", fetchImpl: rede })).resolves.toBe(true);
  });

  it("fora da producao nem pergunta", async () => {
    const fetchImpl = jest.fn();
    await expect(ambienteDaApiConfere({ apiEnv: "staging", fetchImpl })).resolves.toBe(true);
    await expect(ambienteDaApiConfere({ apiEnv: "local", fetchImpl })).resolves.toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("o portao da abertura so abre com o ambiente conferido", () => {
    const tela = fs.readFileSync(path.resolve(__dirname, "../../../app/index.tsx"), "utf8");
    expect(tela).toContain("ambienteDaApiConfere()");
    expect(tela).toMatch(/setPhase\(ambienteOk \? "ready" : "failed"\)/);
  });
});
