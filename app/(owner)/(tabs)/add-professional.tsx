import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { api, getApiErrorMessage } from "@lib/api";
import { avisar, confirmar, confirmarComSaibaMais } from "@lib/confirmar";
import { abrirLink } from "@lib/suporte";
import { getPrimeiroCaminhoDoDono } from "@lib/routing";
import { NotificationBadge } from "@components/NotificationBadge";
import { useSolicitacoesDeVinculo } from "@hooks/useSolicitacoesDeVinculo";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
];

// Card de CAMINHO (Andre 2026-08-07: "a intencao e sempre levar o usuario a um
// caminho, neste caso a solucao"). A pendencia "1+ profissional com servico"
// bloqueia a loja de abrir e caia aqui num formulario que criava o DONO como
// profissional sem dizer isso — parecia "cadastrar outra pessoa". Agora a tela
// abre com as saidas nomeadas.
function PathCard({
  title,
  hint,
  onPress,
  selected,
  testID,
  badge = 0,
}: {
  title: string;
  hint: string;
  onPress: () => void;
  selected?: boolean;
  testID?: string;
  /** Pendencias que esperam o dono neste caminho (solicitacoes de vinculo). */
  badge?: number;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: !!selected }}
      className={`bg-vupth-surface p-4 rounded-card mb-3 border ${
        selected ? "border-vupth-forest" : "border-transparent"
      } active:bg-vupth-surface`}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="font-heading text-vupth-forest">{title}</Text>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
        </View>
        <NotificationBadge count={badge} testID={testID ? `${testID}-badge` : undefined} />
        <Text className="font-body text-lg text-vupth-textSecondary ml-2">{"›"}</Text>
      </View>
    </Pressable>
  );
}

export default function AddProfessionalScreen() {
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const solicitacoes = useSolicitacoesDeVinculo(establishmentId);
  const user = useAuthStore((s) => s.user);
  const isProfessional = user?.roles?.includes("PROFESSIONAL");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // O formulario so aparece depois que o dono escolhe "eu tambem vou atender" —
  // e o que deixa claro que o perfil criado e o DELE.
  const [meAsProfessional, setMeAsProfessional] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const goInvite = () =>
    router.push({
      pathname: "/(owner)/invite-professional",
      params: { establishmentId: establishmentId ?? "" },
    } as any);

  // O primeiro card muda de papel conforme o dono ja atenda ou nao — ver
  // getPrimeiroCaminhoDoDono. Antes ele so existia no caso "ainda nao atende".
  const primeiroCaminho = getPrimeiroCaminhoDoDono(!!isProfessional);

  const goAffiliations = () =>
    router.push({
      pathname: "/(owner)/affiliations",
      params: { establishmentId: establishmentId ?? "" },
    } as any);

  const handleQuickCreate = async () => {
    if (!name.trim()) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      const result = await quickCreateProfessional(
        name.trim(),
        establishmentId!,
        specialty
      );
      await useProfessionalStore.getState().setProfessional(result);
      await SecureStore.setItemAsync("vupth_owner_name", name.trim());
      await refreshToken();
      confirmar({
        titulo: "Perfil profissional criado",
        mensagem: `${result.name} já aparece como profissional da sua loja. Falta só cadastrar seus serviços para a loja poder abrir.`,
        confirmar: "Cadastrar serviços",
        cancelar: "Depois",
      }).then((ok) => {
        // Os DOIS lados agem — "Depois" nao e cancelar, e sair da tela.
        if (ok) router.replace("/(professional)/my-services?from=settings" as any);
        else router.back();
      });
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL" || error?.response?.status === 409) {
        try {
          const { data: me } = await api.get("/professional/me");
          const currentEstId = me.establishment_id ?? me.establishmentId;

          if (currentEstId === establishmentId) {
            await useProfessionalStore.getState().setProfessional(me);
            await refreshToken();
            // A acao JA aconteceu — sem a caixa na web a tela nao fechava.
            await avisar({
              titulo: "Tudo certo",
              mensagem: "Seu perfil profissional já está vinculado a este estabelecimento.",
            });
            router.back();
          } else if (currentEstId) {
            await useProfessionalStore.getState().switchEstablishment(establishmentId!);
            await useProfessionalStore.getState().fetchMe();
            await refreshToken();
            // A acao JA aconteceu — sem a caixa na web a tela nao fechava.
            await avisar({
              titulo: "Vinculado",
              mensagem: "Seu perfil profissional foi transferido para este estabelecimento.",
            });
            router.back();
          } else {
            await useProfessionalStore.getState().affiliate(establishmentId!);
            await useProfessionalStore.getState().fetchMe();
            await refreshToken();
            // A acao JA aconteceu — sem a caixa na web a tela nao fechava.
            await avisar({
              titulo: "Vinculado",
              mensagem: "Seu perfil profissional foi vinculado a este estabelecimento.",
            });
            router.back();
          }
        } catch (err: any) {
          Alert.alert("Erro", getApiErrorMessage(err, "Não foi possível verificar o perfil profissional."));
        }
      } else {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível criar o profissional."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Profissionais"
            subtitle="Quem vai atender na sua loja."
            onBack={() => router.navigate("/(owner)/menu" as any)}
          />
          <Text className="font-body text-sm text-vupth-textSecondary mt-1 mb-4">
            Sua loja só aparece para os clientes com pelo menos um profissional com
            serviço cadastrado. Há dois caminhos:
          </Text>

          <PathCard
            testID={primeiroCaminho.testID}
            title={primeiroCaminho.title}
            hint={primeiroCaminho.hint}
            selected={!primeiroCaminho.rota && meAsProfessional}
            onPress={async () => {
              if (!primeiroCaminho.rota) {
                setMeAsProfessional(true);
                return;
              }
              // Trocar de area e trocar de contexto — a barra e o menu mudam.
              // Uma frase com Sim, Cancelar e "Saiba mais" (o resto, e por onde
              // voltar, esta no Suporte). Cancelar fica na tela.
              const { aviso } = primeiroCaminho;
              if (aviso) {
                const ok = await confirmarComSaibaMais(
                  { titulo: aviso.titulo, mensagem: aviso.mensagem, confirmar: "Sim" },
                  () => abrirLink(aviso.saibaMais)
                );
                if (!ok) return;
              }
              router.push(primeiroCaminho.rota as any);
            }}
          />

          <PathCard
            testID="path-invite"
            title="Convidar um profissional"
            hint="buscar pelo nome e enviar convite"
            onPress={goInvite}
          />

          <PathCard
            testID="path-requests"
            title="Ver solicitações"
            hint="quem já pediu para trabalhar na sua loja"
            badge={solicitacoes}
            onPress={goAffiliations}
          />

          {/* O formulario do dono-profissional so abre depois da escolha. */}
          {!isProfessional && meAsProfessional && (
            <View className="mt-4">
              <Text className="font-heading text-base text-vupth-forest mb-2">
                Seu perfil profissional
              </Text>

              <NwInput
                label="Seu nome"
                placeholder="Ex: João Silva"
                value={name}
                onChangeText={setName}
                error={isInvalid ? "Nome obrigatório" : ""}
              />

              <Text className="font-heading text-base text-vupth-forest mt-2 mb-2">
                Especialidade
              </Text>

              <View className="gap-1 mb-4">
                {SPECIALTIES.map((s) => (
                  <NwButton
                    key={s.value}
                    title={s.label}
                    onPress={() => setSpecialty(s.value)}
                    variant={specialty === s.value ? "primary" : "secondary"}
                    className="h-10 mt-1"
                  />
                ))}
              </View>

              <NwButton
                title="Criar meu perfil profissional"
                onPress={handleQuickCreate}
                isLoading={isLoading}
              />
            </View>
          )}

          {isProfessional && (
            <Text className="font-body text-xs text-vupth-textSecondary mt-2">
              Você já tem perfil profissional nesta loja. Para somar mais gente,
              convide alguém ou espere uma solicitação de vínculo.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
