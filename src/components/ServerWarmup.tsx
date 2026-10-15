import { ActivityIndicator, Image, View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { CommitDoCodigo } from "@components/CommitDoCodigo";

// Tela do portao de readiness (ver src/lib/readiness.ts): o app espera a API
// responder antes de liberar login e cadastro.
//
// abertura-profissional (PAR-10, DEC-40, Andre 15/10): "nao existe PREPARANDO
// SERVIDOR na producao [...] temos que ser profissional, nao passar a imagem de
// amador". A tela e a da marca: o V e um indicador discreto, sem citar
// servidor, API ou tempo de espera. O portao continua por baixo (no staging o
// cold start do Render segue existindo). Quando a Design entregar o V da
// abertura (icone-do-v), troca-se so o arquivo.

const FOREST = "#163300"; // [marca-vupth] $forest — o ActivityIndicator nao aceita token
const LOGO_V = require("../../assets/logo-v.png");

type Props = {
  failed?: boolean;
  onRetry?: () => void;
};

export function ServerWarmup({ failed, onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="items-center gap-6 w-full">
        <Image
          source={LOGO_V}
          resizeMode="contain"
          accessibilityLabel="Vupth"
          testID="abertura-v"
          style={{ width: 96, height: 80 }}
        />
        {failed ? (
          <>
            <View className="items-center gap-2">
              <Text className="font-heading text-lg text-vupth-forest text-center">
                Não foi possível abrir o app
              </Text>
              <Text className="font-body text-sm text-vupth-textSecondary text-center">
                Confira a sua internet e tente de novo.
              </Text>
            </View>
            {onRetry && (
              <NwButton title="Tentar de novo" onPress={onRetry} className="self-stretch mt-2" />
            )}
          </>
        ) : (
          <ActivityIndicator
            size="small"
            color={FOREST}
            accessibilityLabel="Abrindo"
            testID="abertura-carregando"
          />
        )}
        {/* O commit ja na abertura: e a primeira tela que o Andre ve sem login
            (commit-visivel, 03/10). */}
        <CommitDoCodigo />
      </View>
    </View>
  );
}
