import { View, Text } from "react-native";
import { router } from "expo-router";
import { NwButton } from "@components/nw/Button";
import { useAuthStore } from "@store/auth.store";
import { confirmar } from "@lib/confirmar";

/**
 * sem-loja-tela-de-saida (DEC-173, opção B do André): a tela de criar loja de quem está sem loja
 * ganha o menu de saída — Entrar em uma loja, Dados pessoais (onde está "Excluir conta") e Sair.
 * "Criar loja" é o próprio formulário acima. Tela nova pelos tokens atuais; a Design revisa depois.
 */
export function SaidasSemLoja() {
  const logout = useAuthStore((s) => s.logout);

  const sair = async () => {
    const ok = await confirmar({ titulo: "Sair da conta", mensagem: "", confirmar: "Sair", destrutivo: true });
    if (!ok) return;
    await logout();
    router.replace("/(auth)" as any);
  };

  return (
    <View testID="saidas-sem-loja" className="mt-8 gap-1">
      <Text className="font-heading text-sm text-vupth-textSecondary mb-1">Ou, sem criar uma loja agora</Text>
      <NwButton
        title="Entrar em uma loja"
        variant="secondaryPainel"
        onPress={() => router.push("/(professional)/find-establishment" as any)}
        testID="sem-loja-entrar"
      />
      <NwButton
        title="Dados pessoais"
        variant="secondaryPainel"
        onPress={() =>
          router.push({ pathname: "/(professional)/settings-account", params: { from: "owner" } } as any)
        }
        testID="sem-loja-dados"
      />
      <NwButton title="Sair" variant="outlineDanger" onPress={sair} testID="sem-loja-sair" />
    </View>
  );
}
