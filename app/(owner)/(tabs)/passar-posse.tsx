import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import { ScreenHeader } from "@components/ScreenHeader";
import { PassarPosse } from "@components/PassarPosse";
import { useEstablishmentStore } from "@store/establishment.store";
import { useAuthStore } from "@store/auth.store";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import {
  pedirPosse,
  lerPosseDoDono,
  cancelarPosse,
  mensagemDaPosse,
  candidatosAPosse,
  type PosseDoDono,
} from "@lib/posseDaLoja";

// Passar a posse da loja (desativar-conta, c0f5b17 + S41). Fica no menu da loja
// e vale a qualquer momento (Andre, 08/10), nao so ao sair.
export default function PassarPosseScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const userId = useAuthStore((s) => s.user?.id);
  const establishmentId = establishment?.id ?? null;
  const { data: equipe } = useProfessionalsWithQueueQuery(establishmentId);

  const [pendente, setPendente] = useState<PosseDoDono | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!establishmentId) return;
    try {
      setPendente(await lerPosseDoDono(establishmentId));
    } catch (e) {
      setErro(mensagemDaPosse(e));
    }
  }, [establishmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  const pedir = async (professionalId: string) => {
    if (!establishmentId) return;
    setOcupado(true);
    setErro(null);
    try {
      await pedirPosse(establishmentId, professionalId);
      await carregar();
    } catch (e) {
      setErro(mensagemDaPosse(e));
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    if (!pendente) return;
    setOcupado(true);
    setErro(null);
    try {
      await cancelarPosse(pendente.id);
      setPendente(null);
    } catch (e) {
      setErro(mensagemDaPosse(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="flex-1 pb-12 px-4">
        <ScreenHeader
          title="Passar a posse"
          onBack={() => router.navigate("/(owner)/establishment-data" as any)}
        />
        <View className="px-2">
          <PassarPosse
            pendente={pendente}
            candidatos={candidatosAPosse(equipe?.professionals, userId)}
            ocupado={ocupado}
            erro={erro}
            onPedir={pedir}
            onCancelar={cancelar}
          />
        </View>
      </View>
    </ScrollView>
  );
}
