import { useState } from "react";
import { Modal, View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { useTema } from "@hooks/useTema";
import { NwInput } from "@components/nw/Input";

type Props = {
  visible: boolean;
  isDeleting?: boolean;
  /** Erro vindo do backend (senha errada, bloqueio 409). */
  error?: string | null;
  onConfirm: (currentPassword: string) => void;
  onClose: () => void;
};

// Confirmacao para apagar a conta — espelho do DeleteAccountModal do client,
// com os mesmos textos. Pede a SENHA ATUAL porque o backend exige (07/08): o
// app fica logado por muito tempo e apagar e irreversivel.
//
// O texto diz o que REALMENTE acontece: o backend anonimiza, e o atendimento
// sobrevive sem o nome. "Todos os seus dados serao perdidos" seria mentira.
// `Alert.prompt` nao serve: so existe no iOS.
export function ExcluirContaModal({ visible, isDeleting, error, onConfirm, onClose }: Props) {
  const { veu } = useTema();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
        <View className="bg-vupth-painel rounded-card p-6 gap-3">
          <Text className="font-heading text-lg text-vupth-textPrimary">Deletar conta</Text>

          <Text className="font-body text-sm text-vupth-textSecondary">
            Seus dados pessoais serão apagados e você sairá do app. Os atendimentos que você já fez
            continuam no histórico do estabelecimento, sem o seu nome.
          </Text>
          <Text className="font-body text-sm text-vupth-textSecondary">
            Para confirmar que é você, digite sua senha atual.
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

          <NwButton
            title={isDeleting ? "Deletando..." : "Deletar minha conta"}
            variant="outlineDanger"
            disabled={password.length === 0 || isDeleting}
            onPress={confirm}
            testID="delete-account-confirm"
          />
          <NwButton title="Cancelar" variant="secondaryPainel" onPress={close} disabled={isDeleting} />
        </View>
      </View>
    </Modal>
  );
}
