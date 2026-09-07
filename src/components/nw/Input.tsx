import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

// Primitiva NativeWind (migracao Gluestack v2). Substitui Input + InputPassword
// do v1 num so componente: passe `secure` p/ virar campo de senha com olho.
// API limpa (label/error), sem FormControl — o `error` (string) aparece quando
// nao-vazio. Mesmo visual do v1: caixa branca, borda cinza, foco verde, erro
// vermelho.
type Props = TextInputProps & {
  label: string;
  /** Mensagem de erro; quando nao-vazia, pinta a borda de vermelho e mostra o texto. */
  error?: string;
  /** Campo de senha (mascara + botao de mostrar/ocultar). */
  secure?: boolean;
  /** Icone a esquerda (Pencil: Mail no e-mail, Lock na senha). */
  icon?: LucideIcon;
};

// `autoCapitalize` default "words" replica o Input v1 (que embutia isso no
// InputField): os campos de nome capitalizam sozinhos. Quem nao quer — e-mail,
// senha, codigo — passa "none", como ja fazem as telas do (auth).
export function NwInput({ label, error, secure, icon: Icon, autoCapitalize = "words", ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const invalid = !!error;

  // Foco no forest e erro no vupth-danger: o `border-brand` era a paleta
  // ANTIGA (#3b7a3f) — ficava um verde diferente do resto da tela.
  const border = invalid
    ? "border border-vupth-danger"
    : focused
      ? "border-2 border-vupth-forest"
      : "border border-vupth-border";

  return (
    <View className="mb-3 w-full">
      <Text className="font-body text-[13px] font-medium text-vupth-textPrimary mb-2">
        {label}
      </Text>
      {/* `min-h`, e nao `h`: altura cravada corta o texto digitado quando a
          fonte do sistema esta ampliada. Ver DS4 no HANDOFF_DESIGN. */}
      <View className={`flex-row items-center gap-2 bg-white rounded-xl px-4 min-h-[50px] ${border}`}>
        {Icon && <Icon size={18} color="#454745" />}
        <TextInput
          className="flex-1 font-body text-vupth-textPrimary"
          placeholderTextColor="#454745"
          autoCorrect={false}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secure && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setShow((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff size={20} color="#163300" /> : <Eye size={20} color="#163300" />}
          </Pressable>
        )}
      </View>
      {invalid && (
        <Text className="font-body text-xs text-vupth-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
