import { useState } from "react";
import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "@components/ScreenHeader";
import { Cupom } from "@components/Cupom";
import { CreditosDeCupom } from "@components/CreditosDeCupom";
import { PromocoesEmSecoes } from "@components/PromocoesEmSecoes";

// cupom-no-app (DEC-61, DEC-63): Perfil → Promoções. O dono abre pela rota do
// grupo dele (from=owner), com as abas dele. Em cima, o link de indicacao
// (link-de-indicacao, DEC-70). promocoes-em-secoes (Andre, 05/11): as campanhas
// em Ativas, Disponiveis e Passadas; o campo Cupom e o Credito em blocos proprios.
export default function PromocoesScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const queryClient = useQueryClient();
  const [versao, setVersao] = useState(0);
  // entrou numa campanha: o carrossel da Home deixa de mostra-la
  const aoMudar = () => queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
  return (
    <ScrollView className="flex-1 bg-vupth-background" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Promoções"
          onBack={() =>
            router.navigate((from === "owner" ? "/(owner)/menu" : "/(professional)/settings") as any)
          }
        />
        <View className="mt-6">
          <PromocoesEmSecoes versao={versao} aoMudar={aoMudar} />
          <Cupom
            comLista={false}
            aoAtivar={() => {
              setVersao((v) => v + 1);
              aoMudar();
            }}
          />
          <CreditosDeCupom />
        </View>
      </View>
    </ScrollView>
  );
}
