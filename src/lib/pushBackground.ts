import { resolverAcaoDoPush } from "@lib/pushDecisao";

// push-resolve-sem-abrir-o-app (Andre, 24/10): a tarefa de notificacao em segundo plano.
// No Android, o botao do push (Aceitar, Recusar, Confirmar) com o app em segundo plano ou
// fechado roda esta tarefa em vez de abrir o app. A tarefa tem de ser DEFINIDA no escopo do
// modulo (antes de qualquer tela) e REGISTRADA com Notifications.registerTaskAsync.
//
// Carga preguicosa e com try/catch, como o expo-notifications: um OTA novo sobre um APK
// velho (sem o modulo nativo) nao pode derrubar o app no import. Build novo: versao 1.6.0.
export const TAREFA_DO_PUSH = "VUPTH-PUSH-ACAO";

const TaskManager: typeof import("expo-task-manager") | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-task-manager");
  } catch {
    return null;
  }
})();

/** Define a tarefa; devolve false se o binario nao tem o modulo nativo. */
export function definirTarefaDoPush(): boolean {
  try {
    if (!TaskManager) return false;
    if (TaskManager.isTaskDefined(TAREFA_DO_PUSH)) return true;
    TaskManager.defineTask(TAREFA_DO_PUSH, async ({ data, error }: { data: any; error: unknown }) => {
      if (error || !data) return;
      await resolverAcaoDoPush(data);
    });
    return true;
  } catch {
    return false;
  }
}
