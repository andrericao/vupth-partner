import { View, Text, Pressable } from "react-native";

import { NwButton } from "@components/nw/Button";
import type { PosseDoDono } from "@lib/posseDaLoja";

type Props = {
  pendente: PosseDoDono | null;
  candidatos: { id: string; nome: string }[];
  ocupado: boolean;
  erro: string | null;
  onPedir: (professionalId: string) => void;
  onCancelar: () => void;
};

// passar a posse (c0f5b17 + S41, 01c785e): o dono escolhe alguem da equipe; a
// pessoa aceita ou recusa. O pedido nao vence (Andre, 08/10) — enquanto houver
// um pendente, o dono so pode cancelar.
export function PassarPosse({ pendente, candidatos, ocupado, erro, onPedir, onCancelar }: Props) {
  return (
    <View className="gap-3">
      {pendente ? (
        <View className="bg-vupth-surface rounded-card p-4 gap-3" testID="posse-pendente">
          <Text className="font-body text-sm text-vupth-textPrimary">
            Esperando {pendente.professional_name} aceitar a posse da loja.
          </Text>
          <NwButton title="Cancelar pedido" variant="secondary" disabled={ocupado} onPress={onCancelar} />
        </View>
      ) : (
        <>
          <Text className="font-body text-sm text-vupth-textSecondary">
            Escolha quem fica com a loja. A pessoa precisa aceitar; até lá, nada muda.
          </Text>
          {candidatos.length === 0 ? (
            <Text className="font-body text-sm text-vupth-textSecondary">
              Vincule um profissional à loja antes — só quem está na equipe pode receber a posse.
            </Text>
          ) : (
            candidatos.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  if (!ocupado) onPedir(c.id);
                }}
                accessibilityRole="button"
                className="bg-vupth-surface rounded-card px-4 py-4 active:opacity-80"
              >
                <Text className="font-heading text-base text-vupth-textPrimary">{c.nome}</Text>
              </Pressable>
            ))
          )}
        </>
      )}
      {erro && (
        <Text testID="posse-erro" className="font-body text-xs text-vupth-danger">
          {erro}
        </Text>
      )}
    </View>
  );
}
