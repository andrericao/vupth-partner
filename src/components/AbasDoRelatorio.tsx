import { View, Text, Pressable } from "react-native";
import { PendingDot } from "@components/PendingDot";

export type AbaDoRelatorio = "historico" | "pendentes" | "dividas";

/**
 * dividas-e-pendentes-no-relatorio (Andre, 29/10; mockup 1, "abas no topo"): Historico,
 * Pagamentos pendentes e Dividas como abas em pilula no topo do Relatorios. O numero no
 * rotulo diz quantos itens; o dot (regra do dot, 24/10) fica ao lado do rotulo de Pendentes
 * quando algum cliente diz que pagou. Cores do tema: selecionado/onSelecionado, nunca hex.
 */
export function AbasDoRelatorio({
  aba,
  onMudar,
  pendentes,
  dividas,
  precisaConferir = false,
}: {
  aba: AbaDoRelatorio;
  onMudar: (aba: AbaDoRelatorio) => void;
  pendentes: number;
  dividas: number;
  precisaConferir?: boolean;
}) {
  const abas: { key: AbaDoRelatorio; rotulo: string; dot?: boolean }[] = [
    { key: "historico", rotulo: "Histórico" },
    {
      key: "pendentes",
      rotulo: pendentes > 0 ? `Pendentes · ${pendentes}` : "Pendentes",
      dot: precisaConferir,
    },
    {
      key: "dividas",
      rotulo: dividas > 0 ? `Dívidas · ${dividas}` : "Dívidas",
    },
  ];
  return (
    <View
      testID="abas-do-relatorio"
      className="flex-row bg-vupth-surface rounded-full p-1 gap-0.5 mt-4"
    >
      {abas.map((a) => {
        const ativa = aba === a.key;
        return (
          <Pressable
            key={a.key}
            testID={`aba-relatorio-${a.key}`}
            onPress={() => onMudar(a.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativa }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-full active:opacity-70 ${
              ativa ? "bg-vupth-selecionado" : ""
            }`}
          >
            <Text
              numberOfLines={1}
              className={`font-heading text-xs ${ativa ? "text-vupth-onSelecionado" : "text-vupth-textSecondary"}`}
            >
              {a.rotulo}
            </Text>
            {a.dot && (
              <View testID="aba-relatorio-dot">
                <PendingDot />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
