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
};

// `autoCapitalize` default "words" replica o Input v1 (que embutia isso no
// InputField): os campos de nome capitalizam sozinhos. Quem nao quer — e-mail,
// senha, codigo — passa "none", como ja fazem as telas do (auth).
export function NwInput({ label, error, secure, autoCapitalize = "words", ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const invalid = !!error;

  const border = invalid
    ? "border border-danger-500"
    : focused
      ? "border-2 border-brand"
      : "border border-gray-300";

  return (
    <View className="mb-3 w-full">
      <Text className="font-body text-sm text-gray-600 mb-1">{label}</Text>
      <View className={`flex-row items-center bg-white rounded-xl px-3 h-12 ${border}`}>
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
            {/* #064e3b = $emerald900 do v1 (mesmo olho do InputPassword). */}
            <Ionicons name={show ? "eye-off" : "eye"} size={20} color="#064e3b" />
          </Pressable>
        )}
      </View>
      {invalid && (
        <Text className="font-body text-xs text-danger-500 mt-1">{error}</Text>
      )}
    </View>
  );
}
