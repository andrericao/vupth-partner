import { Alert, TouchableOpacity } from "react-native";
import { Center, VStack, Text, Box } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";

// Placeholder para funcionalidades cujo BACKEND ainda nao existe: a UI ja fica
// pronta e, no clique, avisamos "em breve". Ao ligar o endpoint, troca-se a
// chamada de `comingSoon(...)` pela API real — assim medimos quais features
// fizeram mais falta. (Estrategia Andre 2026-07-12.)
export function comingSoon(feature = "Essa funcionalidade") {
  Alert.alert("Em breve 🚧", `${feature} estará disponível em breve.`);
}

// Tela placeholder (nao o alerta acima) para rotas ja linkadas no menu cujo
// conteudo ainda nao foi construido (ex.: "Dados Pessoais"). Fica no mesmo
// arquivo do `comingSoon()` de proposito — dois arquivos que so diferem por
// maiuscula/minuscula (`ComingSoon.ts` vs `comingSoon.ts`) quebram build em
// filesystem case-insensitive (bug ja visto aqui).
export function ComingSoon({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <Center flex={1} bg="$brandBackground" px="$8">
      <TouchableOpacity
        onPress={onBack}
        style={{ position: "absolute", top: 60, left: 20 }}
      >
        <Box bg="$greenTint" borderRadius="$full" p="$2.5">
          <Ionicons name="arrow-back" size={20} color="#163300" />
        </Box>
      </TouchableOpacity>
      <VStack alignItems="center" space="md">
        <Center width={72} height={72} borderRadius="$full" bg="$greenTint">
          <Ionicons name="time-outline" size={32} color="#163300" />
        </Center>
        <Text fontFamily="$display" fontSize="$xl" color="$forest" textAlign="center">
          {title}
        </Text>
        <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary" textAlign="center">
          Essa parte ainda está em construção.{"\n"}Em breve por aqui.
        </Text>
      </VStack>
    </Center>
  );
}
