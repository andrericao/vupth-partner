import { definirTarefaDoPush, TAREFA_DO_PUSH } from "@lib/pushBackground";
import { resolverAcaoDoPush } from "@lib/pushDecisao";
import * as TaskManager from "expo-task-manager";

jest.mock("expo-task-manager", () => ({
  isTaskDefined: jest.fn(() => false),
  defineTask: jest.fn(),
}));
jest.mock("@lib/pushDecisao", () => ({ resolverAcaoDoPush: jest.fn().mockResolvedValue("feito") }));

// push-resolve-sem-abrir-o-app: a tarefa que roda o botao do push com o app fechado.
describe("definirTarefaDoPush", () => {
  beforeEach(() => jest.clearAllMocks());

  it("define a tarefa com o nome combinado", () => {
    expect(definirTarefaDoPush()).toBe(true);
    expect(TaskManager.defineTask).toHaveBeenCalledWith(TAREFA_DO_PUSH, expect.any(Function));
  });

  it("nao define duas vezes", () => {
    (TaskManager.isTaskDefined as jest.Mock).mockReturnValueOnce(true);
    expect(definirTarefaDoPush()).toBe(true);
    expect(TaskManager.defineTask).not.toHaveBeenCalled();
  });

  it("a tarefa entrega a resposta ao resolvedor; com erro ou sem dados, nao faz nada", async () => {
    definirTarefaDoPush();
    const tarefa = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    const resposta = { actionIdentifier: "ACEITAR", notification: { request: { identifier: "n", content: { data: {} } } } };
    await tarefa({ data: resposta, error: null });
    expect(resolverAcaoDoPush).toHaveBeenCalledWith(resposta);
    (resolverAcaoDoPush as jest.Mock).mockClear();
    await tarefa({ data: resposta, error: new Error("x") });
    await tarefa({ data: null, error: null });
    expect(resolverAcaoDoPush).not.toHaveBeenCalled();
  });
});
