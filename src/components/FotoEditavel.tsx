import { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { Avatar } from "@components/Avatar";
import { EnquadrarFoto } from "@components/EnquadrarFoto";
import type { OrigemDaFoto, Enquadrar, FotoEscolhida, Recorte } from "@lib/fotoDePerfil";

export type AcaoDaFoto = OrigemDaFoto | "remover";

type Props = {
  nome?: string | null;
  uri?: string | null;
  /** `enquadrar` abre o "Ajuste a foto"; a promessa devolvida mostra "Enviando…". */
  onEscolher: (acao: AcaoDaFoto, enquadrar: Enquadrar) => void | Promise<void>;
  tamanho?: number;
  /** "Trocar foto de perfil", "Trocar foto da loja"… */
  rotulo: string;
  /** O título da folha: "Foto de perfil", "Foto da loja". */
  titulo?: string;
  testID?: string;
};

type Pendente = { foto: FotoEscolhida; responder: (r: { recorte?: Recorte } | null) => void };

// Foto editavel como nas redes sociais (Instagram, WhatsApp). Andre, 02/10: o
// selo sozinho parecia o icone de "crop" e ele nao percebeu que era o botao.
// Agora: a foto tocavel com o selo de camera, "Editar foto" escrito embaixo, e
// o toque abre uma folha de baixo com Tirar foto · Escolher da galeria ·
// Remover foto. foto-ux (Andre, 15/10): a folha ganhou titulo, o recorte e o
// nosso "Ajuste a foto" (EnquadrarFoto) e a foto mostra "Enviando…" ate subir.
export function FotoEditavel({
  nome,
  uri,
  onEscolher,
  tamanho = 96,
  rotulo,
  titulo = "Foto",
  testID = "foto-editavel",
}: Props) {
  const [aberta, setAberta] = useState(false);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [enviando, setEnviando] = useState(false);
  const insets = useSafeAreaInsets();
  const selo = Math.round(tamanho * 0.32);

  const enquadrar: Enquadrar = (foto) =>
    new Promise((responder) => setPendente({ foto, responder }));
  const fecharAjuste = (r: { recorte?: Recorte } | null) => {
    pendente?.responder(r);
    setPendente(null);
    if (r) setEnviando(true);
  };

  const escolher = async (acao: AcaoDaFoto) => {
    setAberta(false);
    const enviado = onEscolher(acao, enquadrar);
    if (!enviado) return;
    if (acao === "remover") setEnviando(true);
    try {
      await enviado;
    } finally {
      setEnviando(false);
    }
  };

  const opcoes: { acao: AcaoDaFoto; texto: string; Icone: typeof Camera; destrutiva?: boolean }[] = [
    { acao: "camera", texto: "Tirar foto", Icone: Camera },
    { acao: "galeria", texto: "Escolher da galeria", Icone: ImageIcon },
    ...(uri ? [{ acao: "remover" as const, texto: "Remover foto", Icone: Trash2, destrutiva: true }] : []),
  ];

  return (
    <View className="self-center items-center">
      <Pressable
        onPress={() => setAberta(true)}
        disabled={enviando}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        testID={testID}
        className="active:opacity-80"
      >
        <Avatar nome={nome} uri={uri} tamanho={tamanho} testID={`${testID}-avatar`} />
        <View
          testID={`${testID}-selo`}
          className="absolute bg-vupth-forest items-center justify-center border-2 border-white"
          style={{ width: selo, height: selo, borderRadius: selo / 2, right: 0, bottom: 0 }}
        >
          <Camera size={Math.round(selo * 0.5)} color="#9FE870" />
        </View>
        {enviando && (
          <View
            testID={`${testID}-enviando`}
            className="absolute items-center justify-center"
            style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: "rgba(22,51,0,0.55)" }}
          >
            <ActivityIndicator color="#9FE870" />
          </View>
        )}
      </Pressable>
      {enviando ? (
        <Text className="mt-2 font-heading text-sm text-vupth-textSecondary">Enviando…</Text>
      ) : (
        <Pressable onPress={() => setAberta(true)} hitSlop={8} testID={`${testID}-editar`} className="mt-2 active:opacity-70">
          <Text className="font-heading text-sm text-vupth-forest">{uri ? "Editar foto" : "Pôr foto"}</Text>
        </Pressable>
      )}

      <Modal visible={aberta} transparent animationType="slide" onRequestClose={() => setAberta(false)}>
        <View className="flex-1 justify-end">
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }}
            onPress={() => setAberta(false)}
            accessibilityLabel="Fechar opções da foto"
          />
          <View className="bg-vupth-background rounded-t-hero p-4 gap-1" style={{ paddingBottom: insets.bottom + 24 }}>
            <Text className="font-heading text-md text-vupth-textPrimary text-center pb-2">{titulo}</Text>
            {opcoes.map(({ acao, texto, Icone, destrutiva }) => (
              <Pressable
                key={acao}
                testID={`${testID}-${acao}`}
                accessibilityRole="button"
                onPress={() => escolher(acao)}
                className="flex-row items-center gap-3 py-3.5 px-3 rounded-card active:bg-vupth-surface"
              >
                <Icone size={20} color={destrutiva ? "#B3261E" : "#163300"} />
                <Text className={`font-body text-md flex-1 ${destrutiva ? "text-vupth-danger" : "text-vupth-textPrimary"}`}>
                  {texto}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setAberta(false)}
              className="items-center py-3.5 mt-1 rounded-card active:bg-vupth-surface"
            >
              <Text className="font-heading text-md text-vupth-textSecondary">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <EnquadrarFoto
        foto={pendente?.foto ?? null}
        onUsar={(recorte) => fecharAjuste({ recorte })}
        onCancelar={() => fecharAjuste(null)}
        testID={testID}
      />
    </View>
  );
}
