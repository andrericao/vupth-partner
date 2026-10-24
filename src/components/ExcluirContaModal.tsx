import { useState } from "react";
import { Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";
import { NwInput } from "@components/nw/Input";

type Props = {
  visible: boolean;
  isDeleting?: boolean;
  /** Erro vindo do backend (senha errada, bloqueio 409). */
  error?: string | null;
  onConfirm: (currentPassword: string) => void;
  onClose: () => void;
};

// Confirmacao para excluir a conta — espelho do DeleteAccountModal do client.
// Pede a SENHA ATUAL porque o backend exige (07/08): o app fica logado por
// muito tempo e excluir e irreversivel. O campo ja se chama "Senha atual";
// uma frase mandando digita-la so repetia o rotulo e empurrava o corpo para
// duas linhas (guia de texto, regra 3).
//
// O texto diz o que REALMENTE acontece: o backend anonimiza, e o atendimento
// sobrevive sem o nome. "Todos os seus dados serao perdidos" seria mentira.
// `Alert.prompt` nao serve: so existe no iOS.
export function ExcluirContaModal({ visible, isDeleting, error, onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("");

  function close() {
    setPassword("");
    onClose();
  }

  // Guarda no handler, alem do botao desabilitado.
  function confirm() {
    if (password.length === 0 || isDeleting) return;
    onConfirm(password);
  }

  return (
    <ModalBase
      visible={visible}
      aoFechar={close}
      titulo="Excluir conta"
      rodape={
        <>
          <NwButton
            title="Excluir"
            variant="outlineDanger"
            isLoading={isDeleting}
            disabled={password.length === 0}
            onPress={confirm}
            testID="delete-account-confirm"
          />
          <NwButton title="Cancelar" variant="secondaryPainel" onPress={close} disabled={isDeleting} />
        </>
      }
    >
      <Text className="font-body text-sm text-vupth-textSecondary">
        Seus dados são apagados; o histórico da loja fica sem o seu nome.
      </Text>

      <NwInput
        label="Senha atual"
        placeholder="Senha atual"
        value={password}
        onChangeText={setPassword}
        secure
        autoCapitalize="none"
        testID="delete-account-password"
      />

      {error && (
        <Text testID="delete-account-error" className="font-body text-xs text-vupth-danger">
          {error}
        </Text>
      )}
    </ModalBase>
  );
}
