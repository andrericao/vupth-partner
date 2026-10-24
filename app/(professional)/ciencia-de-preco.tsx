import { View, Text, ScrollView } from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { avisar } from "@lib/confirmar";
import { getApiErrorMessage } from "@lib/api";
import {
  buscarPolitica,
  darCiencia,
  prazoDaCiencia,
  CHAVE_POLITICA,
} from "@lib/cienciaDePreco";
import { linkDoSaibaMaisDoPreco } from "@lib/politicaDePreco";
import { abrirLink } from "@lib/suporte";

// ciencia-de-preco (DEC-100): o texto da politica de precos, o prazo e o botao
// "Li e estou ciente". Abre pelo aviso da Fila, pelo push PRICE_POLICY e pelo
// 409 PRICE_POLICY_ACK_REQUIRED de quem tenta abrir a loja ou a fila sem ela.
export default function CienciaDePrecoScreen() {
  const qc = useQueryClient();
  const { data: politica, isLoading } = useQuery({ queryKey: CHAVE_POLITICA, queryFn: buscarPolitica });
  const ciente = useMutation({
    mutationFn: () => darCiencia(politica!.version),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CHAVE_POLITICA });
      avisar({ titulo: "Ciência registrada", mensagem: "Obrigado!" });
      router.navigate("/(professional)/queue" as any);
    },
    onError: (e) => avisar({ titulo: "Erro", mensagem: getApiErrorMessage(e, "Não foi possível registrar a ciência. Tente de novo.") }),
  });
  const prazo = prazoDaCiencia(politica);

  return (
    <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader title="Política de preços" onBack={() => router.navigate("/(professional)/queue" as any)} />
        {!isLoading && !politica && (
          <Text testID="politica-vazia" className="font-body text-vupth-textSecondary mt-6">
            Nenhuma mudança de preço para você ler agora.
          </Text>
        )}
        {politica && (
          <View className="mt-4 gap-4">
            {prazo && (
              <Text testID="politica-prazo" className="font-heading text-sm text-vupth-textPrimary">
                {prazo}
              </Text>
            )}
            <Text testID="politica-resumo" className="font-body text-base text-vupth-textPrimary">
              {politica.summary ?? "Os preços e as taxas mudaram."}
            </Text>
            <Text
              className="font-body text-sm text-vupth-textSecondary underline"
              accessibilityRole="link"
              onPress={() => abrirLink(linkDoSaibaMaisDoPreco())}
            >
              Saiba mais no Suporte
            </Text>
            {politica.acknowledged ? (
              <Text testID="politica-ciente" className="font-body text-sm text-vupth-textSecondary">
                Você já deu ciência desta política.
              </Text>
            ) : (
              <NwButton
                title="Li e estou ciente"
                onPress={() => ciente.mutate()}
                isLoading={ciente.isPending}
                testID="politica-ciente-botao"
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
