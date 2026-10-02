import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { FotoEditavel } from "@components/FotoEditavel";
import { CompartilharPerfil } from "@components/CompartilharPerfil";
import { useEstablishmentStore } from "@store/establishment.store";
import { editarFoto, rotaDaFotoDaLoja } from "@lib/fotoDePerfil";
import { avisar } from "@lib/confirmar";
import { linkDaLoja } from "@lib/linkPublico";
import { API_ENV } from "@lib/api";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { CompletionCard } from "@components/CompletionCard";
import { useAnuncioPronto } from "@hooks/useAnuncioPronto";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";

type MenuItemProps = {
  label: string;
  description: string;
  onPress: () => void;
};

function MenuItem({ label, description, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="py-4 px-4 bg-vupth-surface rounded-card active:bg-vupth-surface"
    >
      <Text className="font-heading text-base text-vupth-forest">{label}</Text>
      <Text className="font-body text-sm text-vupth-textSecondary mt-0.5">{description}</Text>
    </Pressable>
  );
}

export default function EstablishmentDataScreen() {
  // Checklist de prontidao (2 completes) mora aqui, nas Configuracoes — a Home
  // so mostra a faixa. Ver useOwnerCompletion / CompletionCard.
  const { completion, professionalsCount, routeFor } = useOwnerCompletion();
  const establishment = useEstablishmentStore((s) => s.establishment);
  // A foto da loja (Andre, 26/09) — url_image, que ate aqui ninguem preenchia.
  const [fotoDaLoja, setFotoDaLoja] = useState<string | null>(establishment?.url_image ?? null);
  // A lista /mine pode nao trazer a foto: o detalhe traz (urlImage/url_image).
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);
  useEffect(() => {
    if (!establishment?.id) return;
    fetchEstablishmentById(establishment.id)
      .then((d) => setFotoDaLoja((atual) => atual ?? d.url_image ?? null))
      .catch(() => {});
  }, [establishment?.id, fetchEstablishmentById]);
  const aoMudarFoto = (uri: string | null) => {
    setFotoDaLoja(uri);
    const atual = useEstablishmentStore.getState().establishment;
    if (atual) useEstablishmentStore.setState({ establishment: { ...atual, url_image: uri } });
  };
  useAnuncioPronto(
    "dono",
    completion.basic.percent,
    "O cadastro da loja está completo — você já pode abrir e atender."
  );

  return (
    <ScrollView
      className="w-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Dados do estabelecimento"
          onBack={() => router.navigate("/(owner)/menu" as any)}
        />

        {/* Foto da loja com o selo de camera, e o link publico com o copiar ao
            lado (Andre, 26/09). */}
        {establishment?.id && (
          <View className="mt-2 mb-4 gap-4">
            <FotoEditavel
              nome={establishment.name}
              uri={fotoDaLoja}
              rotulo={fotoDaLoja ? "Trocar foto da loja" : "Pôr foto da loja"}
              testID="foto-loja"
              onEscolher={(acao) =>
                editarFoto({
                  temFoto: !!fotoDaLoja,
                  rota: rotaDaFotoDaLoja(establishment.id),
                  aoMudar: aoMudarFoto,
                  titulo: "Foto da loja",
                  perguntar: async () => acao,
                  avisar,
                })
              }
            />
            <CompartilharPerfil
              rotulo="Compartilhar a loja"
              link={linkDaLoja(API_ENV, establishment.id)}
              titulo={establishment.name ?? "Minha loja"}
              mensagem="Entre na fila da nossa loja pelo Vupth:"
            />
          </View>
        )}

        <CompletionCard
          completion={completion}
          routeFor={routeFor}
        />

        <View className="mt-6 gap-2">
          <MenuItem
            label="Dados Cadastrais"
            description="Nome do estabelecimento"
            onPress={() => router.push("/(owner)/establishment-registration" as any)}
          />
          <MenuItem
            label="Horário de Funcionamento"
            description="Abertura e fechamento"
            onPress={() => router.push("/(owner)/establishment-hours" as any)}
          />
          <MenuItem
            label="Endereço"
            description="Rua, número, bairro, CEP"
            onPress={() => router.push("/(owner)/onboarding/address" as any)}
          />
        </View>

        <View
          className="mt-4 bg-vupth-surface rounded-card px-4 py-4 flex-row justify-between items-center"
        >
          <Text className="font-body text-base text-vupth-textSecondary">
            Profissionais vinculados
          </Text>
          <Text className="font-heading text-lg text-vupth-forest">
            {professionalsCount}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
