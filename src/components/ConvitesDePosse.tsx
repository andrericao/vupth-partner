import { View, Text } from "react-native";

import { NwButton } from "@components/nw/Button";
import type { ConviteDePosse } from "@lib/posseDaLoja";

type Props = {
  convites: ConviteDePosse[];
  /** O convite sendo respondido agora (trava os botoes dele). */
  ocupadoId: string | null;
  onAceitar: (id: string) => void;
  onRecusar: (id: string) => void;
};

// O convite de posse que o profissional recebeu (S41-2): aceitar faz dele o
// dono da loja; recusar avisa o dono. Sem convites, nao ocupa espaco.
export function ConvitesDePosse({ convites, ocupadoId, onAceitar, onRecusar }: Props) {
  if (convites.length === 0) return null;
  return (
    <View className="gap-3" testID="convites-de-posse">
      {convites.map((c) => {
        const ocupado = ocupadoId === c.id;
        return (
          <View key={c.id} className="bg-vupth-accentPeach rounded-card p-4 gap-3">
            <Text className="font-body text-sm text-vupth-forest">
              {c.from_owner_name} quer passar a posse de {c.establishment_name} para você.
            </Text>
            <View className="flex-row gap-2">
              <NwButton
                title="Recusar"
                variant="secondary"
                className="flex-1 mt-0"
                disabled={ocupado}
                onPress={() => {
                  if (!ocupado) onRecusar(c.id);
                }}
              />
              <NwButton
                title="Aceitar"
                className="flex-1 mt-0"
                disabled={ocupado}
                onPress={() => {
                  if (!ocupado) onAceitar(c.id);
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
