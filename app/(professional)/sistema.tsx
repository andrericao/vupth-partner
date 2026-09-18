import { View, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenHeader } from "@components/ScreenHeader";
import { OtaUpdateButton } from "@components/OtaUpdateButton";
import { rotaDeVoltaDosDados } from "@lib/routing";

// Tela "Sistema" — versão, atualização e diagnóstico.
//
// 🔴 Pedido dele em 09/09: "quero que as informações de ws, ver atualização
// etc. fiquem numa aba dentro do menu / configurações... essas informações
// estão sujando a tela para o usuário".
//
// Estava tudo solto no rodapé das Configurações e do Menu: o dono e o
// profissional abriam a própria conta e a última coisa que viam era assunto de
// manutenção. Aqui vira destino, não rodapé — quem precisa, entra; quem não
// precisa, nem sabe que existe.
//
// O diagnóstico de WebSocket continua atrás dos 7 toques na versão (decisão da
// Alexia, 21/08): o usuário final não pode ver "falhou o handshake" e a URL do
// servidor.
//
// 🔴 Andre, 18/09: no NAVEGADOR esta tela não explica mais a diferença com o
// app. Lá qualquer navegação já carrega a versão nova, então o botão de
// atualizar e o texto do Ctrl+Shift+R eram conversa sobre o meio, não
// informação. Fica o que é pertinente: versão, canal e data/hora do lançamento.
export default function SistemaScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Sistema"
          subtitle="Versão do app e atualizações."
          onBack={() => router.navigate(rotaDeVoltaDosDados(from) as any)}
        />

        <View className="mt-6">
          <OtaUpdateButton />
        </View>

      </View>
    </ScrollView>
  );
}
