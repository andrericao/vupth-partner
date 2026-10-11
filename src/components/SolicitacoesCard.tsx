import { View, Text, Pressable } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { Titulo } from "@components/Titulo";
import { LiveDot } from "@components/LiveDot";
import type { ResumoSolicitacoes } from "@lib/cutRequests";

// O pedido de encaixe, DENTRO da Fila.
//
// Ele existia so como um ponto de 12px no menu ☰ — item 1 da lista de defeitos
// desde 05/08 ("solicitei corte e nada apareceu na tela do profissional"). O
// ponto avisa que ha algo; nao diz o que, de quem, nem que esta correndo
// relogio. E o profissional nao esta olhando o menu: esta olhando a fila.
//
// Em 07/09 a decisao de que FILA FECHADA CONTINUA ACEITANDO SOLICITACAO tornou
// este o UNICO caminho do cliente para quem nao esta de expediente. O card
// deixou de ser conforto e virou o canal.
//
// Pessego (accentPeach) e a mesma cor do BlocoBloqueio: e a cor de "isto pede
// acao sua". Nao usa verde-marca de proposito — verde aqui competiria com o
// card de ATENDENDO AGORA, que precisa continuar sendo o mais claro da tela.
type Props = {
  resumo: ResumoSolicitacoes;
  onPress: () => void;
};

export function SolicitacoesCard({ resumo, onPress }: Props) {
  // 5 minutos e o TTL do backend. Abaixo de 2, o pedido morre antes de o
  // profissional terminar o que esta fazendo — entao o relogio pisca.
  // Sem prazo (so pedidos de outro dia, DEC-27): nada expira, nada pisca.
  const urgente = resumo.expiraEm !== null && resumo.expiraEm <= 2;

  return (
    <Pressable
      testID="solicitacoes-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${resumo.titulo}. ${resumo.quem}. Toque para decidir.`}
      className="bg-vupth-accentPeach rounded-card p-4 mt-4 gap-1.5 active:opacity-90"
    >
      <View className="flex-row items-center gap-1.5">
        <LiveDot size={7} color="#163300" pulsing={urgente} />
        <Titulo nivel={2}>{resumo.titulo}</Titulo>
      </View>

      <Text className="font-body text-f14 text-vupth-forest">{resumo.quem}</Text>

      <View className="flex-row items-center justify-between mt-1">
        {/* O relogio e do MAIS urgente: e ele que decide se da tempo. */}
        <Text testID="solicitacoes-expira" className="font-mono text-xs text-vupth-forest">
          {resumo.expiraEm === null
            ? "sem prazo"
            : resumo.expiraEm <= 0
              ? "expira agora"
              : resumo.expiraEm > 60 && resumo.venceAs
                ? `vale até ${resumo.venceAs}`
                : `expira em ${resumo.expiraEm} min`}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-heading text-f13 text-vupth-forest">Ver solicitações</Text>
          <ArrowRight size={15} color="#163300" />
        </View>
      </View>
    </Pressable>
  );
}
