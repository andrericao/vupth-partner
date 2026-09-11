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
// Traducao dos estados para quem le no aparelho. "a chamada nativa falhou" e o
// texto que o time do client usa do lado deles — mesma frase, para a comparacao
// entre os dois apps valer.
const ROTULO_PUSH: Record<string, string> = {
  "sem-aparelho": "emulador/web — não recebe push",
  "sem-permissao": "permissão negada no aparelho",
  falhou: "a chamada nativa falhou",
  obtido: "token obtido",
  registrado: "token obtido e registrado",
};

export function WsDiagnostics() {
  const pub = useWsDiagnosticsStore((s) => s.public);
  const personal = useWsDiagnosticsStore((s) => s.personal);
  const snapshotGet = useWsDiagnosticsStore((s) => s.snapshotGet);
  const snapshotWs = useWsDiagnosticsStore((s) => s.snapshotWs);
  const push = useWsDiagnosticsStore((s) => s.push);

  const headers = pub.headers ?? personal.headers;
  const heartbeat = heartbeatOf(headers);
  const principal = principalOf(headers);
  const connected = pub.connected || personal.connected;
  const lastError = pub.lastError ?? personal.lastError;

  // $brandTextSecondary. Era #a3a3a3 (2,5:1 no branco) — ilegivel pro QA em
  // device, que e justamente quem le esta linha.
  const line = { color: "#454745", fontSize: 11, textAlign: "center" as const };

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

      {/* O snapshot da fila, por origem. Duas linhas que separam "o backend
          nao manda `current_attendance`" de "o WS apaga o que o GET trouxe" —
          a pergunta que trava o "finalizar" desde 31/08. Ver snapshotDiag.ts. */}
      {(snapshotGet || snapshotWs) && (
        <View style={{ marginTop: 6, alignItems: "center", gap: 1 }}>
          {snapshotGet && (
            <Text testID="ws-diag-snapshot-get" style={line}>
              {snapshotGet.linha}
            </Text>
          )}
          {snapshotWs && (
            <Text testID="ws-diag-snapshot-ws" style={line}>
              {snapshotWs.linha}
            </Text>
          )}
        </View>
      )}

      {/* PUSH (A6): a aquisicao do token era silenciosa — o hook engolia a
          excecao e a tela nao dizia nada. Esta linha separa "o aparelho negou a
          permissao" de "a chamada nativa falhou", que e o sintoma do Firebase
          ausente. Ver src/lib/push.ts. */}
      {push && (
        <Text testID="ws-diag-push" style={line}>
          push: {ROTULO_PUSH[push.estado] ?? push.estado}
          {push.detalhe ? ` · ${push.detalhe}` : ""}
        </Text>
      )}

      {lastError && (
        <Text style={{ ...line, color: "#B3261E" }}>último erro: {lastError}</Text>
      )}
    </View>
  );
}
