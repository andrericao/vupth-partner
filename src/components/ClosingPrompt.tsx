import { useEffect, useState } from "react";
import { View, Text, Alert, Modal, Pressable } from "react-native";
import { NwButton } from "@components/nw/Button";
import { useUiStore } from "@store/ui.store";
import { useProfessionalStore } from "@store/professional.store";
import { getApiErrorMessage } from "@lib/api";
import { graceSecondsRemaining, graceCountdownLabel } from "@lib/closing";
import { floatingShadow } from "@lib/styles";

/**
 * Prompt de AUTO-FECHAMENTO (BUG1 / S1 fatia 5). Quando o backend manda o WS
 * `CLOSING_PROMPT` (ver useQueueSocket + ui.store), a loja ja passou do horario
 * com o profissional em expediente: a fila foi fechada p/ novos e ha uma
 * carencia de 15min ate o backend por `OFF` sozinho. Este modal mostra o
 * countdown (server-authoritative pelo `graceUntil`) e oferece:
 *  - "Fechar agora" → `PATCH /me/status OFF` (409 se ainda ha atendimento ativo);
 *  - "Continuar atendendo" → so dispensa; a fila segue drenando e o backend
 *    fecha no fim da carencia. Ao zerar o countdown o prompt se fecha sozinho
 *    (o proprio backend ja aplicou o OFF).
 */
export function ClosingPrompt() {
  const graceUntil = useUiStore((s) => s.closingGraceUntil);
  const dismiss = useUiStore((s) => s.dismissClosingPrompt);
  const updateMyStatus = useProfessionalStore((s) => s.updateMyStatus);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [closing, setClosing] = useState(false);

  // Tick de 1s so enquanto ha prompt ativo.
  useEffect(() => {
    if (!graceUntil) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [graceUntil]);

  const remaining = graceSecondsRemaining(graceUntil, nowMs);

  // Carencia acabou: o backend ja fechou (auto-OFF). So encerramos o prompt.
  useEffect(() => {
    if (graceUntil && remaining <= 0) dismiss();
  }, [graceUntil, remaining, dismiss]);

  const onCloseNow = async () => {
    setClosing(true);
    try {
      await updateMyStatus("OFF");
      dismiss();
    } catch (e: any) {
      Alert.alert(
        "Não foi possível fechar",
        getApiErrorMessage(e, "Ainda ha atendimento em andamento — finalize antes de fechar.")
      );
    } finally {
      setClosing(false);
    }
  };

  return (
    <Modal visible={!!graceUntil} transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 justify-center items-center px-4">
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={dismiss}
          accessibilityLabel="Fechar aviso"
        />
        <View className="bg-white rounded-2xl p-5 w-full gap-2" style={floatingShadow}>
          <Text className="font-heading text-lg text-gray-900">
            Passou do horário de fechamento
          </Text>
          <Text className="font-body text-sm text-gray-600">
            A fila já foi fechada para novos clientes. Quem está na fila segue sendo
            atendido. Fecha sozinho em:
          </Text>
          <Text
            accessibilityLabel={`Fecha em ${graceCountdownLabel(remaining)}`}
            className="font-heading text-2xl text-amber-600 text-center my-1"
          >
            {graceCountdownLabel(remaining)}
          </Text>
          <NwButton
            title="Fechar agora"
            onPress={onCloseNow}
            isLoading={closing}
            variant="danger"
          />
          <NwButton
            title="Continuar atendendo"
            onPress={dismiss}
            variant="secondary"
            className="h-10"
          />
        </View>
      </View>
    </Modal>
  );
}
