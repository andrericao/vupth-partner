import { useState } from "react";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { ModalBase } from "@components/ModalBase";
import { avisar } from "@lib/confirmar";
import { enviarFeedback, FEEDBACK_MAX } from "@lib/feedbackPorEmail";

// feedback-no-app (PAR-8, DEC-167): em Perfil, caixa de texto e enviar, sem sair do app;
// confirma com "Obrigado". Só logado (o Perfil já é).
export function EnviarFeedback({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fechar = () => {
    setTexto("");
    onFechar();
  };

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    const r = await enviarFeedback(texto);
    setEnviando(false);
    if (r.ok) {
      fechar();
      await avisar({ titulo: "Obrigado", mensagem: "Recebemos o seu feedback." });
    } else {
      await avisar({ titulo: "Não enviou", mensagem: r.mensagem });
    }
  };

  return (
    <ModalBase
      visible={visivel}
      aoFechar={fechar}
      titulo="Enviar feedback"
      rodape={
        <>
          <NwButton
            title="Enviar"
            onPress={enviar}
            isLoading={enviando}
            disabled={!texto.trim()}
            testID="feedback-enviar"
          />
          <NwButton title="Cancelar" variant="vupthSecondary" onPress={fechar} disabled={enviando} testID="feedback-cancelar" />
        </>
      }
    >
      <NwInput
        label="O que você acha do app?"
        placeholder="Conte em poucas palavras"
        value={texto}
        onChangeText={setTexto}
        multiline
        maxLength={FEEDBACK_MAX}
        autoCapitalize="sentences"
        testID="feedback-texto"
      />
    </ModalBase>
  );
}
