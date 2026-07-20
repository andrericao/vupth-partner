import { useState } from "react";
import { Alert, Modal, View } from "react-native";
import { router } from "expo-router";
import { VStack, HStack, Text, Pressable } from "@gluestack-ui/themed";
import { useAuthStore } from "@store/auth.store";
import { cardShadow } from "@lib/styles";

// Menu ☰ do profissional (design Andre 2026-07-18, mockup
// design/queue-layout-combined.html). SUBSTITUI a tab bar do rodape: o rodape
// fica livre para o botao fixo "Iniciar proximo" da fila. Fica no cabecalho,
// ao lado do titulo da tela, e vale para toda a area do profissional.
//
// DOT (vermelho) no ☰ = ha algo a resolver atras do menu:
//   - `mealDot`     -> refeicao perto do horario (item Refeicoes);
//   - `settingsDot` -> pendencia de cadastro (item Configuracoes).
// Um 3o gatilho pedido — solicitacoes de corte com a fila fechada — depende do
// backend expor o cutRequestId/GET de pendentes (ver HANDOFF_BACKEND "Detalhe — C2").
type Props = {
  mealDot?: boolean;
  settingsDot?: boolean;
  /**
   * Abrir/fechar o ESTABELECIMENTO pela area do profissional (o backend aceita
   * OWNER ou profissional afiliado no PATCH /establishment/{id}/open-status).
   * Omitido quando o profissional nao esta afiliado.
   */
  establishment?: { isOpen: boolean; onToggle: () => void };
};

type Entry = {
  key: string;
  label: string;
  hint?: string;
  icon: string;
  dot?: boolean;
  danger?: boolean;
  onPress: () => void;
};

export function ProfessionalMenu({ mealDot = false, settingsDot = false, establishment }: Props) {
  const [open, setOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const hasOwner = useAuthStore((s) => s.user?.roles?.includes("OWNER"));

  const go = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };

  const handleLogout = () => {
    setOpen(false);
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)" as any);
        },
      },
    ]);
  };

  const entries: Entry[] = [];

  // Acao COTIDIANA mais importante do dia — fica no topo do menu, com o estado
  // atual da loja no subtitulo (o profissional afiliado pode abrir/fechar).
  if (establishment) {
    entries.push({
      key: "open-status",
      label: establishment.isOpen ? "Fechar estabelecimento" : "Abrir estabelecimento",
      hint: establishment.isOpen ? "a loja esta ABERTA agora" : "a loja esta FECHADA agora",
      icon: establishment.isOpen ? "🟢" : "⚪",
      onPress: () => {
        setOpen(false);
        establishment.onToggle();
      },
    });
  }

  entries.push(
    {
      key: "meals",
      label: "Refeicoes",
      hint: mealDot ? "esta na hora — inicie ou adie" : "almoco / janta — entram no ETA",
      icon: "🍽️",
      dot: mealDot,
      onPress: () => go("/(professional)/meals"),
    },
    {
      key: "services",
      label: "Meus servicos",
      hint: "precos e duracao",
      icon: "✂️",
      onPress: () => go("/(professional)/my-services"),
    },
    {
      key: "attendances",
      label: "Atendimentos",
      hint: "historico",
      icon: "📋",
      onPress: () => go("/(professional)/attendances"),
    },
    {
      key: "reports",
      label: "Relatorios",
      hint: "faturamento",
      icon: "📊",
      onPress: () => go("/(professional)/reports"),
    },
    {
      key: "settings",
      label: "Configuracoes",
      hint: "status, apelido, especialidade",
      icon: "⚙️",
      dot: settingsDot,
      onPress: () => go("/(professional)/settings"),
    }
  );

  // Quem acumula PROFESSIONAL + OWNER volta para a area do dono (mesma regra
  // que existia no profile.tsx). Profissional-so nao ve a opcao.
  if (hasOwner) {
    entries.push({
      key: "owner",
      label: "Area do dono",
      icon: "🏢",
      onPress: () => {
        setOpen(false);
        router.replace("/(owner)/dashboard" as any);
      },
    });
  }

  entries.push({
    key: "logout",
    label: "Sair",
    icon: "↪",
    danger: true,
    onPress: handleLogout,
  });

  const showDot = mealDot || settingsDot;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        hitSlop={8}
        w="$10"
        h="$10"
        borderRadius="$xl"
        bg="$white"
        alignItems="center"
        justifyContent="center"
        style={cardShadow}
        $active-bg="$green50"
      >
        <VStack space="xs" alignItems="center">
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 16, height: 2, borderRadius: 2, backgroundColor: "#2f6733" }} />
          ))}
        </VStack>
        {showDot && (
          <View
            testID="menu-dot"
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#E63946",
              borderWidth: 2,
              borderColor: "#F7FAF8",
            }}
          />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityLabel="Fechar menu"
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.30)", justifyContent: "flex-start", padding: 16, paddingTop: 90 }}
        >
          <Pressable onPress={() => {}} style={{ width: "100%" }}>
            <VStack bg="$white" borderRadius="$2xl" overflow="hidden" style={cardShadow}>
              {entries.map((e, idx) => (
                <Pressable
                  key={e.key}
                  onPress={e.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={e.label}
                  px="$4"
                  py="$3.5"
                  borderTopWidth={idx === 0 ? 0 : "$1"}
                  borderColor="$coolGray100"
                  $active-bg="$coolGray50"
                >
                  <HStack alignItems="center" space="md">
                    <Text fontSize="$md" w="$6" textAlign="center">
                      {e.icon}
                    </Text>
                    <VStack flex={1}>
                      <Text
                        fontFamily="$body"
                        fontSize="$md"
                        fontWeight="$medium"
                        color={e.danger ? "$red600" : "$coolGray900"}
                      >
                        {e.label}
                      </Text>
                      {e.hint && (
                        <Text fontFamily="$body" fontSize="$xs" color="$coolGray500" mt="$0.5">
                          {e.hint}
                        </Text>
                      )}
                    </VStack>
                    {e.dot && (
                      <View
                        testID={`menu-dot-${e.key}`}
                        style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#E63946" }}
                      />
                    )}
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
