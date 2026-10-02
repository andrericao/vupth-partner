import { Image, type ImageStyle, type StyleProp } from "react-native";
import { carregarExpoImage } from "@lib/modulosNativos";

type Props = {
  uri: string;
  style: StyleProp<ImageStyle>;
  testID?: string;
};

// Foto que vem da internet (perfil e loja, no R2). Com o expo-image (build
// 1.5.0+) guarda em disco: reabrir a tela nao baixa de novo, e a lista de
// profissionais nao pisca ao rolar (`recyclingKey`). No binario antigo, o Image
// do RN — a foto aparece igual, so sem o cache. Melhoria de 02/10.
export function FotoRemota({ uri, style, testID }: Props) {
  const expoImage = carregarExpoImage();
  if (expoImage) {
    return (
      <expoImage.Image
        testID={testID}
        source={{ uri }}
        style={style}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <Image testID={testID} source={{ uri }} style={style} resizeMode="cover" accessibilityIgnoresInvertColors />
  );
}
