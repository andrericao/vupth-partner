import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";

// Primitiva NativeWind (migracao Gluestack v2). API LIMPA por VARIANTE — sem
// props de token do gluestack. Mesmo visual do Button v1 (pilula + sombra +
// Poppins), so que via `className`. Usada nas telas JA convertidas; o Button v1
// (src/components/Button.tsx) segue para as telas ainda no v1.
type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "outlineBrand"
  | "outlineDanger"
  // [marca-vupth] Pencil (Button/Primary, /Secondary, /Outline). Tokens em
  // tailwind.config.js sob `vupth.*` — precisam bater com os `brand*` do
  // gluestack config (client e partner).
  | "vupthPrimary"
  | "vupthSecondary"
  | "vupthOutline";

type Props = Omit<PressableProps, "children"> & {
  title: string;
  isLoading?: boolean;
  variant?: Variant;
  /** Classes extras (ex.: "mt-0 h-10") — sobrescrevem as do variant. */
  className?: string;
  /**
   * Classes do TEXTO — sobrescrevem a cor do variant. Para botao claro sobre
   * fundo colorido (ex.: "Finalizar" no card verde da fila), onde nenhuma
   * variante serve porque elas assumem fundo neutro.
   */
  textClassName?: string;
};

const BASE = "h-[54px] rounded-full items-center justify-center px-4";

// [marca-vupth] `primary` E o Button/Primary do Pencil: fundo brand-green com
// texto forest. Na primeira passada ele ficou forest+branco — troca conservadora
// pra nao mexer nas ~40 chamadas de uma vez —, mas isso deixou o app com DOIS
// primarios diferentes: o do desenho e o legado. Como a estrutura nao muda (mesma
// pilula, mesma altura), alinhar e seguro; e as chamadas sobre fundo colorido ja
// sobrescrevem o bg por `className`, entao nao dependem deste valor.
const BOX: Record<Variant, string> = {
  primary: "bg-vupth-green active:bg-vupth-success",
  secondary: "bg-gray-200 active:bg-gray-300",
  danger: "bg-vupth-danger active:bg-red-700",
  outlineBrand: "bg-white border border-vupth-forest active:bg-gray-100",
  outlineDanger: "bg-transparent border border-vupth-danger active:bg-red-50",
  // `vupthPrimary` ficou IDENTICO ao primary depois do alinhamento acima —
  // mantido como apelido pra nao quebrar quem ja chamava por ele.
  vupthPrimary: "bg-vupth-green active:bg-vupth-success",
  vupthSecondary: "bg-vupth-greenTint active:bg-vupth-surfaceAlt",
  vupthOutline: "bg-transparent border-2 border-vupth-forest active:bg-vupth-greenTint",
};

const LABEL: Record<Variant, string> = {
  primary: "text-vupth-forest",
  secondary: "text-gray-700",
  danger: "text-white",
  outlineBrand: "text-vupth-forest",
  outlineDanger: "text-vupth-danger",
  vupthPrimary: "text-vupth-forest",
  vupthSecondary: "text-vupth-forest",
  vupthOutline: "text-vupth-forest",
};

export function NwButton({
  title,
  isLoading,
  variant = "primary",
  className,
  textClassName,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isLoading || disabled}
      className={`${BASE} ${BOX[variant]} ${className ?? ""}`}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "danger"
              ? "#fff"
              : variant === "primary" || variant.startsWith("vupth")
                ? "#163300"
                : "#374151"
          }
        />
      ) : (
        <Text className={`font-heading text-base ${textClassName ?? LABEL[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
