import { useState } from "react";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { reportarProblema } from "@lib/sentry";
import { avisar } from "@lib/confirmar";
import { ModalBase } from "@components/ModalBase";

// sentry-feedback-do-usuario (Andre, 22/10): "Reportar problema" em Configuracoes.
// Nome opcional e a mensagem; vai ao Sentry com o ultimo erro e a tela. Complementa
// o formulario do Suporte, nao o substitui.
export function ReportarProblema({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
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
    <ModalBase
      visible={visivel}
      aoFechar={fechar}
      titulo="Reportar problema"
      rodape={
        <>
          <NwButton title="Enviar" onPress={enviar} disabled={!mensagem.trim()} testID="reportar-enviar" />
          <NwButton title="Cancelar" variant="vupthSecondary" onPress={fechar} testID="reportar-cancelar" />
        </>
      }
    >
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
    </ModalBase>
  );
}
