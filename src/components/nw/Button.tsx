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

// Sombra via style RN (confiavel cross-platform, igual ao Button v1).
const shadow = {
  shadowColor: "#1A281A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 4,
};

const BASE = "h-[54px] rounded-full items-center justify-center px-4";

// [marca-vupth] primary/outlineBrand/danger/outlineDanger trocam so o TOM
// (brand-500 -> forest, danger antigo -> vupth.danger) mantendo o par bg/texto
// que ja existia (fundo escuro + texto branco, texto+borda escuros) — troca seg
// -ura porque forest e vupth.danger sao igualmente escuros. O par CLARO
// brandGreen+forest (o novo destaque da marca) so entra nos variants vupth*.
const BOX: Record<Variant, string> = {
  primary: "bg-vupth-forest active:bg-vupth-forestSoft",
  secondary: "bg-gray-200 active:bg-gray-300",
  danger: "bg-vupth-danger active:bg-red-700",
  outlineBrand: "bg-white border border-vupth-forest active:bg-gray-100",
  outlineDanger: "bg-transparent border border-vupth-danger active:bg-red-50",
  // brandGreen so como FUNDO (nunca texto/icone sobre claro) — ver nota no topo.
  vupthPrimary: "bg-vupth-green active:bg-vupth-success",
  vupthSecondary: "bg-vupth-greenTint active:bg-vupth-surfaceAlt",
  vupthOutline: "bg-transparent border-2 border-vupth-forest active:bg-vupth-greenTint",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white",
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
      style={variant.toLowerCase().includes("outline") ? undefined : shadow}
      className={`${BASE} ${BOX[variant]} ${className ?? ""}`}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "danger"
              ? "#fff"
              : variant.startsWith("vupth")
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
