import { useState } from "react";
import { Text, View } from "react-native";

import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";
import { NwInput } from "@components/nw/Input";
import type { ImpedimentoDaLoja } from "@lib/impedimentosDaLoja";

type Props = {
  visible: boolean;
  nomeDaLoja: string;
  isDeleting?: boolean;
  /** Erro vindo do backend (senha errada, fila aberta 409). */
  error?: string | null;
  /** remover-profissionais-ao-excluir-loja (DEC-173): o que impede a exclusao, do 409. */
  impedimentos?: ImpedimentoDaLoja[];
  /** Profissional que esta sendo removido agora. */
  removendoId?: string | null;
  onRemoverProfissional?: (id: string) => void;
  onAtalho?: (rota: string) => void;
  onConfirm: (currentPassword: string) => void;
  onClose: () => void;
};

// desativar-conta (c0f5b17, item 5): excluir a loja e irreversivel. O corpo e
// uma linha; a equipe que sai e e avisada e o historico que fica como "Loja
// removida" (os atendimentos sao tambem do cliente e do profissional) sao o que
// o Suporte explica. Falta o artigo da loja (so ha o da conta), entao ainda nao
// ha "Saiba mais" aqui. O campo ja se chama "Senha atual": a frase mandando
// digita-la saiu (guia de texto, regra 3).
export function ApagarLojaModal({
  visible,
  nomeDaLoja,
  isDeleting,
  error,
  impedimentos = [],
  removendoId = null,
  onRemoverProfissional,
  onAtalho,
  onConfirm,
  onClose,
}: Props) {
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

      {impedimentos.length > 0 && (
        <View testID="impedimentos-da-loja" className="gap-3 mt-2">
          <Text className="font-body text-sm text-vupth-textPrimary">
            Para excluir a loja, resolva antes:
          </Text>
          {impedimentos.map((i) => (
            <View key={i.code} testID={`impedimento-${i.code}`} className="gap-1">
              <Text className="font-heading text-sm text-vupth-textPrimary">{i.titulo}</Text>
              {i.items.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between gap-2">
                  <Text className="font-body text-sm text-vupth-textSecondary flex-1">{item.name}</Text>
                  {i.removivel && onRemoverProfissional && (
                    <NwButton
                      title="Remover da loja"
                      variant="outlineDanger"
                      className="mt-0"
                      isLoading={removendoId === item.id}
                      disabled={removendoId != null}
                      onPress={() => onRemoverProfissional(item.id)}
                      testID={`remover-da-loja-${item.id}`}
                    />
                  )}
                </View>
              ))}
              {i.atalho && onAtalho && (
                <NwButton
                  title={i.atalho.rotulo}
                  variant="secondaryPainel"
                  onPress={() => onAtalho(i.atalho!.rota)}
                  testID={`atalho-${i.code}`}
                />
              )}
            </View>
          ))}
          <Text className="font-body text-xs text-vupth-textSecondary">
            Remover da loja só desfaz o vínculo: a conta do profissional continua. Depois, tente excluir de novo.
          </Text>
        </View>
      )}

      {error && (
        <Text testID="delete-store-error" className="font-body text-xs text-vupth-danger">
          {error}
        </Text>
      )}
    </ModalBase>
  );
}
