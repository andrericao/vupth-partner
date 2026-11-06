import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { NwButton } from "@components/nw/Button";
import { ModalBase } from "@components/ModalBase";
import { linhaDoPremio, type PremioDeIndicacao } from "@lib/premios";
import { resumosPorCampanha, resumoDaCampanhaDe } from "@lib/filtrosDePendentes";
import { formatarReais } from "@lib/dinheiro";

// premio-em-pendentes (Andre, 05/11, opcao a): os premios de indicacao ainda nao
// recebidos, em Seu dia → Pendentes. No topo do bloco, por campanha: "N atendimentos
// geraram R$ X". Tocar num premio abre uma janela simples (cliente, dia do corte,
// campanha, valor) com o mesmo resumo no topo e o botao "Ver o dia" (o Historico
// naquele dia). Sem Backend novo.
type Props = {
  itens: PremioDeIndicacao[];
  /** Abre o Historico no dia do corte (finished_at). */
  onVerDia?: (finishedAt: string) => void;
};

export function PremiosPendentes({ itens, onVerDia }: Props) {
  const [aberto, setAberto] = useState<PremioDeIndicacao | null>(null);
  if (itens.length === 0) return null;
  const resumos = resumosPorCampanha(itens);
  const fechar = () => setAberto(null);
  const linhaAberta = aberto ? linhaDoPremio(aberto) : null;

  return (
    <View testID="premios-pendentes" className="mt-6 gap-2">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">PRÊMIOS DE INDICAÇÃO</Text>
      {resumos.map((r) => (
        <Text key={r.chave} testID={`premios-resumo-${r.chave}`} className="font-body text-xs text-vupth-textSecondary">
          {`${r.campanha}: ${r.texto}`}
        </Text>
      ))}
      {itens.map((p) => {
        const l = linhaDoPremio(p);
        return (
          <Pressable
            key={p.credit_id}
            testID="premio-pendente"
            accessibilityRole="button"
            accessibilityLabel={`${l.titulo}, ${l.valor} ${l.estado}`}
            onPress={() => setAberto(p)}
            className="active:opacity-80"
          >
            <View className="bg-vupth-surface rounded-card px-4 py-3 flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-heading text-sm text-vupth-textPrimary">{l.titulo}</Text>
                {l.detalhe ? (
                  <Text testID={`premio-detalhe-${p.credit_id}`} className="font-body text-xs text-vupth-textSecondary mt-0.5">
                    {l.detalhe}
                  </Text>
                ) : null}
              </View>
              <View className="items-end">
                <Text testID={`premio-valor-${p.credit_id}`} className="font-heading text-sm text-vupth-textPrimary">
                  {l.valor}
                </Text>
                <Text testID={`premio-estado-${p.credit_id}`} className="font-body text-xs text-vupth-textSecondary">
                  {l.estado}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      <ModalBase
        visible={aberto !== null}
        aoFechar={fechar}
        titulo={aberto ? resumoDaCampanhaDe(aberto, itens) : undefined}
        tituloTestID="premio-janela-resumo"
        testID="premio-janela"
        rodape={
          <View className="gap-2">
            {aberto?.finished_at && onVerDia ? (
              <NwButton
                title="Ver o dia"
                testID="premio-janela-ver-dia"
                onPress={() => {
                  const dia = aberto.finished_at as string;
                  fechar();
                  onVerDia(dia);
                }}
              />
            ) : null}
            <NwButton title="Fechar" variant="vupthOutline" testID="premio-janela-fechar" onPress={fechar} />
          </View>
        }
      >
        {aberto && linhaAberta ? (
          <View className="gap-1">
            <Text testID="premio-janela-campanha" className="font-heading text-sm text-vupth-textPrimary">
              {linhaAberta.titulo}
            </Text>
            {aberto.client_name?.trim() ? (
              <Text testID="premio-janela-cliente" className="font-body text-sm text-vupth-textSecondary">
                {`Cliente: ${aberto.client_name.trim()}`}
              </Text>
            ) : null}
            {linhaAberta.detalhe?.includes("corte em") ? (
              <Text testID="premio-janela-dia" className="font-body text-sm text-vupth-textSecondary">
                {`Corte em ${linhaAberta.detalhe.split("corte em ")[1]}`}
              </Text>
            ) : null}
            <Text testID="premio-janela-valor" className="font-body text-sm text-vupth-textSecondary">
              {`${formatarReais(Number(aberto.amount))} · ${linhaAberta.estado}`}
            </Text>
          </View>
        ) : null}
      </ModalBase>
    </View>
  );
}
