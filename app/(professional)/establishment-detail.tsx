import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { FotoRemota } from "@components/FotoRemota";
import { NwButton } from "@components/nw/Button";
import { api, getApiErrorMessage } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import { buscarHorarios } from "@lib/horariosApi";
import { resumoDoDia, hojeIso } from "@lib/horarioSemanal";
import {
  useEstablishmentStore,
  EstablishmentDetail,
} from "@store/establishment.store";
import { parseApiTime } from "@lib/time";
import { maskPhone } from "@lib/masks";
import { avisar } from "@lib/confirmar";
import { useTema } from "@hooks/useTema";

function formatAddress(a: EstablishmentDetail["address"]): string | null {
  if (!a) return null;
  const line1 = [a.street, a.number].filter(Boolean).join(", ");
  const cityState = [a.city, a.state].filter(Boolean).join(" - ");
  const parts = [
    line1,
    a.complement,
    a.neighborhood,
    cityState,
    a.zipCode ? `CEP ${a.zipCode}` : null,
  ].filter((p): p is string => !!p && p.length > 0);
  return parts.length ? parts.join(" · ") : null;
}

function formatHours(open: string | null, close: string | null): string | null {
  const o = parseApiTime(open);
  const c = parseApiTime(close);
  if (!o && !c) return null;
  return `${o ?? "--:--"} às ${c ?? "--:--"}`;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View>
      <Text className="font-heading text-sm text-vupth-textSecondary">{label}</Text>
      <Text className="font-body text-vupth-textSecondary mt-1">
        {value ?? "Não informado"}
      </Text>
    </View>
  );
}

export default function EstablishmentDetailScreen() {
  const { cores } = useTema();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    serviceType?: string;
    openStatus?: string;
  }>();
  const id = params.id;

  const [detail, setDetail] = useState<EstablishmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  // O horario DO DIA, com as frases do client (ver resumoDoDia). O par
  // `opening_time`/`closing_time` que esta tela usava e o horario de HOJE e vem
  // nulo no dia em que a loja fecha — a linha sumia em vez de dizer que fechou.
  const [resumo, setResumo] = useState<{ hoje: string; reabre: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await useEstablishmentStore
          .getState()
          .fetchEstablishmentById(id);
        if (active) setDetail(data);
      } catch {
        // mantem os dados basicos vindos por params
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    buscarHorarios(id)
      .then((h) => {
        if (active && h) setResumo(resumoDoDia(h, hojeIso()));
      })
      .catch(() => {
        // backend sem a rota da semana: fica o par unico abaixo.
      });
    return () => {
      active = false;
    };
  }, [id]);

  const name = detail?.name ?? params.name ?? "Estabelecimento";
  const serviceType = serviceTypeLabel(detail?.service_type ?? params.serviceType);
  const openStatus = detail?.open_status ?? params.openStatus ?? "";
  const isOpen = openStatus === "OPEN";
  const address = formatAddress(detail?.address ?? null);
  const hours = formatHours(
    detail?.opening_time ?? null,
    detail?.closing_time ?? null
  );
  const phone = detail?.phone ? maskPhone(detail.phone) : null;
  const instagram = detail?.instagram ?? null;

  const handleRequestAffiliation = async () => {
    setIsRequesting(true);
    try {
      await api.post("/professional/me/affiliations", { establishmentId: id });
      // A solicitacao JA FOI enviada. Sem a caixa na web o profissional
      // continuava na mesma tela, achava que nao tinha ido, e enviava de novo.
      await avisar({
        titulo: "Solicitação enviada",
        mensagem: `Sua solicitação para ${name} foi enviada. Aguarde a aprovação do proprietário.`,
      });
      router.navigate("/(professional)/queue" as any);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        getApiErrorMessage(error, "Não foi possível enviar a solicitação.")
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader title={name} onBack={() => router.back()} />

          {detail?.url_image ? (
            <FotoRemota
              uri={detail.url_image}
              style={{ width: "100%", height: 192, borderRadius: 12, marginTop: 16 }}
            />
          ) : (
            <View className="mt-4 h-48 rounded-xl bg-vupth-surface items-center justify-center">
              <Text className="font-body text-vupth-textSecondary">Sem foto</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between mt-6">
            <Text className="flex-1 font-heading text-2xl text-vupth-textPrimary">{name}</Text>
            <Text
              className={`font-body text-sm ${
                isOpen ? "text-vupth-textPrimary" : "text-vupth-textSecondary"
              }`}
            >
              {isOpen ? "Aberto" : "Fechado"}
            </Text>
          </View>

          {serviceType ? (
            <Text className="font-body text-sm text-vupth-textSecondary mt-1">{serviceType}</Text>
          ) : null}

          {isLoading ? (
            <View className="items-center mt-8">
              <ActivityIndicator size="large" color={cores.textPrimary} />
            </View>
          ) : (
            <View className="mt-6 gap-4">
              <DetailRow label="Endereço" value={address} />
              <DetailRow
                label="Horário"
                value={resumo ? [resumo.hoje, resumo.reabre].filter(Boolean).join("\n") : hours}
              />
              <DetailRow label="Telefone" value={phone} />
              <DetailRow label="Instagram" value={instagram} />
            </View>
          )}

          <View className="flex-1" />

          <NwButton
            title="Solicitar vinculação"
            onPress={handleRequestAffiliation}
            isLoading={isRequesting}
            className="mt-8"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
