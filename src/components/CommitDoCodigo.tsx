import { Text } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { commitDoCodigo, commitVisivelNoCanal } from "@lib/commitDoCodigo";

// O commit no rodape da tela de entrada: a bateria Maestro le o `app-commit`
// e para logo se o app instalado nao for o codigo esperado (Andre, 03/10).
// Em DM Mono e discreto, como a linha da versao em Sistema. Na producao ele nao
// aparece (versao-so-nas-configuracoes, Andre 17/10): a versao fica so la.
export function CommitDoCodigo() {
  const commit = commitDoCodigo(Constants.expoConfig);
  if (!commit || !commitVisivelNoCanal(Updates.channel)) return null;
  return (
    <Text
      className="font-mono text-f10 text-vupth-textSecondary text-center mt-8"
      testID="app-commit"
    >
      {commit}
    </Text>
  );
}
