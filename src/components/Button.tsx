import { ComponentProps } from "react";
import {
  Button as GlueStackButton,
  ButtonText,
  ButtonSpinner,
} from "@gluestack-ui/themed";

type ButtonProps = ComponentProps<typeof GlueStackButton> & {
  title?: string;
  isLoading?: boolean;
  textColor?: string;
};

// [marca-vupth] Botao com presenca: pilula (rounded full), sombra suave e texto
// Archivo. Sombra via style RN (confiavel cross-platform).
// Fundo default vira $forest (nao $brandGreen): este componente aceita
// bg/textColor por prop em muitas chamadas (ex.: bg="$red500" p/ rejeitar, sem
// override de texto — confia no branco default). Trocar o default pra
// $brandGreen quebraria essas chamadas (texto claro sobre fundo claro). $forest
// e so uma versao mais escura do verde antigo — troca segura, texto branco
// continua legivel. O par brilhante brandGreen+forest do Pencil ja existe em
// src/components/brand/Button.tsx, pra telas migradas explicitamente.
// 🔁 16/09 (Andre): verde com texto forest, como o Button do client e o
// NwButton primary. Era forest com texto branco — o partner tinha dois botoes
// principais diferentes, e o client um terceiro jeito de ver o mesmo papel.
export function Button(props: ButtonProps) {
  return (
    <GlueStackButton
      bg="$brandGreen"
      h={54}
      mt="$9"
      rounded="$full"
      $active-bg="$brandSuccess"
      disabled={props.isLoading}
      {...props}
    >
      {props.isLoading ? (
        <ButtonSpinner color={props.textColor ?? "$forest"} />
      ) : (
        <ButtonText fontFamily="$heading" fontSize="$md" color={props.textColor ?? "$forest"}>
          {props.title}
        </ButtonText>
      )}
    </GlueStackButton>
  );
}
