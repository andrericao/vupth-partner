import { View, Text, Pressable } from "react-native";
import { FotoRemota } from "@components/FotoRemota";

/** "Ana Maria Souza" -> "AS"; sem nome -> "?". */
export function iniciais(nome?: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

type Props = {
  nome?: string | null;
  /** URL publica da foto (profile_image_url); ausente = iniciais. */
  uri?: string | null;
  tamanho?: number;
  onPress?: () => void;
  rotulo?: string;
  testID?: string;
};

// A foto de perfil (S22) — circulo verde com as iniciais enquanto nao ha foto,
// o mesmo desenho que o cabecalho do Perfil ja usava.
export function Avatar({ nome, uri, tamanho = 72, onPress, rotulo, testID = "avatar" }: Props) {
  const estilo = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  const conteudo = uri ? (
    <FotoRemota testID={`${testID}-foto`} uri={uri} style={estilo} />
  ) : (
    <View style={estilo} className="bg-vupth-green items-center justify-center">
      <Text className="font-display text-vupth-forest" style={{ fontSize: tamanho * 0.33 }}>
        {iniciais(nome)}
      </Text>
    </View>
  );
  if (!onPress) return <View testID={testID}>{conteudo}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? "Foto de perfil"}
      className="active:opacity-70"
    >
      {conteudo}
    </Pressable>
  );
}
