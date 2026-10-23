import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  campanhasAtivas,
  beneficioDaCampanha,
  validadeDaCampanha,
  type Campanha,
} from "@lib/campanhas";

// carrossel-de-campanhas-no-partner: bloco discreto na Home. Some inteiro sem
// campanha (ou se a chamada falhar); com mais de uma, rola de lado. O titulo e o
// nome que o Andre deu no Painel. Por ora o toque abre Promocoes (cupom e link).
type Props = {
  listar?: () => Promise<Campanha[]>;
  /** "owner" abre Promocoes pela rota do dono. */
  de?: "owner" | "professional";
  aoTocar?: (c: Campanha) => void;
};

export function CarrosselDeCampanhas({ listar = campanhasAtivas, de = "professional", aoTocar }: Props) {
  const { width } = useWindowDimensions();
  const { data } = useQuery({
    queryKey: ["campanhas-ativas", de],
    queryFn: listar,
    staleTime: 60_000,
    retry: false,
  });
  const campanhas = data ?? [];
  if (campanhas.length === 0) return null;

  const abrir = (c: Campanha) => {
    if (aoTocar) return aoTocar(c);
    router.push((de === "owner" ? "/(owner)/promocoes?from=owner" : "/(professional)/promocoes") as any);
  };
  const largura = campanhas.length > 1 ? Math.max(width - 64, 220) : undefined;

  return (
    <View className="mt-3" testID="campanhas-da-home">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        scrollEnabled={campanhas.length > 1}
      >
        {campanhas.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => abrir(c)}
            accessibilityRole="button"
            accessibilityLabel={c.name}
            testID="campanha-da-home"
            style={largura ? { width: largura } : undefined}
            className="bg-vupth-greenTint rounded-card px-4 py-3 active:opacity-80"
          >
            <Text className="font-heading text-sm text-vupth-textPrimary">{c.name}</Text>
            <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
              {[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
