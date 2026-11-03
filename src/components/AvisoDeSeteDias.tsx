import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { avisoDeSeteDias, buscarGateway, CHAVE_GATEWAY } from "@lib/gateway";
import { ROTA_CONTA_INCOMPLETA } from "@lib/contaIncompleta";
import { useProfessionalStore } from "@store/professional.store";

/**
 * aviso-7-dias-banner (DEC-163): faixa na Fila enquanto corre o prazo de 7 dias do gateway:
 * "Pagamentos pelo app a partir de dd/MM. Informe seu CPF em Configuracoes." Some quando o CPF
 * esta informado ou o prazo acaba (o Backend deixa de mandar o aviso). Toque leva as Configuracoes.
 */
export function AvisoDeSeteDias() {
  const { data } = useQuery({ queryKey: CHAVE_GATEWAY, queryFn: buscarGateway, staleTime: 60_000, retry: false });
  const cpfInformado = useProfessionalStore((s) => !!s.professional?.cpf);
  const texto = avisoDeSeteDias(data, cpfInformado);
  if (!texto) return null;
  return (
    <Pressable
      testID="aviso-7-dias"
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={() => router.push({ pathname: ROTA_CONTA_INCOMPLETA, params: { aviso: "cpf" } } as any)}
      className="mt-3 bg-vupth-greenTint rounded-card px-4 py-3 active:opacity-80"
    >
      <Text className="font-body text-sm text-vupth-textPrimary">{texto}</Text>
    </Pressable>
  );
}
