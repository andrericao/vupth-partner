import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Papel = {
  role: "owner" | "professional";
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  /** O papel de dono e o destaque: e quem traz o estabelecimento pro app. */
  destaque?: boolean;
};

const PAPEIS: Papel[] = [
  {
    role: "owner",
    icone: "storefront-outline",
    titulo: "Sou dono de estabelecimento",
    descricao: "Gerencie sua loja, profissionais e filas",
    destaque: true,
  },
  {
    role: "professional",
    icone: "person-outline",
    titulo: "Sou profissional",
    descricao: "Atenda clientes e organize sua fila",
  },
];

export default function RoleChoiceScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 gap-3 mb-12">
        <Text className="font-display text-[15px] tracking-[2px] text-vupth-forest">
          VUPTH
        </Text>
        <Text className="font-display text-[30px] leading-[32px] text-vupth-forest">
          Como você vai usar o Vupth?
        </Text>
        <Text className="font-body text-[15px] text-vupth-textSecondary">
          Escolha seu papel para começar.
        </Text>
      </View>

      {/* Cartoes em vez de dois botoes empilhados: a escolha tem consequencia
          (papeis diferentes, apps diferentes por dentro) e a descricao e o que
          permite decidir sem ter de adivinhar pelo titulo. */}
      <View className="px-4 gap-3">
        {PAPEIS.map((p) => (
          <Pressable
            key={p.role}
            onPress={() => router.push(`/(auth)/register?role=${p.role}` as any)}
            className={`flex-row items-center gap-3.5 p-[18px] rounded-[20px] ${
              p.destaque
                ? "bg-vupth-green active:bg-vupth-success"
                : "bg-vupth-surface active:bg-vupth-border"
            }`}
            accessibilityRole="button"
            testID={`role-${p.role}`}
          >
            <Ionicons name={p.icone} size={24} color="#163300" />
            <View className="flex-1 gap-0.5">
              <Text className="font-display text-base text-vupth-forest">{p.titulo}</Text>
              <Text
                className={`font-body text-xs ${
                  p.destaque ? "text-vupth-forest opacity-70" : "text-vupth-textSecondary"
                }`}
              >
                {p.descricao}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#163300" />
          </Pressable>
        ))}
      </View>

      <View className="px-4 mt-8 flex-row justify-center items-center gap-1.5">
        <Text className="font-body text-[13px] text-vupth-textSecondary">Já tem conta?</Text>
        <Pressable onPress={() => router.push("/(auth)/login" as any)} testID="go-login">
          <Text className="font-heading text-[13px] text-vupth-forest">Entrar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
