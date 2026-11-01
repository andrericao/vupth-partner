import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";

import { valorDoCard, type Campanha } from "@lib/campanhas";

// card-ticket-pontilhado (Andre, 24/10): o ticket do mockup 2 do Client, nos dois
// apps, valor em Archivo 800. Os tres tipos (desconto, sem taxa, indicacao) e os estados
// encerrada e esgotada (esmaecidos, com selo). Cor so por token; sem sombra.
// cards-de-promocao-iguais-ao-client (Andre, 29/10): este e o card PADRAO dos dois apps (altura e largura
// daqui; o Client copia). Cor: fundo greenTint, texto e borda onGreenTint, borda tracejada de 2 px, raio 20,
// picote redondo de 16 px so na esquerda (cor de background + a mesma borda), padding vertical 16.
export type EstadoDoCard = "ENCERRADA" | "ESGOTADA" | null;

type Props = {
  campanha: Pick<Campanha, "type" | "value_amount" | "value_percent" | "name">;
  /** A linha de baixo: beneficio, validade, rotulo... (monta quem usa). */
  linha?: string | null;
  estado?: EstadoDoCard;
  onPress?: () => void;
  testID?: string;
  acessibilidade?: string;
  /** promocoes-ativar-e-codigo: o codigo do cupom, no ticket (so na tela de ativar). */
  codigo?: string | null;
  /** Conteudo extra no fim do ticket (explicacao, botao, andamento). */
  children?: ReactNode;
};

const ROTULO: Record<Exclude<EstadoDoCard, null>, string> = { ENCERRADA: "Encerrada", ESGOTADA: "Esgotada" };

export function CardDeCampanha({ campanha, linha, estado = null, onPress, testID, acessibilidade, codigo, children }: Props) {
  const conteudo = (
    <View
      className={`bg-vupth-greenTint border-2 border-dashed border-vupth-onGreenTint rounded-card px-5 py-4 ${
        estado ? "opacity-60" : ""
      }`}
    >
      {/* o picote: um meio-circulo na cor da tela, so na esquerda, sobre a borda */}
      <View
        pointerEvents="none"
        className="absolute -left-2.5 top-1/2 -mt-2 w-4 h-4 rounded-full bg-vupth-background border-2 border-dashed border-vupth-onGreenTint"
      />
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text testID={testID ? `${testID}-valor` : undefined} className="font-display text-xxl text-vupth-onGreenTint">
            {valorDoCard(campanha)}
          </Text>
          <Text className="font-heading text-sm text-vupth-onGreenTint">{campanha.name}</Text>
        </View>
        {estado && (
          <View testID={testID ? `${testID}-estado` : undefined} className="bg-vupth-onGreenTint px-2.5 py-1 rounded-full">
            <Text className="font-body text-f11 font-bold text-vupth-greenTint">{ROTULO[estado]}</Text>
          </View>
        )}
      </View>
      {linha ? <Text className="font-body text-xs text-vupth-onGreenTint mt-1">{linha}</Text> : null}
      {codigo ? (
        <Text
          testID={testID ? `${testID}-codigo` : undefined}
          className="font-mono text-xs text-vupth-onGreenTint mt-1"
        >
          {`Código: ${codigo}`}
        </Text>
      ) : null}
      {children}
    </View>
  );
  if (!onPress) return <View testID={testID}>{conteudo}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade ?? campanha.name}
      onPress={onPress}
      className="active:opacity-80"
    >
      {conteudo}
    </Pressable>
  );
}
