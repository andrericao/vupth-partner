import { View, Text } from "react-native";

type Props = {
  /** establishment_status do GET /professional/me (S42-2): ACTIVE | DEACTIVATED | null. */
  status: string | null | undefined;
  nomeDaLoja: string | null | undefined;
};

// S42 (Andre, 08/10): "os profissionais sao informados de que a loja esta
// desativada e que nao aparecerao mais para os clientes, recomendando-os a sair".
// Ninguem e tirado da loja: quando o dono volta, ela volta a busca.
export function AvisoLojaDesativada({ status, nomeDaLoja }: Props) {
  if (status !== "DEACTIVATED") return null;
  return (
    <View className="bg-vupth-accentPeach rounded-card p-4 gap-1" testID="aviso-loja-desativada">
      <Text className="font-heading text-sm text-vupth-onAccentPeach">
        {nomeDaLoja ?? "A loja"} foi desativada
      </Text>
      <Text className="font-body text-sm text-vupth-onAccentPeach">
        Ela não aparece mais para os clientes. Recomendamos que você saia dela e procure outra loja.
      </Text>
    </View>
  );
}
