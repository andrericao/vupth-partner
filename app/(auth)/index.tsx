import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Store, User, ChevronRight } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { getRoleCardRoute } from "@lib/routing";
import { CommitDoCodigo } from "@components/CommitDoCodigo";
import { useAuthStore } from "@store/auth.store";

type Papel = {
  role: "owner" | "professional";
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  /** O papel de dono e o destaque: e quem traz o estabelecimento pro app. */
  destaque?: boolean;
};

const PAPEIS: Papel[] = [
  {
    role: "owner",
    icone: Store,
    titulo: "Sou dono de estabelecimento",
    descricao: "Gerencie sua loja, profissionais e filas",
    destaque: true,
  },
  {
    role: "professional",
    icone: User,
    titulo: "Sou profissional",
    descricao: "Atenda clientes e organize sua fila",
  },
];

/**
 * Entrada do app. Ela atende DUAS pessoas diferentes, e tratar as duas como a
 * mesma era um beco sem saida:
 *
 *  · quem nao tem conta -> escolhe o papel e vai CRIAR conta
 *  · quem JA tem conta (o cliente do outro app, que agora vai abrir loja) ->
 *    escolhe o que quer criar e vai direto pro onboarding
 *
 * O BECO: quem ja tinha conta so de CLIENT tocava "Ja tem conta? Entrar",
 * logava, e o `getPostLoginRoute` — sem papel de parceiro e sem intencao —
 * devolvia `/(auth)`, esta mesma tela. Quicava pra sempre. O caminho pelo
 * CADASTRAR funcionava (o `register` preserva o `?role=`); so o de quem ja era
 * cliente estava morto, que e exatamente o caso que o produto quer atender.
 *
 * A conta e a MESMA nos dois apps (mesmo /auth/login, mesmo User no backend);
 * o que muda e ganhar o papel, e papel se ganha criando a entidade — loja ou
 * perfil profissional. Por isso, pra quem ja esta logado, o cartao leva ao
 * onboarding e nao ao cadastro.
 */
export default function RoleChoiceScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 gap-3 mb-12">
        <Text className="font-display text-f15 tracking-[2px] text-vupth-forest">
          VUPTH
        </Text>
        <Text className="font-display text-f30 leading-[32px] text-vupth-forest">
          {isAuthenticated ? "O que você quer criar?" : "Como você vai usar o Vupth?"}
        </Text>
        <Text className="font-body text-f15 text-vupth-textSecondary">
          {isAuthenticated
            ? "É a mesma conta que você já usa — não precisa criar outra."
            : "Escolha seu papel para começar."}
        </Text>
      </View>

      {/* Cartoes em vez de dois botoes empilhados: a escolha tem consequencia
          (papeis diferentes, apps diferentes por dentro) e a descricao e o que
          permite decidir sem ter de adivinhar pelo titulo. */}
      <View className="px-4 gap-3">
        {PAPEIS.map((p) => {
          const Icone = p.icone;
          return (
            <Pressable
              key={p.role}
              onPress={() => router.push(getRoleCardRoute(isAuthenticated, p.role) as any)}
              className={`flex-row items-center gap-3.5 p-[18px] rounded-card ${
                p.destaque
                  ? "bg-vupth-green active:bg-vupth-success"
                  : "bg-vupth-surface active:bg-vupth-border"
              }`}
              accessibilityRole="button"
              testID={`role-${p.role}`}
            >
              <Icone size={24} color="#163300" />
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
              <ChevronRight size={20} color="#163300" />
            </Pressable>
          );
        })}
      </View>

      {/* Some pra quem ja esta logado: oferecer "entrar" a quem ja entrou era
          o que fechava o ciclo. */}
      {!isAuthenticated && (
        <View className="px-4 mt-8 flex-row justify-center items-center gap-1.5">
          <Text className="font-body text-f13 text-vupth-textSecondary">Já tem conta?</Text>
          <Pressable onPress={() => router.push("/(auth)/login" as any)} testID="go-login">
            <Text className="font-heading text-f13 text-vupth-forest">Entrar</Text>
          </Pressable>
        </View>
      )}

      <CommitDoCodigo />
    </ScrollView>
  );
}
