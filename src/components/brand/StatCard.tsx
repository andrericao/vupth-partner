import { View, Text } from "react-native";
import { NumeroComSalto } from "@components/NumeroComSalto";

/**
 * Card de numero (fila, receita, atendimentos...).
 *
 * ⚠️ **A API e de proposito pobre.** A versao anterior deste card, no relatorio
 * do dono, recebia `color`, `bg` e `border` CRUS por chamada — e foi exatamente
 * por ai que um `$blue50`/`$blue800` (cor que nao existe na marca) entrou na
 * tela e ficou. Aqui so existe UMA decisao: este card e o heroi da secao ou
 * nao. Nao adicione parametro de cor.
 *
 * `hero` = o unico `brandGreen` da secao. O Pencil usa **1 a 2** elementos
 * verde-marca por tela contra 3 a 8 em `surface` (PROF · 03 Relatorios: 1
 * verde, 8 surface). Verde e ACENTO — quando tudo e verde, nada e.
 *
 * Regra pratica que ja aplicamos duas vezes: numero ZERO nao e heroi. "0 na
 * fila" e a AUSENCIA de fila, nao o numero que importa — nesse caso passe
 * `hero={total > 0}` e deixe o acento sobrar para a acao da tela.
 */
type Props = {
  label: string;
  value: string;
  hero?: boolean;
  /** Repassado ao container (ex.: flex={1} para dividir a linha). */
  flex?: number;
};

// O texto sobre o verde-marca e o par dele (`onGreen`) e sobre o cartao surface
// e `textPrimary`: forest como texto, no escuro, seria forest sobre o forest da
// surface (1:1).
export function StatCard({ label, value, hero = false, flex }: Props) {
  return (
    <View
      testID="stat-card"
      style={flex ? { flex } : undefined}
      className={`p-4 rounded-card ${hero ? "bg-vupth-green" : "bg-vupth-surface"}`}
    >
      {/* `font-display` (Archivo ExtraBold) e o token de NUMERO da marca. */}
      {/* Trocar o período (Hoje, 7 dias, 30 dias) troca o número: o salto mostra
          que mudou, e não que a tela travou. */}
      <NumeroComSalto valor={value}>
        <Text className={`font-display text-f26 ${hero ? "text-vupth-onGreen" : "text-vupth-textPrimary"}`}>
          {value}
        </Text>
      </NumeroComSalto>
      <Text
        className={`font-body text-xs mt-1 ${
          hero ? "text-vupth-onGreen" : "text-vupth-textSecondary"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
