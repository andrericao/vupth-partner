import { View, ScrollView, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { CardDeCampanha } from "@components/CardDeCampanha";
import {
  campanhasAtivas,
  beneficioDaCampanha,
  validadeDaCampanha,
  estadoDoPrazo,
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
        contentContainerStyle={{ gap: 8, paddingHorizontal: 10 }}
        scrollEnabled={campanhas.length > 1}
      >
        {campanhas.map((c) => (
          <View key={c.id} style={largura ? { width: largura } : undefined}>
            <CardDeCampanha
              campanha={c}
              linha={[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
              estado={estadoDoPrazo(c)}
              onPress={() => abrir(c)}
              testID="campanha-da-home"
              acessibilidade={c.name}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
