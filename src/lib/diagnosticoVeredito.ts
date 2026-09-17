import type { WsChannel, WsChannelState } from "@store/wsDiagnostics.store";
import { heartbeatOf, principalOf } from "@store/wsDiagnostics.store";

// Traducao do estado de um canal para a frase que decide o teste. ESPELHA o
// `channelVerdict` do client (src/domain/ws/diagnostics.ts) — as mesmas frases,
// porque o teste de tempo real e um A/B entre os dois apps (Andre 16/09: "o
// sitrep apos os 7 toques igual ao da outra equipe").
//
// A diferenca e so a entrada: o client guarda um `status`; aqui o store guarda
// `connected` + `lastError`, e o status sai deles.

export type NivelVeredito = "ok" | "warn" | "bad" | "idle";
export type Veredito = { level: NivelVeredito; message: string };

export function veredictoDoCanal(canal: WsChannel, estado: WsChannelState): Veredito {
  if (!estado.connected) {
    if (estado.lastError) {
      return { level: "bad", message: "Falhou o handshake — nem chegou a conectar" };
    }
    return { level: "idle", message: "Sem conexão (nenhuma fila ativa)" };
  }
  if (!estado.headers || Object.keys(estado.headers).length === 0) {
    return { level: "warn", message: "Conectado, mas sem o frame CONNECTED" };
  }

  const usuario = principalOf(estado.headers)?.trim() || null;
  // S14: so o canal pessoal depende de identidade.
  if (canal === "personal" && !usuario) {
    return {
      level: "bad",
      message:
        "Conectado como ANÔNIMO — o servidor aceitou sem identificar quem é. As notificações pessoais NÃO vão chegar (S14).",
    };
  }

  const enviaMs = Number.parseInt((heartbeatOf(estado.headers) ?? "").split(",")[0], 10) || 0;
  if (enviaMs === 0) {
    return {
      level: "warn",
      message:
        "Conectado, mas o servidor não manda heartbeat (0). Se a conexão cair, o app pode não perceber (S17).",
    };
  }

  return {
    level: "ok",
    message: `Conectado${usuario ? ` como ${usuario}` : ""}, heartbeat de ${enviaMs / 1000}s`,
  };
}

/** "há 12s" / "há 3min" — o painel diz se algo AINDA esta chegando. */
export function desdeQuando(iso: string | null, agora: number = Date.now()): string {
  if (!iso) return "nunca";
  const segundos = Math.max(0, Math.round((agora - Date.parse(iso)) / 1000));
  if (segundos < 60) return `há ${segundos}s`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `há ${minutos}min`;
  return `há ${Math.round(minutos / 60)}h`;
}

/** "ExponentPushToken[xxxxxxxx]" → os ultimos 8 antes do colchete. */
export function sufixoDoToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const miolo = token.replace(/^ExponentPushToken\[/, "").replace(/\]$/, "");
  return miolo.slice(-8);
}
