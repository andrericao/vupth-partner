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

export function useElapsedTime(
  attendanceId: string | null,
  startTime: string | null,
  isPaused: boolean
) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      tick();
      if (!isPaused) intervalRef.current = setInterval(tick, 1000);
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [attendanceId, startTime, isPaused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, minutes, seconds, formatted };
}
