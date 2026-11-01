import { View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AvisoDeDivida } from "@components/AvisoDeDivida";
import {
  buscarDivida,
  CHAVE_DIVIDA,
  type DividaPorFora,
} from "@lib/dividaPorFora";
import { formatarReais } from "@lib/dinheiro";
import { abrirDialogo } from "@store/dialogo.store";

type Item = DividaPorFora["items"][number];

const ORIGENS: Record<string, string> = {
  CARD: "cartão",
  CASH: "dinheiro",
  NOTE: "nota",
  PIX: "Pix",
};

export function dataCurta(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function origemDaDivida(origin?: string | null): string {
  return (origin && ORIGENS[origin.toUpperCase()]) || "fora do app";
}

/**
 * dividas-e-pendentes-no-relatorio (Andre, 29/10): a divida com o app mora SO no Relatorios
 * (saiu da Fila). A regra da DEC-109 segue: cada corte recebido por fora deixa a sua divida.
 * Cada linha abre o atendimento de origem (cliente nao vem no contrato: data, forma e valor).
 */
export function DividasDoRelatorio({
  abrir = abrirDialogo,
}: {
  abrir?: typeof abrirDialogo;
}) {
  const { data } = useQuery({
    queryKey: CHAVE_DIVIDA,
    queryFn: buscarDivida,
    staleTime: 60_000,
    retry: false,
  });
  const itens = data?.items ?? [];

  async function abrirItem(i: Item) {
    await abrir({
      titulo: "Corte recebido por fora",
      mensagem: `${dataCurta(i.created_at)} · ${origemDaDivida(i.origin)} · dívida de ${formatarReais(i.amount)} com o app${
        i.simulated ? " (teste)" : ""
      }.`,
      botoes: [{ texto: "Fechar", estilo: "cancel" as const }],
    });
  }

  return (
    <View testID="dividas-do-relatorio" className="mt-4 gap-3">
      <Text className="font-heading text-xl text-vupth-textPrimary">
        Dívidas
      </Text>
      <AvisoDeDivida />
      {itens.length === 0 ? (
        <Text
          testID="dividas-vazio"
          className="font-body text-sm text-vupth-textSecondary"
        >
          Nenhuma dívida com o app.
        </Text>
      ) : (
        <View className="bg-vupth-surface rounded-card px-4">
          {itens.map((i, n) => (
            <Pressable
              key={i.attendance_id}
              testID={`divida-${i.attendance_id}`}
              accessibilityRole="button"
              onPress={() => abrirItem(i)}
              className={`flex-row items-center gap-3 py-3 active:opacity-70 ${n > 0 ? "border-t border-vupth-border" : ""}`}
            >
              <View className="flex-1">
                <Text className="font-body text-sm font-semibold text-vupth-textPrimary">
                  Corte recebido por fora
                </Text>
                <Text className="font-body text-xs text-vupth-textSecondary">
                  {dataCurta(i.created_at)} · {origemDaDivida(i.origin)}
                  {i.simulated ? " · teste" : ""}
                </Text>
              </View>
              <Text className="font-heading text-sm text-vupth-danger">
                {formatarReais(i.amount)}
              </Text>
              <Text className="font-body text-lg text-vupth-textSecondary">
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
