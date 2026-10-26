import { useState } from "react";
import { Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";
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
    <ModalBase
      visible={aviso !== null}
      aoFechar={onSoConsultar}
      titulo={bloqueado ? "Sua conta está desativada" : "Bem-vindo de volta"}
      rodape={
        <>
          <NwButton
            title={reativando ? "Reativando..." : "Reativar"}
            disabled={reativando}
            onPress={reativar}
            testID="reactivate-account"
          />
          <NwButton title="Só consultar" variant="secondaryPainel" onPress={onSoConsultar} disabled={reativando} />
        </>
      }
    >
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
    </ModalBase>
  );
}
