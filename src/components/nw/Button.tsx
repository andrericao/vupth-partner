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
  | "outlineDanger";

type Props = Omit<PressableProps, "children"> & {
  title: string;
  isLoading?: boolean;
  variant?: Variant;
  /** Classes extras (ex.: "mt-0 h-10") — sobrescrevem as do variant. */
  className?: string;
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

const BOX: Record<Variant, string> = {
  primary: "bg-brand active:bg-[#1B4332]",
  secondary: "bg-gray-200 active:bg-gray-300",
  danger: "bg-danger-500 active:bg-danger-600",
  outlineBrand: "bg-white border border-brand active:bg-gray-100",
  outlineDanger: "bg-transparent border border-danger-500 active:bg-red-50",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-gray-700",
  danger: "text-white",
  outlineBrand: "text-brand",
  outlineDanger: "text-danger-500",
};

export function NwButton({
  title,
  isLoading,
  variant = "primary",
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isLoading || disabled}
      style={variant.startsWith("outline") ? undefined : shadow}
      className={`${BASE} ${BOX[variant]} ${className ?? ""}`}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#374151"} />
      ) : (
        <Text className={`font-heading text-base ${LABEL[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
