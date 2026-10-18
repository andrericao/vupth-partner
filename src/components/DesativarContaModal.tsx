import { useState } from "react";
import { Modal, View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { useTema } from "@hooks/useTema";
import { NwInput } from "@components/nw/Input";

type Props = {
  visible: boolean;
  /** Dono de loja: a loja sai da busca e a equipe e avisada (c0f5b17, item 3). */
  ehDono?: boolean;
  isDeactivating?: boolean;
  /** Erro vindo do backend (senha errada, compromisso vivo 409). */
  error?: string | null;
  onConfirm: (currentPassword: string) => void;
  onClose: () => void;
};

// desativar-conta (contrato do Backend c0f5b17, 08/10): o par reversivel do
// ExcluirContaModal. Pede a senha atual (o backend exige) e diz o que acontece
// de verdade — inclusive com a loja, para o dono.
export function DesativarContaModal({ visible, ehDono, isDeactivating, error, onConfirm, onClose }: Props) {
  const { veu } = useTema();
  const [password, setPassword] = useState("");

  function close() {
    setPassword("");
    onClose();
  }

  function confirm() {
    if (password.length === 0 || isDeactivating) return;
    onConfirm(password);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
        <View className="bg-vupth-painel rounded-card p-6 gap-3">
          <Text className="font-heading text-lg text-vupth-textPrimary">Desativar conta</Text>

          <Text className="font-body text-sm text-vupth-textSecondary">
            Você sai do app e deixa de receber avisos. Nada é apagado: para voltar, é só entrar de
            novo com o seu e-mail e senha.
          </Text>
          {ehDono && (
            <Text className="font-body text-sm text-vupth-textSecondary">
              Enquanto isso, sua loja sai da busca dos clientes e os profissionais dela são avisados.
            </Text>
          )}
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
            testID="deactivate-account-password"
          />

          {error && (
            <Text testID="deactivate-account-error" className="font-body text-xs text-vupth-danger">
              {error}
            </Text>
          )}

          <NwButton
            title={isDeactivating ? "Desativando..." : "Desativar minha conta"}
            disabled={password.length === 0 || isDeactivating}
            onPress={confirm}
            testID="deactivate-account-confirm"
          />
          <NwButton title="Cancelar" variant="secondaryPainel" onPress={close} disabled={isDeactivating} />
        </View>
      </View>
    </Modal>
  );
}
