import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { NwButton } from "@components/nw/Button";
import { buscarDivida, textoDaDivida, CHAVE_DIVIDA } from "@lib/dividaPorFora";
import { copiarComAviso } from "@lib/copiar";

// divida-por-fora-no-partner: faixa na Fila com o que o profissional deve ao app
// pelos cortes recebidos por fora. Passou do limite, mostra o Pix de cobranca.
export function AvisoDeDivida() {
  const { data } = useQuery({ queryKey: CHAVE_DIVIDA, queryFn: buscarDivida, staleTime: 60_000, retry: false });
  const t = textoDaDivida(data);
  if (!t) return null;
  return (
    <View testID="aviso-de-divida" className="mt-3 bg-vupth-greenTint rounded-card px-4 py-3">
      <Text className="font-heading text-sm text-vupth-textPrimary">{t.titulo}</Text>
      <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{t.detalhe}</Text>
      {t.pix && (
        <>
          {data?.holder_name && (
            <Text className="font-body text-xs text-vupth-textSecondary mt-1">Para: {data.holder_name}</Text>
          )}
          <NwButton
            title="Copiar Pix"
            variant="vupthOutline"
            className="h-12 mt-2"
            testID="divida-copiar-pix"
            onPress={() => copiarComAviso(t.pix!, "Pix")}
          />
        </>
      )}
    </View>
  );
}
