import {
  VStack,
  HStack,
  Heading,
  Text,
  Pressable,
  Divider,
  ScrollView,
} from "@gluestack-ui/themed";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Header } from "@components/Header";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { cardShadow } from "@lib/styles";
import { OtaUpdateButton } from "@components/OtaUpdateButton";
import { PendingDot } from "@components/PendingDot";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { hasAnyPending } from "@lib/completion";

type MenuItemProps = {
  label: string;
  onPress: () => void;
  color?: string;
  dot?: boolean;
};

function MenuItem({ label, onPress, color = "$coolGray900", dot = false }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      py="$4"
      px="$5"
      bg="$white"
      borderRadius="$2xl"
      style={cardShadow}
      $active-bg="$coolGray50"
    >
      <HStack alignItems="center" space="sm">
        <Text fontFamily="$body" fontSize="$md" fontWeight="$medium" color={color}>
          {label}
        </Text>
        {dot && <PendingDot />}
      </HStack>
    </Pressable>
  );
}

export default function OwnerMenuScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const resetEstablishment = useEstablishmentStore((s) => s.reset);
  const resetProfessional = useProfessionalStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { completion } = useOwnerCompletion();
  const hasPending = hasAnyPending(completion);

  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const handleLeaveEstablishment = () => {
    Alert.alert(
      "Sair do Estabelecimento",
      "Voce sera desvinculado deste estabelecimento. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair do Estabelecimento",
          style: "destructive",
          onPress: async () => {
            resetEstablishment();
            resetProfessional();
            router.replace("/(owner)/onboarding/establishment" as any);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da conta?", [
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

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} pb="$6" px="$6">
        <Header />

        <VStack mt="$8" mb="$6">
          <Heading size="2xl" fontFamily="$heading">
            {establishment?.name ?? "Meu Estabelecimento"}
          </Heading>
          <Text fontFamily="$body" color="$coolGray500" mt="$1">
            {establishment?.service_type ?? ""}
          </Text>
          {isProfessional && (
            <Text fontFamily="$body" color="$forest" mt="$1">
              Tambem profissional
            </Text>
          )}
        </VStack>

        <Divider mb="$4" />

        {/* Seletor de papel: quem acumula OWNER + PROFESSIONAL alterna para a
            sua area de profissional (e gerencia servicos por "Meus Servicos").
            Owner-so-dono nao ve o botao. Decisao de produto 2026-06-28. */}
        {isProfessional && (
          <VStack mb="$4">
            <MenuItem
              label="Atender como profissional"
              onPress={() => router.replace("/(professional)/queue" as any)}
              color="$forest"
            />
          </VStack>
        )}

        <VStack space="sm">
          {establishment?.id && (
            <>
              <MenuItem
                label="Adicionar Profissional"
                onPress={() =>
                  // Porta UNICA (2026-08-07): a propria tela oferece os caminhos
                  // (ser tambem profissional / convidar / ver solicitacoes). Antes
                  // o dono NAO-profissional era desviado p/ o onboarding
                  // `also-professional`, que criava o perfil dele sem nomear a
                  // escolha — e a pendencia do checklist ja apontava p/ ca.
                  router.push({
                    pathname: "/(owner)/add-professional",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              <MenuItem
                label="Convidar Profissional"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/invite-professional",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              <MenuItem
                label="Solicitacoes de Vinculacao"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/affiliations",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />

              {/* "Adicionar Servico" SAIU do menu do dono (Andre 2026-08-11).
                  Servico e capacidade do PROFISSIONAL: quem acumula os dois
                  papeis gerencia em "Meus Servicos", na area do profissional —
                  ter as duas portas so criava duvida sobre de quem era o
                  servico. A tela `add-service.tsx` segue existindo (rota
                  href:null) ate a limpeza, mas nada mais aponta p/ ela. */}

              <MenuItem
                label="Ver Filas"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/queues",
                    params: { establishmentId: establishment.id },
                  } as any)
                }
              />
            </>
          )}

          <MenuItem
            label="Dados Pessoais"
            onPress={() =>
              router.push({
                pathname: "/(owner)/coming-soon",
                params: { title: "Dados Pessoais" },
              } as any)
            }
          />

          {establishment?.id && (
            <MenuItem
              label="Dados do Estabelecimento"
              dot={hasPending}
              onPress={() =>
                router.push({
                  pathname: "/(owner)/establishment-data",
                  params: { establishmentId: establishment.id },
                } as any)
              }
            />
          )}

          <MenuItem
            label="Atendimentos"
            onPress={() => router.push("/(owner)/attendances" as any)}
          />

          <MenuItem
            label="Relatorios"
            onPress={() => router.push("/(owner)/reports" as any)}
          />

        </VStack>

        <VStack mt="$8" space="sm">
          {establishment?.id && (
            <MenuItem
              label="Sair do Estabelecimento"
              onPress={handleLeaveEstablishment}
              color="$amber700"
            />
          )}

          <MenuItem
            label="Sair da Conta"
            onPress={handleLogout}
            color="$brandDanger"
          />
        </VStack>

        <OtaUpdateButton />
      </VStack>
    </ScrollView>
  );
}
