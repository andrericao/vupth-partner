import { View, Text, Pressable } from "react-native";
import { Store, Search } from "lucide-react-native";

// S23 — "Onde voce vai atender?", o passo que faltava entre criar o perfil de
// profissional e buscar estabelecimento.
//
// Por que existia o beco: o `handleRegister` do onboarding mandava sempre para
// a busca, entao quem tem loja PROPRIA procurava na busca uma loja que ainda
// nao existe — e nao havia como sair de la. O backend nunca foi o bloqueio
// (auditoria de 2026-08-27: `quick-create` aceita quem ja e PROFESSIONAL,
// papeis sao acumulativos e a reputacao vive no `Professional`, sem migracao).
//
// Sem opcao pre-selecionada de proposito: as duas sao legitimas, e escolher por
// engano custa desafiliacao depois.

type Props = {
  /** Abrir a propria loja — leva ao cadastro de estabelecimento do dono. */
  onOwnShop: () => void;
  /** Afiliar-se — leva a busca, o comportamento que ja existia. */
  onExistingShop: () => void;
};

function Opcao({
  titulo,
  descricao,
  Icone,
  onPress,
}: {
  titulo: string;
  descricao: string;
  Icone: typeof Store;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      className="flex-row items-center gap-3 p-4 rounded-2xl border border-vupth-border bg-vupth-surface active:bg-vupth-greenTint"
    >
      <View className="w-10 h-10 rounded-full bg-vupth-greenTint items-center justify-center">
        <Icone size={20} color="#163300" />
      </View>
      <View className="flex-1">
        <Text className="font-heading text-[15px] text-vupth-forest">{titulo}</Text>
        <Text className="font-body text-[13px] text-vupth-textSecondary mt-0.5">{descricao}</Text>
      </View>
    </Pressable>
  );
}

export function OnboardingPathChoice({ onOwnShop, onExistingShop }: Props) {
  return (
    <View className="gap-3">
      <Opcao
        titulo="Na minha própria loja"
        descricao="Você abre o estabelecimento e atende nele"
        Icone={Store}
        onPress={onOwnShop}
      />
      <Opcao
        titulo="Numa loja que já existe"
        descricao="Você pede vínculo e o dono aprova"
        Icone={Search}
        onPress={onExistingShop}
      />
    </View>
  );
}
