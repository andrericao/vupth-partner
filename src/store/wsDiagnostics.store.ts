import { create } from "zustand";

// Instrumentacao do WebSocket para o QA de device (plano de teste combinado com
// o backend em 2026-08-05). ESPELHA o `wsDiagnosticsStore` do front-CLIENT — os
// mesmos canais e os mesmos nomes de acao — porque o Teste 2 e um A/B entre os
// dois apps: se cada um reportar de um jeito, a comparacao nao vale.
//
// Por que store e UI, e nao console.log: os logs de WS aqui sao gated por
// `__DEV__`, e o QA roda em bundle de OTA (producao), onde nada apareceria.
//
// Os dois canais compartilham UMA conexao STOMP no partner (o client abre duas,
// C17): "public" = /topic/establishment/{id}/queue · "personal" =
// /user/queue/notifications.
export type WsChannel = "public" | "personal";

export type WsChannelState = {
  connected: boolean;
  /** Headers do frame CONNECTED — `heart-beat` (S17) e `user-name` (S14). */
  headers: Record<string, string> | null;
  connectedAt: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  lastError: string | null;
  closedAt: string | null;
};

const emptyChannel = (): WsChannelState => ({
  connected: false,
  headers: null,
  connectedAt: null,
  lastMessageAt: null,
  messageCount: 0,
  lastError: null,
  closedAt: null,
});

/**
 * Ultima leitura do snapshot da fila, por origem. Existe para responder no
 * APARELHO a pergunta que trava o "finalizar" desde 31/08: o
 * `current_attendance` nao vem do backend, ou vem e o WS apaga? (o socket faz
 * `setQueryData` SEM merge). Ver src/lib/snapshotDiag.ts.
 */
export type SnapshotDiag = { linha: string; em: string } | null;

/** Ultimo resultado da aquisicao do token de push. Ver src/lib/push.ts. */
export type PushDiag = { estado: string; detalhe?: string; em: string } | null;

type WsDiagnosticsState = {
  public: WsChannelState;
  personal: WsChannelState;
  snapshotGet: SnapshotDiag;
  snapshotWs: SnapshotDiag;
  push: PushDiag;
  marcarSnapshot: (origem: "GET" | "WS", linha: string) => void;
  marcarPush: (estado: string, detalhe?: string) => void;
  markConnected: (channel: WsChannel, headers?: Record<string, string>) => void;
  markMessage: (channel: WsChannel) => void;
  markError: (channel: WsChannel, message: string) => void;
  markClosed: (channel: WsChannel) => void;
  reset: () => void;
};

export const useWsDiagnosticsStore = create<WsDiagnosticsState>((set) => ({
  public: emptyChannel(),
  personal: emptyChannel(),
  snapshotGet: null,
  snapshotWs: null,
  push: null,

  marcarPush: (estado, detalhe) =>
    set({ push: { estado, detalhe, em: new Date().toISOString() } }),

  marcarSnapshot: (origem, linha) =>
    set(() =>
      origem === "GET"
        ? { snapshotGet: { linha, em: new Date().toISOString() } }
        : { snapshotWs: { linha, em: new Date().toISOString() } }
    ),

  // Conectar LIMPA o ultimo erro: sem isso, uma falha de handshake no boot (o
  // caso comum — Render hibernado) ficava na tela p/ sempre e o `reconnectDelay`
  // reconectava por baixo sem que a linha mudasse. Lia-se "WS conectado ·
  // ultimo erro: falha no handshake" ao mesmo tempo, o que faz o diagnostico
  // acusar defeito que ja passou.
  markConnected: (channel, headers) =>
    set((s) => ({
      [channel]: {
        ...s[channel],
        connected: true,
        headers: headers ?? {},
        connectedAt: new Date().toISOString(),
        closedAt: null,
        lastError: null,
      },
    })),

  markMessage: (channel) =>
    set((s) => ({
      [channel]: {
        ...s[channel],
        lastMessageAt: new Date().toISOString(),
        messageCount: s[channel].messageCount + 1,
      },
    })),

  markError: (channel, message) =>
    set((s) => ({ [channel]: { ...s[channel], lastError: message } })),

  // Fecha o canal mas PRESERVA a contagem: o historico da sessao e a evidencia
  // do teste ("chegou alguma coisa antes de morrer?").
  markClosed: (channel) =>
    set((s) => ({
      [channel]: { ...s[channel], connected: false, closedAt: new Date().toISOString() },
    })),

  reset: () =>
    set({
      public: emptyChannel(),
      personal: emptyChannel(),
      snapshotGet: null,
      snapshotWs: null,
      push: null,
    }),
}));

/** `heart-beat` que o SERVIDOR respondeu. `0,0` = heartbeat desligado (S17). */
export function heartbeatOf(headers: Record<string, string> | null): string | null {
  return headers?.["heart-beat"] ?? null;
}

/** `user-name` do CONNECTED. Ausente = a sessao subiu ANONIMA (S14). */
export function principalOf(headers: Record<string, string> | null): string | null {
  return headers?.["user-name"] ?? null;
}
