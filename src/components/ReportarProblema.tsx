import { useState } from "react";
import { Modal, Text, View } from "react-native";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { reportarProblema } from "@lib/sentry";
import { avisar } from "@lib/confirmar";
import { useTema } from "@hooks/useTema";

// sentry-feedback-do-usuario (Andre, 22/10): "Reportar problema" em Configuracoes.
// Nome opcional e a mensagem; vai ao Sentry com o ultimo erro e a tela. Complementa
// o formulario do Suporte, nao o substitui.
export function ReportarProblema({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const { veu } = useTema();
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");

  const fechar = () => {
    setNome("");
    setMensagem("");
    onFechar();
  };

  const enviar = async () => {
    const ok = reportarProblema({ mensagem, nome });
    fechar();
    await avisar(
      ok
        ? { titulo: "Enviado", mensagem: "Obrigado. Vamos olhar." }
        : { titulo: "Não enviou", mensagem: "Tente de novo ou fale com o Suporte." }
    );
  };

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
        <View className="bg-vupth-painel rounded-card p-6 gap-3">
          <Text className="font-heading text-lg text-vupth-textPrimary">Reportar problema</Text>
          <NwInput
            label="Seu nome (opcional)"
            placeholder="Seu nome"
            value={nome}
            onChangeText={setNome}
            testID="reportar-nome"
          />
          <NwInput
            label="O que aconteceu?"
            placeholder="Conte em poucas palavras"
            value={mensagem}
            onChangeText={setMensagem}
            multiline
            autoCapitalize="sentences"
            testID="reportar-mensagem"
          />
          <NwButton title="Enviar" onPress={enviar} disabled={!mensagem.trim()} testID="reportar-enviar" />
          <NwButton title="Cancelar" variant="vupthSecondary" onPress={fechar} testID="reportar-cancelar" />
        </View>
      </View>
    </Modal>
  );
}
