import { HStack, VStack, Text, Pressable } from "@gluestack-ui/themed";
import { View } from "react-native";
import { router } from "expo-router";
import type { Completion } from "@lib/completion";
import { hasBasicPending } from "@lib/completion";
import { useUiStore } from "@store/ui.store";

// Faixa de prontidao na Home (dono e profissional). Mesma FORMA da faixa
// "Em fila" do app do cliente, porem em tom AMBAR (aviso, nao urgencia).
// Regras (Andre 2026-07-11):
//  - so existe enquanto ha pendencia de "Pronto para atender" (hasBasicPending);
//  - aparece a cada abertura do app (o dismissal vive em memoria, ver ui.store);
//  - o X fecha naquela sessao; encaminha para as Configuracoes ao tocar.
// Pendencia so de perfil NAO gera faixa — so o dot (ver PendingDot).
type Props = {
  completion: Completion;
  /** Rota das Configuracoes (dono -> dados do estab.; profissional -> settings). */
  targetRoute: string;
  /** Complemento do texto: "aparecer aos clientes" | "atender clientes". */
  goalNoun: string;
};

export function ReadinessFaixa({ completion, targetRoute, goalNoun }: Props) {
  const dismissed = useUiStore((s) => s.faixaDismissed);
  const dismiss = useUiStore((s) => s.dismissFaixa);

  if (!hasBasicPending(completion) || dismissed) return null;

  const n = completion.basic.pending;
  const passos = n === 1 ? "1 passo" : `${n} passos`;

  return (
    <HStack
      bg="$amber100"
      borderWidth="$1"
      borderColor="$amber200"
      borderRadius="$xl"
      px="$3"
      py="$3"
      mt="$4"
      alignItems="center"
      space="sm"
    >
      <Pressable flex={1} onPress={() => router.push(targetRoute as any)}>
        <HStack alignItems="center" space="sm">
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "#FFB703",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text color="$white" fontWeight="$bold" fontSize="$sm">
              {n}
            </Text>
          </View>
          <VStack flex={1}>
            <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$amber800">
              Complete seu cadastro
            </Text>
            <Text fontFamily="$body" fontSize="$xs" color="$amber700">
              {passos} para {goalNoun}
            </Text>
          </VStack>
          <Text color="$amber700" fontSize="$lg" fontWeight="$bold">
            ›
          </Text>
        </HStack>
      </Pressable>

      <Pressable
        onPress={dismiss}
        accessibilityLabel="Fechar aviso"
        hitSlop={8}
        w="$6"
        h="$6"
        alignItems="center"
        justifyContent="center"
        borderRadius="$full"
        $active-bg="$amber200"
      >
        <Text color="$amber700" fontSize="$md">
          ✕
        </Text>
      </Pressable>
    </HStack>
  );
}
