import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";
import { useUiStore } from "@store/ui.store";
import { useTema } from "@hooks/useTema";

// avisos-de-agenda-e-solicitacao (Andre, 24/10): na PRIMEIRA solicitacao de um
// cliente que tentou agendar num dia sem agenda, o Backend manda o WS
// AGENDA_RELEASE_PROMPT. Faixa na Fila pedindo que libere a agenda da proxima
// semana; leva direto a agenda e pode ser fechada.
export function AvisoDeAgenda() {
  const { cores } = useTema();
  const aberto = useUiStore((s) => s.avisoDeAgenda);
  const fechar = useUiStore((s) => s.dismissAvisoDeAgenda);
  if (!aberto) return null;
  return (
    <View testID="aviso-de-agenda" className="mt-3 bg-vupth-greenTint rounded-card px-4 py-3">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 font-heading text-sm text-vupth-textPrimary pr-2">Libere a sua agenda</Text>
        <Pressable
          testID="aviso-de-agenda-fechar"
          accessibilityRole="button"
          accessibilityLabel="Fechar o aviso"
          hitSlop={12}
          onPress={fechar}
        >
          <X size={18} color={cores.textSecondary} />
        </Pressable>
      </View>
      <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
        Um cliente tentou agendar num dia sem agenda. Libere a agenda da próxima semana.
      </Text>
      <NwButton
        title="Abrir a agenda"
        variant="vupthOutline"
        className="h-12 mt-2"
        testID="aviso-de-agenda-abrir"
        onPress={() => {
          fechar();
          router.push("/(professional)/agenda" as any);
        }}
      />
    </View>
  );
}
