import { useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import * as Updates from "expo-updates";

import { WsDiagnostics } from "@components/WsDiagnostics";
import { PushDiagnostics } from "@components/PushDiagnostics";
import { avisar } from "@lib/confirmar";

// Botao de "puxar atualizacao agora" (OTA). Sem ele, o Expo aplica o update
// so na 2a abertura do app — no teste de device isso vira "mas eu ja atualizei"
// ter que fechar/abrir o app 2x pra puxar a versao nova. So funciona no APK de
// build; no Expo Go / modo dev nao ha OTA pra buscar.
//
// [QA] O diagnostico de WebSocket MORA AQUI, atras de 7 toques na versao.
// Ele nasceu porque os logs sao gated por `__DEV__` e o QA roda bundle de OTA,
// entao o dado precisava sair na tela. So que ele estava SOLTO em
// Configuracoes, e o usuario final via "falhou o handshake", contagem de erros
// e a URL do servidor — ruido tecnico que nao ajuda quem so quer mexer na
// conta (Alexia 2026-08-21). O gesto de 7 toques e o padrao de "modo
// desenvolvedor": continua acessivel em producao, some da vista de quem nao
// procura.
const TOQUES_PRA_ABRIR = 7;

export function OtaUpdateButton() {
  const [isChecking, setIsChecking] = useState(false);
  const [toques, setToques] = useState(0);
  const diagnosticoAberto = toques >= TOQUES_PRA_ABRIR;

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        // `avisar` e nao `Alert.alert` com botao: na web o Alert nao aparece,
        // entao o onPress nunca roda e o app NAO reiniciava — o update ficava
        // baixado e sem aplicar, calado.
        await avisar({
          titulo: "Atualização baixada",
          mensagem: "O app vai reiniciar para aplicar a nova versão.",
        });
        await Updates.reloadAsync();
      } else {
        Alert.alert("Tudo certo", "Você já está na versão mais recente.");
      }
    } catch {
      Alert.alert(
        "Sem atualização",
        "Atualizações OTA só funcionam no APK de build (não no Expo Go/modo dev)."
      );
    } finally {
      setIsChecking(false);
    }
  };

  // Id do OTA + data/hora de publicacao (Updates.createdAt) = o "horario do
  // ultimo push". Espelhado do front-client (Settings.tsx).
  const otaInfo = Updates.updateId
    ? `OTA ${Updates.updateId.slice(0, 8)}${
        Updates.createdAt
          ? ` · ${Updates.createdAt.toLocaleDateString()} ${Updates.createdAt.toLocaleTimeString()}`
          : ""
      }`
    : "bundle embutido (nenhum OTA aplicado)";

  return (
    <View className="mt-8 items-center gap-3">

      {/* No navegador nao existe OTA: a versao nova chega em qualquer navegacao,
          e o botao so levaria a um erro (Andre, 18/09). */}
      {Platform.OS !== "web" && (
        <Pressable
          onPress={handleCheckUpdate}
          className="flex-row items-center bg-vupth-surface rounded-full px-4 py-3 active:opacity-70"
          accessibilityRole="button"
          testID="check-update"
        >
          <Text className="font-heading text-[13px] text-vupth-forest">
            {isChecking ? "Verificando..." : "Verificar atualização"}
          </Text>
        </Pressable>
      )}

      {/* Versao em DM Mono: e numero de build, nao prosa. Abaixo do botao e
          numa linha so, como no client (16/09). Junta so o que EXISTE: em dev
          o runtime e o canal vem vazios. */}
      <Pressable
        onPress={() => setToques((n) => n + 1)}
        accessibilityRole="button"
        accessibilityLabel="Informações da versão"
        testID="version-line"
      >
        <Text className="font-mono text-[10px] text-vupth-textSecondary text-center">
          {[Updates.runtimeVersion, Updates.channel, otaInfo].filter(Boolean).join(" · ")}
        </Text>
      </Pressable>

      {diagnosticoAberto && (
        <View className="w-full">
          <WsDiagnostics />
          <PushDiagnostics />
        </View>
      )}
    </View>
  );
}
