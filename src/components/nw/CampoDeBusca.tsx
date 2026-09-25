import { View, TextInput, Pressable, type TextInputProps } from "react-native";
import { Search, X } from "lucide-react-native";
import { RESET_WEB } from "./Input";

type Props = {
  value: string;
  placeholder: string;
  onChangeText: (texto: string) => void;
  onBuscar: () => void;
  onLimpar: () => void;
  /** testID do campo de texto (roteiros do Maestro). */
  testID?: string;
};

// Campo de busca das telas "Buscar estabelecimento" (as duas: a do onboarding
// e a das Configuracoes) e "Convidar profissional".
// 🔴 Andre, 25/09: "espreme as letras". As duas copias tinham `h-12` cravado e
// TextInput sem o reset de web — o `<input>` do navegador trazia borda e anel de
// foco proprios e roubava a altura (o mesmo do login em 08/09, ver nw/Input).
// Aqui: `min-h`, o reset do NwInput, e UMA copia.
//
// O icone da direita TROCA de papel: com texto ele limpa; vazio, ele busca.
export function CampoDeBusca({ value, placeholder, onChangeText, onBuscar, onLimpar, testID }: Props) {
  const temTexto = !!value.trim();
  return (
    <View
      testID="campo-de-busca"
      className="flex-row items-center min-h-[50px] mb-4 px-3 rounded-md border border-vupth-forest bg-white"
    >
      <TextInput
        className="flex-1 font-body text-vupth-forest"
        style={RESET_WEB as TextInputProps["style"]}
        placeholder={placeholder}
        placeholderTextColor="#6B706B"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onBuscar}
        autoCorrect={false}
        returnKeyType="search"
        testID={testID}
      />
      <Pressable
        onPress={temTexto ? onLimpar : onBuscar}
        accessibilityRole="button"
        accessibilityLabel={temTexto ? "Limpar busca" : "Buscar"}
        className="pl-3"
      >
        {temTexto ? <X size={18} color="#454745" /> : <Search size={18} color="#163300" />}
      </Pressable>
    </View>
  );
}
