import { VStack, HStack, Text, Pressable, Badge, BadgeText } from "@gluestack-ui/themed";
import { cardShadow } from "@lib/styles";
import { comingSoon } from "@components/comingSoon";

// S1 — STATUS DO PROFISSIONAL (stub de UI; backend #10 ainda nao existe).
// Cada profissional controla o proprio status; o `open_status` da loja e
// DERIVADO (aberto enquanto ≥1 profissional trabalhando) — ver HANDOFF_BACKEND
// "Detalhe — S1". Aqui a UI ja fica pronta: qualquer acao chama `comingSoon()`.
// AO LIGAR O ENDPOINT (`PATCH /professional/me/status`):
//   1. `current` deixa de ser fixo e passa a vir da projecao (professionals-with-queue);
//   2. `selectStatus`/"fechar fila" chamam o PATCH em vez de comingSoon;
//   3. a regra "indisponivel desabilitado com fila" (ja pronta abaixo, front-only)
//      segue igual + trata o 409 ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES.
type StatusKey = "trabalhando" | "intervalo" | "indisponivel";

const OPTIONS: { key: StatusKey; label: string; activeBg: string }[] = [
  { key: "trabalhando", label: "Trabalhando", activeBg: "$green500" },
  { key: "intervalo", label: "Intervalo", activeBg: "$amber500" },
  { key: "indisponivel", label: "Indisponível", activeBg: "$coolGray400" },
];

export function ProfessionalStatusControl({ hasQueue }: { hasQueue: boolean }) {
  const current: StatusKey = "trabalhando"; // placeholder ate o endpoint expor o real

  const selectStatus = (next: StatusKey) => {
    // Parte FRONT-ONLY do S1 (nao precisa de backend): prevenir o clique.
    if (next === "indisponivel" && hasQueue) return; // botao desabilitado + aviso abaixo
    comingSoon("O controle de status (Trabalhando / Intervalo / Indisponível)");
  };

  return (
    <VStack bg="$white" p="$4" borderRadius="$2xl" style={cardShadow} mt="$4">
      <HStack justifyContent="space-between" alignItems="center" mb="$3">
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$md" color="$coolGray800">
          Meu status
        </Text>
        <Badge bg="$amber100" borderRadius="$full" variant="solid">
          <BadgeText color="$amber700" fontSize="$2xs">EM BREVE</BadgeText>
        </Badge>
      </HStack>

      <HStack space="sm">
        {OPTIONS.map((o) => {
          const active = o.key === current;
          const disabled = o.key === "indisponivel" && hasQueue;
          return (
            <Pressable
              key={o.key}
              flex={1}
              onPress={() => selectStatus(o.key)}
              opacity={disabled ? 0.45 : 1}
              bg={active ? o.activeBg : "$coolGray100"}
              borderRadius="$full"
              py="$2.5"
              alignItems="center"
              $active-opacity={0.7}
            >
              <Text
                fontFamily="$heading"
                fontSize="$xs"
                fontWeight="$bold"
                color={active ? "$white" : "$coolGray600"}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>

      {hasQueue ? (
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$2">
          Com cliente na fila, use{" "}
          <Text fontFamily="$body" fontWeight="$bold" color="$coolGray700">Fechar fila</Text>
          {" "}— você termina quem já está e sai ao esvaziar.
        </Text>
      ) : (
        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$2">
          Ficar indisponível é como fechar a loja só para você — os demais do
          estabelecimento seguem atendendo normalmente.
        </Text>
      )}

      <Pressable onPress={() => comingSoon("Fechar fila")} mt="$3" alignSelf="flex-start">
        <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$green600">
          Fechar fila (parar de aceitar novos)
        </Text>
      </Pressable>
    </VStack>
  );
}
