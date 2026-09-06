import { useEffect, useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  ScrollView,
  Spinner,
  Box,
} from "@gluestack-ui/themed";
import { Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { BrandButton } from "@components/brand/Button";
import { api, getApiErrorMessage } from "@lib/api";
import { serviceTypeLabel } from "@lib/serviceTypes";
import {
  useEstablishmentStore,
  EstablishmentDetail,
} from "@store/establishment.store";
import { parseApiTime } from "@lib/time";
import { maskPhone } from "@lib/masks";
import { avisar } from "@lib/confirmar";

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
    <VStack>
      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$sm" color="$brandTextSecondary">
        {label}
      </Text>
      <Text
        fontFamily="$body"
        color={value ? "$brandTextSecondary" : "$brandTextSecondary"}
        mt="$1"
      >
        {value ?? "Não informado"}
      </Text>
    </VStack>
  );
}

export default function EstablishmentDetailScreen() {
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
        <VStack flex={1} pb="$12" px="$4">
          <ScreenHeader title={name} onBack={() => router.back()} />

          {detail?.url_image ? (
            <Image
              source={{ uri: detail.url_image }}
              style={{
                width: "100%",
                height: 192,
                borderRadius: 12,
                marginTop: 16,
              }}
              resizeMode="cover"
            />
          ) : (
            <Box
              mt="$4"
              h="$48"
              borderRadius="$xl"
              bg="$brandSurface"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontFamily="$body" color="$brandTextSecondary">
                Sem foto
              </Text>
            </Box>
          )}

          <HStack mt="$6" alignItems="center" justifyContent="space-between">
            <Heading size="2xl" fontFamily="$heading" flex={1}>
              {name}
            </Heading>
            <Text
              fontFamily="$body"
              fontSize="$sm"
              color={isOpen ? "$forest" : "$brandTextSecondary"}
            >
              {isOpen ? "Aberto" : "Fechado"}
            </Text>
          </HStack>

          {serviceType ? (
            <Text fontFamily="$body" fontSize="$sm" color="$brandTextSecondary" mt="$1">
              {serviceType}
            </Text>
          ) : null}

          {isLoading ? (
            <VStack alignItems="center" mt="$8">
              <Spinner color="$forest" size="large" />
            </VStack>
          ) : (
            <VStack mt="$6" space="md">
              <DetailRow label="Endereço" value={address} />
              <DetailRow label="Horário" value={hours} />
              <DetailRow label="Telefone" value={phone} />
              <DetailRow label="Instagram" value={instagram} />
            </VStack>
          )}

          <Box flex={1} />

          <BrandButton
            title="Solicitar vinculação"
            onPress={handleRequestAffiliation}
            isLoading={isRequesting}
            mt="$8"
          />
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
