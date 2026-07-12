import { VStack, HStack, Text, Pressable, Badge, BadgeText } from "@gluestack-ui/themed";
import { cardShadow } from "@lib/styles";
import { comingSoon } from "@components/comingSoon";

// S5 (stub; backend "Expediente nos relatorios") — mostrar o inicio/fim do
// expediente (HH:MM–HH:MM) nos relatorios do dono e do profissional. O backend
// ainda nao registra/exporta os eventos de abrir/fechar (ligado ao S1). UI
// pronta; ao ligar, trocar o placeholder pelos horarios reais. (Andre 2026-07-12.)
export function ExpedienteCard() {
  return (
    <Pressable
      onPress={() =>
        comingSoon("O expediente (horário de abertura e fechamento) nos relatórios")
      }
      mt="$4"
    >
      <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow}>
        <HStack justifyContent="space-between" alignItems="center" mb="$1">
          <Text fontFamily="$body" fontSize="$xs" color="$coolGray500">
            Expediente
          </Text>
          <Badge bg="$amber100" borderRadius="$full" variant="solid">
            <BadgeText color="$amber700" fontSize="$2xs">EM BREVE</BadgeText>
          </Badge>
        </HStack>
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$xl" color="$coolGray400">
          --:-- – --:--
        </Text>
      </VStack>
    </Pressable>
  );
}
