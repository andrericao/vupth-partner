import { useEffect, useState } from "react";
import { View, Text } from "react-native";

import {
  useWsDiagnosticsStore,
  heartbeatOf,
  type WsChannel,
  type WsChannelState,
} from "@store/wsDiagnostics.store";
import { veredictoDoCanal, desdeQuando, type NivelVeredito } from "@lib/diagnosticoVeredito";

// Painel de diagnostico do tempo real, atras dos 7 toques na versao (tela
// Sistema). Nasceu como o "Teste 0" do backend (05/08): os logs de WS sao
// gated por `__DEV__` e o QA roda bundle de OTA, entao o frame CONNECTED
// precisava virar tela.
//
// 🔁 16/09 — mesmo DESENHO do painel do client (Andre: "o sitrep apos os 7
// toques igual ao da outra equipe"). Antes eram linhas soltas, que nao se
// comparavam lado a lado com o client. Agora: um cartao, um veredito por canal,
// as mesmas frases. O que responde cada linha:
//   Canal pessoal    -> S14: conectou com identidade ou como ANONIMO?
//   Heartbeat        -> S17: o servidor manda batida ou 0?
//   Recebidas/ultima -> separa "conectado" de "realmente recebendo".
//
// Diferenca que FICA: no partner os dois canais dividem UMA conexao STOMP (o
// client abre duas), e o snapshot da fila (GET x WS) so existe aqui.

const PONTO: Record<NivelVeredito, string> = {
  ok: "bg-vupth-forest",
  warn: "bg-vupth-warning",
  bad: "bg-vupth-danger",
  idle: "bg-vupth-textSecondary",
};

const FUNDO: Record<NivelVeredito, string> = {
  ok: "bg-vupth-greenTint",
  warn: "bg-vupth-warning",
  bad: "bg-vupth-dangerTint",
  idle: "bg-white",
};

function Canal({
  canal,
  rotulo,
  estado,
  agora,
}: {
  canal: WsChannel;
  rotulo: string;
  estado: WsChannelState;
  agora: number;
}) {
  const veredito = veredictoDoCanal(canal, estado);
  const heartbeat = heartbeatOf(estado.headers);

  return (
    <View className="gap-1" testID={`ws-diag-${canal}`}>
      <View className="flex-row items-center gap-2">
        <View className={`w-2 h-2 rounded-full ${PONTO[veredito.level]}`} />
        <Text className="font-heading text-sm text-vupth-forest">{rotulo}</Text>
      </View>
      <View className={`rounded-lg px-3 py-2 ${FUNDO[veredito.level]}`}>
        <Text
          testID={`ws-diag-${canal}-veredito`}
          className={`font-body text-xs ${
            veredito.level === "idle" ? "text-vupth-textSecondary" : "text-vupth-forest"
          }`}
        >
          {veredito.message}
        </Text>
      </View>
      <Text testID={`ws-diag-${canal}-contagem`} className="font-body text-xs text-vupth-textSecondary">
        {`${estado.messageCount} recebidas · última ${desdeQuando(estado.lastMessageAt, agora)}`}
        {heartbeat ? ` · heart-beat ${heartbeat}` : ""}
      </Text>

      {/* O MOTIVO da falha — sem ele o painel diz so "falhou o handshake". */}
      {estado.lastError && (
        <Text testID={`ws-diag-${canal}-error`} className="font-body text-xs text-vupth-danger">
          {estado.lastError}
        </Text>
      )}
    </View>
  );
}

export function WsDiagnostics() {
  const pub = useWsDiagnosticsStore((s) => s.public);
  const pessoal = useWsDiagnosticsStore((s) => s.personal);
  const snapshotGet = useWsDiagnosticsStore((s) => s.snapshotGet);
  const snapshotWs = useWsDiagnosticsStore((s) => s.snapshotWs);

  // Tempo relativo ("há 12s") sem tick congelaria na hora em que a tela abriu.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <View className="mt-8 gap-3" testID="ws-diagnostics">
      <View>
        <Text className="font-heading text-base text-vupth-forest mb-1">
          Tempo real (diagnóstico)
        </Text>
        <Text className="font-body text-xs text-vupth-textSecondary">
          Estado da conexão que traz a fila sem precisar recarregar.
        </Text>
      </View>

      <View className="bg-vupth-surface rounded-card p-4 gap-4">
        <Canal canal="personal" rotulo="Canal pessoal (seus avisos)" estado={pessoal} agora={agora} />
        <View className="h-px bg-vupth-border" />
        <Canal canal="public" rotulo="Fila do estabelecimento" estado={pub} agora={agora} />

        {/* O snapshot da fila, por origem: separa "o backend nao manda
            `current_attendance`" de "o WS apaga o que o GET trouxe" — a
            pergunta do "finalizar" desde 31/08. Ver snapshotDiag.ts. */}
        {(snapshotGet || snapshotWs) && (
          <>
            <View className="h-px bg-vupth-border" />
            <View className="gap-1">
              <Text className="font-heading text-sm text-vupth-forest">Snapshot da fila</Text>
              {snapshotGet && (
                <Text testID="ws-diag-snapshot-get" className="font-mono text-xs text-vupth-textSecondary">
                  {snapshotGet.linha}
                </Text>
              )}
              {snapshotWs && (
                <Text testID="ws-diag-snapshot-ws" className="font-mono text-xs text-vupth-textSecondary">
                  {snapshotWs.linha}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
