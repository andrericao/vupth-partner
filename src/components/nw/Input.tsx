import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  /** Icone a esquerda (Pencil: mail no e-mail, lock na senha). */
  icon?: keyof typeof Ionicons.glyphMap;
};

// `autoCapitalize` default "words" replica o Input v1 (que embutia isso no
// InputField): os campos de nome capitalizam sozinhos. Quem nao quer — e-mail,
// senha, codigo — passa "none", como ja fazem as telas do (auth).
export function NwInput({ label, error, secure, icon, autoCapitalize = "words", ...rest }: Props) {
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
      <View className={`flex-row items-center gap-2 bg-white rounded-xl px-4 h-[50px] ${border}`}>
        {icon && <Ionicons name={icon} size={18} color="#454745" />}
        <TextInput
          className="flex-1 font-body text-gray-900"
          placeholderTextColor="#9CA3AF"
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
            <Ionicons name={show ? "eye-off" : "eye"} size={20} color="#163300" />
          </Pressable>
        )}
      </View>
      {invalid && (
        <Text className="font-body text-xs text-vupth-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
