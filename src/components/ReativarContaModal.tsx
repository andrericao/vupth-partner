import { useState } from "react";
import { Modal, View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { useTema } from "@hooks/useTema";
import { getApiErrorMessage } from "@lib/api";
import type { AvisoDeReativar } from "@store/auth.store";

type Props = {
  aviso: AvisoDeReativar | null;
  onReativar: () => Promise<void>;
  onSoConsultar: () => void;
};

// desativar-conta (Andre, 08/10): "apos logar com a conta desativada, ele recebe
// as boas-vindas e tem a opcao de ativar ou nao, pois pode querer apenas ver
// alguns historicos". "boas-vindas" abre no login; "bloqueado", quando no "So
// consultar" algo da operacao deu 403 ACCOUNT_DEACTIVATED.
export function ReativarContaModal({ aviso, onReativar, onSoConsultar }: Props) {
  const { veu } = useTema();
  const [reativando, setReativando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function reativar() {
    if (reativando) return;
    setReativando(true);
    setErro(null);
    try {
      await onReativar();
    } catch (e) {
      setErro(getApiErrorMessage(e, "Não foi possível reativar a conta."));
    } finally {
      setReativando(false);
    }
  }

  const bloqueado = aviso === "bloqueado";

  return (
    <Modal visible={aviso !== null} transparent animationType="fade" onRequestClose={onSoConsultar}>
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: veu }}>
        <View className="bg-vupth-painel rounded-card p-6 gap-3">
          <Text className="font-heading text-lg text-vupth-textPrimary">
            {bloqueado ? "Sua conta está desativada" : "Bem-vindo de volta"}
          </Text>
          <Text className="font-body text-sm text-vupth-textSecondary">
            {bloqueado
              ? "Para fazer isso, reative a conta. Você também pode só consultar o histórico e os dados."
              : "Sua conta está desativada. Quer reativar agora ou só consultar o histórico e os dados?"}
          </Text>

          {erro && (
            <Text testID="reactivate-error" className="font-body text-xs text-vupth-danger">
              {erro}
            </Text>
          )}

          <NwButton
            title={reativando ? "Reativando..." : "Reativar"}
            disabled={reativando}
            onPress={reativar}
            testID="reactivate-account"
          />
          <NwButton title="Só consultar" variant="secondaryPainel" onPress={onSoConsultar} disabled={reativando} />
        </View>
      </View>
    </Modal>
  );
}
