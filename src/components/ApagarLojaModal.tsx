import { useState } from "react";
import { Modal, View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
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

// desativar-conta (c0f5b17, item 5): apagar a loja e irreversivel. Diz o que
// acontece de verdade: a equipe sai e e avisada, e o historico fica como
// "Loja removida" (os atendimentos sao tambem do cliente e do profissional).
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View className="bg-white rounded-card p-6 gap-3">
          <Text className="font-heading text-lg text-vupth-forest">Apagar a loja</Text>

          <Text className="font-body text-sm text-vupth-textSecondary">
            {nomeDaLoja} sai do app de vez. Os profissionais saem da loja e são avisados. Os
            atendimentos que já aconteceram continuam no histórico, como “Loja removida”.
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
            testID="delete-store-password"
          />

          {error && (
            <Text testID="delete-store-error" className="font-body text-xs text-vupth-danger">
              {error}
            </Text>
          )}

          <NwButton
            title={isDeleting ? "Apagando..." : "Apagar a loja de vez"}
            variant="outlineDanger"
            disabled={password.length === 0 || isDeleting}
            onPress={confirm}
            testID="delete-store-confirm"
          />
          <NwButton title="Cancelar" variant="secondary" onPress={close} disabled={isDeleting} />
        </View>
      </View>
    </Modal>
  );
}
