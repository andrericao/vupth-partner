import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { FotoEditavel } from "@components/FotoEditavel";
import { CompartilharPerfil } from "@components/CompartilharPerfil";
import { useEstablishmentStore } from "@store/establishment.store";
import { editarFoto, rotaDaFotoDaLoja } from "@lib/fotoDePerfil";
import { avisar } from "@lib/confirmar";
import { linkDaLoja, mensagemDeDivulgacao } from "@lib/linkPublico";
import { API_ENV } from "@lib/api";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { CompletionCard } from "@components/CompletionCard";
import { useAnuncioPronto } from "@hooks/useAnuncioPronto";
import { useOwnerCompletion } from "@hooks/useOwnerCompletion";
import { ApagarLojaModal } from "@components/ApagarLojaModal";
import { mensagemDaRemocaoDaLoja } from "@lib/exclusaoDeConta";

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
      <Text className="font-heading text-base text-vupth-textPrimary">{label}</Text>
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
  const deleteEstablishment = useEstablishmentStore((s) => s.deleteEstablishment);

  // desativar-conta (c0f5b17, item 5): apagar a loja, com a senha.
  const [apagarAberto, setApagarAberto] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erroApagar, setErroApagar] = useState<string | null>(null);

  const apagarLoja = async (senhaAtual: string) => {
    if (!establishment) return;
    setApagando(true);
    setErroApagar(null);
    try {
      await deleteEstablishment(establishment.id, senhaAtual);
      setApagarAberto(false);
      router.replace("/(owner)/onboarding/establishment" as any);
    } catch (error: any) {
      setErroApagar(mensagemDaRemocaoDaLoja(error));
    } finally {
      setApagando(false);
    }
  };
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
              titulo="Foto da loja"
              onEscolher={(acao, enquadrar) =>
                editarFoto({
                  temFoto: !!fotoDaLoja,
                  rota: rotaDaFotoDaLoja(establishment.id),
                  aoMudar: aoMudarFoto,
                  titulo: "Foto da loja",
                  enquadrar,
                  perguntar: async () => acao,
                  avisar,
                })
              }
            />
            <CompartilharPerfil
              rotulo="Compartilhar a loja"
              link={linkDaLoja(API_ENV, establishment.id)}
              titulo={establishment.name ?? "Minha loja"}
              mensagem={mensagemDeDivulgacao(establishment.name)}
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
          <MenuItem
            label="Passar a posse"
            description="Outra pessoa da equipe fica com a loja"
            onPress={() => router.push("/(owner)/passar-posse" as any)}
          />
        </View>

        <View
          className="mt-4 bg-vupth-surface rounded-card px-4 py-4 flex-row justify-between items-center"
        >
          <Text className="font-body text-base text-vupth-textSecondary">
            Profissionais vinculados
          </Text>
          <Text className="font-heading text-lg text-vupth-textPrimary">
            {professionalsCount}
          </Text>
        </View>

        {/* No fim e discreto: apagar a loja e raro e irreversivel. */}
        <Pressable
          onPress={() => {
            setErroApagar(null);
            setApagarAberto(true);
          }}
          className="mt-10 self-center py-2"
          accessibilityRole="button"
          accessibilityLabel="Apagar a loja"
          testID="delete-store"
        >
          <Text className="font-heading text-xs text-vupth-danger">Apagar a loja</Text>
        </Pressable>
      </View>

      <ApagarLojaModal
        visible={apagarAberto}
        nomeDaLoja={establishment?.name ?? "A loja"}
        isDeleting={apagando}
        error={erroApagar}
        onConfirm={apagarLoja}
        onClose={() => setApagarAberto(false)}
      />
    </ScrollView>
  );
}
