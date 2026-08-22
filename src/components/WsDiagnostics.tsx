import { View, Text } from "react-native";
import {
  useWsDiagnosticsStore,
  heartbeatOf,
  principalOf,
} from "@store/wsDiagnostics.store";

// Linha de diagnostico do WebSocket para o QA de DEVICE (plano combinado com o
// backend, 2026-08-05). Vive em Configuracoes, junto do id do OTA.
//
// Existe porque os logs de WS sao gated por `__DEV__` e o QA roda em bundle de
// OTA (producao) — sem isto, os testes 1-5 viram adivinhacao. O que interessa:
//   · `heart-beat` que o SERVIDOR respondeu — `0,0` era o S17 (agora fechado);
//   · `user-name` — ausente significa sessao ANONIMA, que e o sintoma do S14;
//   · contagem por canal — o publico chegar e o pessoal nao e a assinatura
//     exata do bug que perseguimos desde 01/08.
//
// RN puro (sem gluestack/NativeWind): a tela que o hospeda ainda e v1, e este
// componente atravessa a migracao sem retoque.
export function WsDiagnostics() {
  const pub = useWsDiagnosticsStore((s) => s.public);
  const personal = useWsDiagnosticsStore((s) => s.personal);

  const headers = pub.headers ?? personal.headers;
  const heartbeat = heartbeatOf(headers);
  const principal = principalOf(headers);
  const connected = pub.connected || personal.connected;
  const lastError = pub.lastError ?? personal.lastError;

  const line = { color: "#a3a3a3", fontSize: 11, textAlign: "center" as const };

  return (
    <View style={{ marginTop: 12, alignItems: "center", gap: 2 }}>
      <Text testID="ws-diag-status" style={line}>
        WS {connected ? "conectado" : "desconectado"}
        {heartbeat ? ` · heart-beat ${heartbeat}` : ""}
      </Text>

      {connected && (
        <Text style={line}>
          {principal ? `sessão autenticada (${principal.slice(0, 8)})` : "sessão ANONIMA — sem user-name"}
        </Text>
      )}

      <Text style={line}>
        <Text testID="ws-diag-public">fila {pub.messageCount}</Text>
        {" · "}
        <Text testID="ws-diag-personal">pessoal {personal.messageCount}</Text>
        {" msg"}
      </Text>

      {lastError && (
        <Text style={{ ...line, color: "#E63946" }}>último erro: {lastError}</Text>
      )}
    </View>
  );
}
