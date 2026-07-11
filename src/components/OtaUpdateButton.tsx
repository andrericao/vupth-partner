import { useState } from "react";
import { Alert } from "react-native";
import * as Updates from "expo-updates";
import { VStack, Text } from "@gluestack-ui/themed";
import { Button } from "@components/Button";

// Botao "Verificar atualizacao" (OTA) — espelhado do front-client. Forca a
// checagem do EAS Update na hora (checkForUpdate -> fetch -> reload), evitando
// ter que fechar/abrir o app 2x pra puxar a versao nova. So funciona no APK de
// build (no Expo Go/dev cai no catch).
export function OtaUpdateButton() {
  const [isChecking, setIsChecking] = useState(false);

  async function handleCheckUpdate() {
    setIsChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "Atualizacao baixada",
          "O app vai reiniciar para aplicar a nova versao.",
          [{ text: "OK", onPress: () => Updates.reloadAsync() }]
        );
      } else {
        Alert.alert("Tudo certo", "Voce ja esta na versao mais recente.");
      }
    } catch {
      Alert.alert(
        "Nao foi possivel verificar",
        "Atualizacoes OTA so funcionam no APK de build (nao no Expo Go/modo dev)."
      );
    } finally {
      setIsChecking(false);
    }
  }

  // Mostra o id do OTA + data/hora em que ele foi publicado (Updates.createdAt) =
  // o "horario do ultimo push". Espelhado do front-client (Settings.tsx).
  const otaInfo = Updates.updateId
    ? `OTA ${Updates.updateId.slice(0, 8)}${
        Updates.createdAt
          ? ` · ${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
          : ""
      }`
    : "bundle embutido (nenhum OTA aplicado)";

  return (
    <VStack mt="$8" alignItems="center" space="xs">
      <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">
        Runtime {Updates.runtimeVersion ?? "—"} · canal {Updates.channel ?? "dev"}
      </Text>
      <Text fontFamily="$body" fontSize="$xs" color="$coolGray400">
        {otaInfo}
      </Text>
      <Button
        title={isChecking ? "Verificando..." : "Verificar atualizacao"}
        onPress={handleCheckUpdate}
        bg="transparent"
        borderWidth="$1"
        borderColor="$green500"
        textColor="$green600"
        $active-bg="$green50"
        h="$9"
        mt="$2"
      />
    </VStack>
  );
}
