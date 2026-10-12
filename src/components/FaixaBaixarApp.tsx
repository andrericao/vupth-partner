import { useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { API_ENV } from "@lib/api";
import { APK_NO_AR, ehIOS, linkDeBaixar, raizDoSitePartner } from "@lib/baixarApp";

const CHAVE = "vupth.faixaBaixarApp.fechada";

// O navegador pode negar o localStorage (aba anonima, dados bloqueados): ai a
// faixa so volta na proxima visita, sem quebrar nada.
function fechadaAntes(): boolean {
  try {
    return globalThis.localStorage?.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

function lembrarFechada() {
  try {
    globalThis.localStorage?.setItem(CHAVE, "1");
  } catch {
    // sem armazenamento: so nesta visita
  }
}

type Props = {
  web?: boolean;
  userAgent?: string | null;
  apkNoAr?: boolean;
  raiz?: string;
};

/**
 * baixar-do-parceiro (Andre, 11/10; o mesmo do Client): no site do Partner,
 * "Baixar o app" ou "Continuar na web". Continuar fecha e nao volta. No iPhone
 * nao aparece (nao ha app para iOS); dentro do app, nunca.
 */
export function FaixaBaixarApp({
  web = Platform.OS === "web",
  userAgent = globalThis.navigator?.userAgent,
  apkNoAr = APK_NO_AR,
  raiz = raizDoSitePartner(API_ENV),
}: Props) {
  const [fechada, setFechada] = useState(fechadaAntes);

  if (!web || !apkNoAr || fechada || ehIOS(userAgent)) return null;

  function continuar() {
    lembrarFechada();
    setFechada(true);
  }

  return (
    <View testID="faixa-baixar-app" className="flex-row items-center gap-3 bg-vupth-forest px-4 py-2.5">
      <Text className="flex-1 font-body text-f13 text-white">O VUPTH Parceiro é melhor no app.</Text>
      <Pressable onPress={continuar} accessibilityRole="button" testID="continuar-na-web">
        <Text className="font-body text-f13 text-white">Continuar na web</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL(linkDeBaixar(raiz))}
        accessibilityRole="button"
        testID="baixar-o-app"
        className="rounded-full bg-vupth-green px-3.5 py-1.5"
      >
        <Text className="font-heading text-f13 text-vupth-forest">Baixar o app</Text>
      </Pressable>
    </View>
  );
}
