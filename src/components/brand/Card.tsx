import { VStack } from "@gluestack-ui/themed";
import { ComponentProps } from "react";

/**
 * Card da marca: `$brandSurface` + raio `$card` (20) + PLANO.
 * Espelha `src/components/brand/Card.tsx` do client — mesmos tokens.
 *
 * Existe porque nao existia: ate agora cada tela montava o proprio card na mao,
 * e por isso cada tela errava de um jeito. `bg="$white"` + `$2xl` + sombra era
 * o trio mais comum, e foi por essa fresta que um `$blue50`/`$blue800` — cor
 * que NAO existe na marca — chegou ao relatorio do dono.
 *
 * As tres decisoes ja vem tomadas:
 * - **fundo `$brandSurface`**, nao branco. E o proprio cinza que separa o card
 *   do fundo — por isso ele nao precisa de borda nem de sombra.
 * - **raio `$card` (20)**, o do Pencil. `$2xl` (16) e `$lg` (8) sao do tema
 *   generico do gluestack, nao da marca.
 * - **sem sombra.** Ver `floatingShadow` em `@lib/styles`.
 *
 * Telas ja migradas p/ NativeWind fazem o equivalente por classe:
 * `bg-vupth-surface rounded-card`.
 */
type Props = ComponentProps<typeof VStack>;

export function BrandCard({ children, ...rest }: Props) {
  return (
    <VStack bg="$brandSurface" borderRadius="$card" p="$4" {...rest}>
      {children}
    </VStack>
  );
}
