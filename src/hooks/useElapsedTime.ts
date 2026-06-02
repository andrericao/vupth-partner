import { useState, useEffect, useRef } from "react";

export function useElapsedTime(startTime: string | null, isPaused: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const start = new Date(startTime).getTime();

    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isPaused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, minutes, seconds, formatted };
}
