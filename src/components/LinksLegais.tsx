import { View, Text, Pressable, Linking } from "react-native";
import { API_ENV } from "@lib/api";
import type { ApiEnv } from "@lib/apiEnv";
import { baseDoWebCliente } from "@lib/linkPublico";

// termos-no-rodape (PAR-4, Andre 15/10): "falta o link de Termos de uso e
// Politica de privacidade no rodape (tela de entrada e Perfil/Menu), igual ao
// Client". As paginas legais ja estao no ar no web do Client (/termos e
// /privacidade, paginas-legais) e valem para os dois apps.

export function linkLegal(pagina: "termos" | "privacidade", env: ApiEnv = API_ENV): string {
  return `${baseDoWebCliente(env)}/${pagina}`;
}

async function abrir(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // sem navegador: nada a fazer na tela
  }
}

export function LinksLegais({ className = "" }: { className?: string }) {
  return (
    <View className={`flex-row justify-center items-center gap-2 ${className}`} testID="links-legais">
      <Pressable onPress={() => abrir(linkLegal("termos"))} hitSlop={8} accessibilityRole="link" testID="link-termos">
        <Text className="font-body text-xs text-vupth-textSecondary underline">Termos de uso</Text>
      </Pressable>
      <Text className="font-body text-xs text-vupth-textSecondary">·</Text>
      <Pressable
        onPress={() => abrir(linkLegal("privacidade"))}
        hitSlop={8}
        accessibilityRole="link"
        testID="link-privacidade"
      >
        <Text className="font-body text-xs text-vupth-textSecondary underline">Política de privacidade</Text>
      </Pressable>
    </View>
  );
}
