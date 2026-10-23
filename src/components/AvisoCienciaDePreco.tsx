import { Pressable, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { buscarPolitica, precisaDeCiencia, prazoDaCiencia, CHAVE_POLITICA } from "@lib/cienciaDePreco";

// ciencia-de-preco: faixa na Fila enquanto ha politica de precos nova sem a
// ciencia do profissional. Some quando nao ha, ou depois do "Li e estou ciente".
export function AvisoCienciaDePreco() {
  const { data } = useQuery({
    queryKey: CHAVE_POLITICA,
    queryFn: buscarPolitica,
    staleTime: 60_000,
    retry: false,
  });
  if (!precisaDeCiencia(data)) return null;
  return (
    <Pressable
      onPress={() => router.push("/(professional)/ciencia-de-preco" as any)}
      accessibilityRole="button"
      accessibilityLabel="Política de preços nova"
      testID="aviso-ciencia-de-preco"
      className="mt-3 bg-vupth-greenTint rounded-card px-4 py-3 active:opacity-80"
    >
      <Text className="font-heading text-sm text-vupth-textPrimary">Política de preços nova</Text>
      <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
        {prazoDaCiencia(data) ?? "Leia e dê a ciência."} · toque para ler
      </Text>
    </Pressable>
  );
}
