import { useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";

// Tempo corrido do atendimento — roda 100% no FRONT a partir de um instante de
// inicio CACHEADO (igual ao front-client). Assim o cronometro nao depende do
// backend mandar `startTime` a cada poll/WS (se vier null, travava em 00:00).
//
// Cache em memoria (sessao) + SecureStore (sobrevive a restart do app). Prefere
// o `startTime` do backend quando existe; senao fixa "agora" na 1a vez que o
// atendimento aparece em andamento.
const mem = new Map<string, number>();
const keyFor = (id: string) => `att_start_${id}`;

async function resolveStartMs(id: string, backendStartIso: string | null): Promise<number> {
  const cached = mem.get(id);
  if (cached !== undefined) return cached;
  try {
    const stored = await SecureStore.getItemAsync(keyFor(id));
    if (stored) {
      const ms = Number(stored);
      if (!Number.isNaN(ms)) {
        mem.set(id, ms);
        return ms;
      }
    }
  } catch {}
  const ms = backendStartIso ? new Date(backendStartIso).getTime() : Date.now();
  mem.set(id, ms);
  SecureStore.setItemAsync(keyFor(id), String(ms)).catch(() => {});
  return ms;
}

/** Limpa o inicio cacheado de um atendimento (chamar ao finalizar). */
export function clearAttendanceStart(id: string) {
  mem.delete(id);
  SecureStore.deleteItemAsync(keyFor(id)).catch(() => {});
}

/**
 * Segundos de atendimento: relogio menos o tempo pausado. Nunca negativo.
 * Puro, para o A4 poder ser testado sem timer.
 */
export function segundosDecorridos(startMs: number, agoraMs: number, pausadoMs: number): number {
  return Math.max(0, Math.floor((agoraMs - startMs - pausadoMs) / 1000));
}

/**
 * 🔴 A4 (backend, 16/09): pausado, o cronometro tem de PARAR. Ele contava
 * "agora − inicio": enquanto pausado o intervalo parava, mas qualquer
 * re-renderizacao mostrava o numero maior, e ao retomar o tempo da pausa
 * entrava na conta de vez.
 *
 * Agora o tempo pausado e descontado. Ele e medido AQUI (os segundos de cada
 * pausa, somados) e tem como piso o `pausedTimeMinutes` que o backend manda —
 * que cobre o caso de reabrir o app no meio de uma pausa, quando o acumulado
 * local se perde, e o de a pausa ter comecado em outro aparelho.
 */
export function useElapsedTime(
  attendanceId: string | null,
  startTime: string | null,
  isPaused: boolean,
  pausedTimeMinutes?: number | null
) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Pausas ja fechadas (ms) e o inicio da pausa em curso.
  const pausadoRef = useRef(0);
  const pausaAtualRef = useRef<number | null>(null);

  // Escrita de ref fora do render (regra do react-hooks/refs).
  useEffect(() => {
    pausadoRef.current = 0;
    pausaAtualRef.current = null;
  }, [attendanceId]);

  useEffect(() => {
    if (isPaused) {
      pausaAtualRef.current = Date.now();
    } else if (pausaAtualRef.current !== null) {
      pausadoRef.current += Date.now() - pausaAtualRef.current;
      pausaAtualRef.current = null;
    }
  }, [isPaused]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!attendanceId) {
      // sem atendimento ativo: zera o cronometro (reset intencional).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsed(0);
      return;
    }

    let cancelled = false;
    resolveStartMs(attendanceId, startTime).then((startMs) => {
      if (cancelled) return;
      const tick = () => {
        const agora = Date.now();
        const emCurso = pausaAtualRef.current === null ? 0 : agora - pausaAtualRef.current;
        const pausadoMs = Math.max(
          pausadoRef.current + emCurso,
          (pausedTimeMinutes ?? 0) * 60_000
        );
        setElapsed(segundosDecorridos(startMs, agora, pausadoMs));
      };
      tick();
      // Pausado o numero nao muda (o desconto cresce junto), entao nao ha por
      // que manter o intervalo de 1s rodando.
      if (!isPaused) intervalRef.current = setInterval(tick, 1000);
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [attendanceId, startTime, isPaused, pausedTimeMinutes]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, minutes, seconds, formatted };
}
