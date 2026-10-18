import { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { useEstablishmentStore } from "@store/establishment.store";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { api, getApiErrorMessage } from "@lib/api";
import { vinculoNaLojaNova } from "@lib/lojaPropria";

const SPECIALTIES = [
  { label: "Barbeiro", value: "BARBER" },
  { label: "Cabeleireiro(a)", value: "HAIRDRESSER" },
  { label: "Manicure", value: "NAIL_TECH" },
  { label: "Designer de sobrancelha", value: "EYEBROW_TECH" },
  { label: "Massagista", value: "MASSEUSE" },
  { label: "Esteticista", value: "ESTHETICIAN" },
];

export default function AlsoProfessionalScreen() {
  const { establishmentId, ownerName: paramName } = useLocalSearchParams<{
    establishmentId: string;
    ownerName: string;
  }>();
  const [ownerName, setOwnerName] = useState(paramName ?? "");
  const [specialty, setSpecialty] = useState("BARBER");
  const [isLoading, setIsLoading] = useState(false);

  const quickCreateProfessional = useEstablishmentStore(
    (s) => s.quickCreateProfessional
  );
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);

  const alreadyProfessional = user?.roles?.includes("PROFESSIONAL");

  // Ja profissional (S23, PAR-7): sem loja, vincula direto; atendendo em
  // OUTRA loja, pergunta — trocar tira a pessoa da fila de la. Antes a troca
  // era silenciosa.
  const nomeDaLojaNova = useEstablishmentStore((s) => s.establishment?.name);
  const [lojaAtual, setLojaAtual] = useState<string | null>(null);
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    if (!alreadyProfessional || !establishmentId) return;

    const decidir = async () => {
      try {
        const { data } = await api.get("/professional/me");
        const atual = data.establishment_id ?? data.establishmentId;
        const caminho = vinculoNaLojaNova(atual, establishmentId);

        if (caminho === "perguntar") {
          setLojaAtual(data.establishment_name ?? data.establishmentName ?? "a loja de agora");
          return;
        }
        if (caminho === "vincular") {
          await useProfessionalStore.getState().affiliate(establishmentId);
          await refreshToken();
        }
      } catch {}
      router.replace("/(owner)/dashboard" as any);
    };

    decidir();
    // refreshToken e estavel (Zustand); roda so ao entrar com esses params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyProfessional, establishmentId]);

  const atenderNaLojaNova = async () => {
    setTrocando(true);
    try {
      await useProfessionalStore.getState().switchEstablishment(establishmentId);
      await refreshToken();
      router.replace("/(owner)/dashboard" as any);
    } catch (error: any) {
      // 409 com atendimento em andamento: a mensagem do Backend diz o porque.
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível trocar de loja. Tente de novo."));
    } finally {
      setTrocando(false);
    }
  };

  useEffect(() => {
    if (!paramName) {
      SecureStore.getItemAsync("vupth_owner_name").then((stored) => {
        if (stored) setOwnerName(stored);
      });
    }
  }, [paramName]);

  const handleYes = async () => {
    if (!ownerName.trim()) {
      Alert.alert("Erro", "Nome do proprietário não encontrado.");
      return;
    }

    if (!establishmentId) {
      Alert.alert("Erro", "Estabelecimento não encontrado.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await quickCreateProfessional(
        ownerName.trim(),
        establishmentId,
        specialty
      );

      await useProfessionalStore.getState().setProfessional(result);
      await refreshToken();

      // O servico e do PROFISSIONAL: o onboarding manda p/ "Meus Servicos", na
      // area do profissional, e nao mais p/ a tela de servico do dono (que saiu
      // do menu em 2026-08-11). Uma porta so p/ cadastrar servico.
      router.replace("/(professional)/my-services?from=settings" as any);
    } catch (error: any) {
      const code = error?.response?.data?.code;

      if (code === "USER_ALREADY_PROFESSIONAL" || error?.response?.status === 409) {
        try {
          const { data: me } = await api.get("/professional/me");
          const currentEstId = me.establishment_id ?? me.establishmentId;

          if (currentEstId === establishmentId) {
            await useProfessionalStore.getState().setProfessional(me);
          } else if (currentEstId) {
            await useProfessionalStore.getState().switchEstablishment(establishmentId);
            await useProfessionalStore.getState().fetchMe();
          } else {
            await useProfessionalStore.getState().affiliate(establishmentId);
            await useProfessionalStore.getState().fetchMe();
          }
        } catch (err: any) {
          Alert.alert("Erro", getApiErrorMessage(err, "Não foi possível vincular ao estabelecimento."));
          setIsLoading(false);
          return;
        }
        await refreshToken();
        router.replace("/(professional)/my-services?from=settings" as any);
        return;
      }

      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível criar o perfil profissional."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNo = () => {
    router.replace("/(owner)/dashboard" as any);
  };

  if (alreadyProfessional && lojaAtual) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 pb-6 px-4">
          <ScreenHeader
            title="Onde você vai atender?"
            subtitle={`Hoje você atende em ${lojaAtual}.`}
            onBack={() => router.replace("/(owner)/dashboard" as any)}
          />
          <Text className="font-body text-sm text-vupth-textSecondary mb-6">
            Para atender {nomeDaLojaNova ? `em ${nomeDaLojaNova}` : "na sua loja nova"}, você deixa de atender em {lojaAtual}.
            Dá para decidir depois, em Perfil → Vínculo.
          </Text>
          <View className="gap-3">
            <NwButton
              title={nomeDaLojaNova ? `Atender em ${nomeDaLojaNova}` : "Atender na loja nova"}
              onPress={atenderNaLojaNova}
              isLoading={trocando}
              testID="atender-na-loja-nova"
            />
            <NwButton
              title={`Continuar em ${lojaAtual}`}
              variant="vupthOutline"
              onPress={() => router.replace("/(owner)/dashboard" as any)}
              testID="continuar-na-loja-atual"
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (alreadyProfessional) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-6 px-4">
          <ScreenHeader
            title="Você também vai atender?"
            subtitle="Se for atender clientes aqui, escolha sua especialidade."
            onBack={() => router.navigate("/(owner)/dashboard" as any)}
          />

          <View className="flex-1">

            {ownerName ? (
              <Text className="font-body text-sm text-vupth-textSecondary mb-6">
                Profissional: {ownerName}
              </Text>
            ) : null}

            <Text className="font-heading text-base mb-2 text-vupth-forest">
              Especialidade
            </Text>

            <View className="mb-6">
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
              title="Também atendo"
              onPress={handleYes}
              isLoading={isLoading}
            />

            <NwButton
              title="Só dono"
              onPress={handleNo}
              variant="secondary"
              className="mt-2"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
