import { useState } from "react";
import { Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";
import { NwInput } from "@components/nw/Input";

type Props = {
  visible: boolean;
  nomeDaLoja: string;
  isDeleting?: boolean;
  /** Erro vindo do backend (senha errada, fila aberta 409). */
  error?: string | null;
  onConfirm: (currentPassword: string) => void;
  onClose: () => void;
};

// desativar-conta (c0f5b17, item 5): excluir a loja e irreversivel. O corpo e
// uma linha; a equipe que sai e e avisada e o historico que fica como "Loja
// removida" (os atendimentos sao tambem do cliente e do profissional) sao o que
// o Suporte explica. Falta o artigo da loja (so ha o da conta), entao ainda nao
// ha "Saiba mais" aqui. O campo ja se chama "Senha atual": a frase mandando
// digita-la saiu (guia de texto, regra 3).
export function ApagarLojaModal({ visible, nomeDaLoja, isDeleting, error, onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("");

  function close() {
    setPassword("");
    onClose();
  }

  function confirm() {
    if (password.length === 0 || isDeleting) return;
    onConfirm(password);
  }

  return (
    <ModalBase
      visible={visible}
      aoFechar={close}
      titulo="Excluir loja"
      rodape={
        <>
          <NwButton
            title="Excluir"
            variant="outlineDanger"
            isLoading={isDeleting}
            disabled={password.length === 0}
            onPress={confirm}
            testID="delete-store-confirm"
          />
          <NwButton title="Cancelar" variant="secondaryPainel" onPress={close} disabled={isDeleting} />
        </>
      }
    >
      <Text className="font-body text-sm text-vupth-textSecondary">
        {nomeDaLoja} sai do app. O histórico fica.
      </Text>

      <NwInput
        label="Senha atual"
        placeholder="Senha atual"
        value={password}
        onChangeText={setPassword}
        secure
        autoCapitalize="none"
        testID="delete-store-password"
      />

      {error && (
        <Text testID="delete-store-error" className="font-body text-xs text-vupth-danger">
          {error}
        </Text>
      )}
    </ModalBase>
  );
}
