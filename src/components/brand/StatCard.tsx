import { VStack, Text } from "@gluestack-ui/themed";

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

export function StatCard({ label, value, hero = false, flex }: Props) {
  return (
    <VStack
      flex={flex}
      bg={hero ? "$brandGreen" : "$brandSurface"}
      p="$4"
      borderRadius="$card"
    >
      {/* `$display` (Archivo ExtraBold) e o token de NUMERO da marca. */}
      <Text fontFamily="$display" fontSize={26} color="$forest">
        {value}
      </Text>
      <Text
        fontFamily="$body"
        fontSize="$xs"
        color={hero ? "$forest" : "$coolGray500"}
        mt="$1"
      >
        {label}
      </Text>
    </VStack>
  );
}
