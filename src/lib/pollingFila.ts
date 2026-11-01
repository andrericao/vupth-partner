import { AppState, type AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";

// Com o socket STOMP de pe, o servidor empurra cada mudanca da fila: o polling
// vira so uma rede de seguranca lenta (socket "zumbi"). Caido, volta ao ritmo
// normal. (estudo-desempenho, item 4)
export const REDE_DE_SEGURANCA_MS = 300_000;

export function intervaloDaFila(baseMs: number, socketConectado: boolean): number {
  return socketConectado ? REDE_DE_SEGURANCA_MS : baseMs;
}

/** Funcao para o `refetchInterval` do react-query: le o socket a cada ciclo. */
export function intervaloDaFilaAoVivo(baseMs: number): () => number {
  return () => intervaloDaFila(baseMs, useWsDiagnosticsStore.getState().public.connected);
}

/**
 * Em segundo plano o react-query nao deve consultar: no RN o foco nao existe
 * sozinho, entao ligamos o `focusManager` ao AppState. Ao voltar, o proprio
 * useQueueSocket ja invalida a fila.
 */
export function ligarFocoAoAppState(): () => void {
  const sub = AppState.addEventListener("change", (estado: AppStateStatus) => {
    focusManager.setFocused(estado === "active");
  });
  return () => sub.remove();
}
