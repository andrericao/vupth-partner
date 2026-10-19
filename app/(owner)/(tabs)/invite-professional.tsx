import { useState, useEffect, useCallback } from "react";
import { nomeDaEspecialidade } from "@lib/especialidade";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CampoDeBusca } from "@components/nw/CampoDeBusca";
import { SkeletonList } from "@components/Skeleton";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import {
  useEstablishmentStore,
  type ProfessionalSearchResult,
  type EmailInvitation,
} from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { ConvitePorEmail } from "@components/ConvitePorEmail";

export default function InviteProfessionalScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const searchProfessionals = useEstablishmentStore((s) => s.searchProfessionals);
  const inviteProfessional = useEstablishmentStore((s) => s.inviteProfessional);
  const inviteByEmail = useEstablishmentStore((s) => s.inviteByEmail);
  const fetchEmailInvitations = useEstablishmentStore((s) => s.fetchEmailInvitations);
  const cancelEmailInvitation = useEstablishmentStore((s) => s.cancelEmailInvitation);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfessionalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  // convite-sem-conta (S30, BAK 0774ad2): os convites por e-mail que esperam a conta.
  const [pendentes, setPendentes] = useState<EmailInvitation[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  const establishmentId = establishment?.id;
  const carregarPendentes = useCallback(async () => {
    if (!establishmentId) return;
    try {
      setPendentes(await fetchEmailInvitations(establishmentId));
    } catch {
      // Backend sem o endpoint: a lista so nao aparece.
    }
  }, [establishmentId, fetchEmailInvitations]);

  const runSearch = useCallback(
    async (term: string) => {
      setIsSearching(true);
      try {
        setResults(await searchProfessionals(term));
      } catch (error: any) {
        Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível buscar profissionais."));
      } finally {
        setIsSearching(false);
      }
    },
    [searchProfessionals]
  );

  useEffect(() => {
    // busca inicial (query vazia = todos); sinaliza isSearching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runSearch("");
  }, [runSearch]);

  useEffect(() => {
    // carga inicial da lista (setState depois do await, como a busca acima).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarPendentes();
  }, [carregarPendentes]);

  const handleConviteEmail = async (email: string) => {
    if (!establishment?.id) return;
    setEnviandoEmail(true);
    try {
      const r = await inviteByEmail(establishment.id, email);
      if (r.outcome === "INVITATION_SENT") {
        Alert.alert("Convite enviado", `${email} já tem conta de profissional e recebeu o convite no app.`);
      } else {
        Alert.alert(
          "Convite enviado por e-mail",
          `${email} recebe o convite. Quando criar a conta de profissional, ele aparece para aceitar.`
        );
      }
      await carregarPendentes();
    } catch (error: any) {
      const code = error?.response?.data?.code;
      const message =
        code === "VALIDATION_ERROR"
          ? "Confira o e-mail digitado."
          : code === "PROFESSIONAL_ALREADY_AFFILIATED"
          ? `${email} já está vinculado a um estabelecimento.`
          : code === "AFFILIATION_ALREADY_PENDING"
          ? `Já existe uma solicitação pendente com ${email}.`
          : getApiErrorMessage(error, "Não foi possível enviar o convite.");
      Alert.alert("Não foi possível convidar", message);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleCancelarConvite = async (c: EmailInvitation) => {
    const ok = await confirmar({
      titulo: "Cancelar convite",
      mensagem: `O convite para ${c.email} deixa de valer.`,
      confirmar: "Cancelar convite",
      cancelar: "Manter",
      destrutivo: true,
    });
    if (!ok) return;
    setCancelandoId(c.id);
    try {
      await cancelEmailInvitation(c.id);
      setPendentes((prev) => prev.filter((p) => p.id !== c.id));
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível cancelar o convite."));
      await carregarPendentes();
    } finally {
      setCancelandoId(null);
    }
  };

  const handleInvite = async (p: ProfessionalSearchResult) => {
    if (!establishment?.id) return;
    setInvitingId(p.id);
    try {
      await inviteProfessional(establishment.id, p.id);
      setInvitedIds((prev) => [...prev, p.id]);
      Alert.alert("Convite enviado", `${p.name ?? "Profissional"} receberá a solicitação de vinculação.`);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      // Mensagem no contexto do OWNER (o map padrao fala "voce ja esta vinculado").
      const message =
        code === "PROFESSIONAL_ALREADY_AFFILIATED"
          ? `${p.name ?? "Esse profissional"} já está vinculado a um estabelecimento.`
          : code === "AFFILIATION_ALREADY_PENDING"
          ? `Já existe uma solicitação pendente com ${p.name ?? "esse profissional"}.`
          : getApiErrorMessage(error, "Não foi possível enviar o convite.");
      Alert.alert("Não foi possível convidar", message);
    } finally {
      setInvitingId(null);
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
            title="Convidar profissional"
            subtitle="Busque pelo nome e envie o convite. O profissional precisa aceitar."
            onBack={() => router.navigate("/(owner)/menu" as any)}
          />

          <CampoDeBusca
            value={search}
            placeholder="Nome do profissional"
            onChangeText={setSearch}
            onBuscar={() => runSearch(search)}
            onLimpar={() => {
              setSearch("");
              runSearch("");
            }}
          />

          {isSearching && (
            <View className="mt-4">
              <SkeletonList count={3} />
            </View>
          )}

          {!isSearching && results.length === 0 && (
            <Text className="font-body text-vupth-textSecondary text-center mt-8">
              Nenhum profissional encontrado
            </Text>
          )}

          <View className="gap-2">
            {results.map((p) => {
              const invited = invitedIds.includes(p.id);
              return (
                <View
                  key={p.id}
                  className="flex-row items-center justify-between bg-vupth-surface p-3 rounded-card"
                >
                  <View className="flex-1">
                    <Text className="font-heading text-vupth-textPrimary">
                      {p.name ?? "Profissional"}
                      {p.nickname ? ` (${p.nickname})` : ""}
                    </Text>
                    <Text className="font-body text-xs text-vupth-textSecondary">
                      {nomeDaEspecialidade(p.specialty) || "Sem especialidade"}
                    </Text>
                  </View>
                  {invited ? (
                    <Text className="font-body text-sm text-vupth-textPrimary">Convite enviado</Text>
                  ) : (
                    <NwButton
                      title="Convidar"
                      onPress={() => handleInvite(p)}
                      isLoading={invitingId === p.id}
                      className="h-9 px-4 mt-0"
                    />
                  )}
                </View>
              );
            })}
          </View>

          <ConvitePorEmail
            pendentes={pendentes}
            onConvidar={handleConviteEmail}
            onCancelar={handleCancelarConvite}
            enviando={enviandoEmail}
            cancelandoId={cancelandoId}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
