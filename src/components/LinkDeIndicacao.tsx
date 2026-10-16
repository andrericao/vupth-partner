import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import { meuLinkDeIndicacao, clientesQueChegaram, type MeuLink } from "@lib/indicacao";

// link-de-indicacao (DEC-70): o link para compartilhar e quantos clientes
// chegaram por ele. Sem resposta da API, o bloco nao aparece (o cupom segue).
type Props = {
  carregar?: () => Promise<MeuLink>;
  compartilhar?: typeof compartilharComAviso;
};

export function LinkDeIndicacao({ carregar = meuLinkDeIndicacao, compartilhar = compartilharComAviso }: Props) {
  const [meu, setMeu] = useState<MeuLink | null>(null);

  useEffect(() => {
    carregar()
      .then(setMeu)
      .catch(() => {});
  }, [carregar]);

  if (!meu) return null;

  return (
    <View testID="link-indicacao" className="bg-vupth-surface rounded-card px-4 py-4 mb-6">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEU LINK</Text>
      <Text selectable testID="link-indicacao-link" className="font-heading text-sm text-vupth-forest mt-1">
        {meu.link}
      </Text>
      <Text testID="link-indicacao-clientes" className="font-body text-xs text-vupth-textSecondary mt-1 mb-3">
        {clientesQueChegaram(meu.referred_clients)}
      </Text>
      <NwButton
        title="Compartilhar"
        testID="link-indicacao-compartilhar"
        onPress={() =>
          compartilhar(meu.link, {
            titulo: "Vupth",
            mensagem: "Entre na fila da barbearia pelo app Vupth:",
          })
        }
      />
    </View>
  );
}
