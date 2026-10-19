import { Animated, Modal, View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { CircleDollarSign, CircleX, Info, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { useFs } from "@store/fonte.store";
import { useEffect } from "react";

import { useDialogoStore, type DialogoNaTela } from "@store/dialogo.store";
import { pesoDoBotao } from "@lib/pesoDoBotao";
import {
  aparenciaDoBotao,
  aparenciaDoTipo,
  ordemDosBotoes,
  papelDoBotao,
  type TipoDeDialogo,
} from "@lib/tipoDeDialogo";
import { useAnimacaoDoDialogo } from "@hooks/useAnimacaoDoDialogo";
import { useTema } from "@hooks/useTema";
import type { Cores, Tema } from "@theme/tema";

// O diálogo do app — a mesma caixa nas duas plataformas e nos dois apps.
//
// 🔴 "o modal de aviso na versão web tá melhor que o modal do apk" (Andre,
// 08/09). O `Alert` nativo é do sistema operacional: não aceita fonte, cor nem
// raio. Seguir o desenho exigia trocá-lo por um modal nosso.
//
// ⚠️ OS VALORES VÊM DO ARQUIVO DE DESIGN, não de dedução. A primeira versão foi
// montada inferindo dos tokens e chegou perto, mas errou cinco coisas — e a
// última invertia a hierarquia. Lidos nos quatro `MODAL ·` desenhados:
//
//   fundo #16330073 (forest 45%, NÃO preto) .... os quatro
//   respiro lateral 24 ......................... os quatro
//   card raio 20, padding 22, gap 16 ........... três de quatro
//   título Archivo 18/800, ls −0,4 ............. três de três
//   corpo Inter, text-secondary ................ 12 a 14 conforme o modal
//   botões empilhados, largura cheia ........... os quatro
//   borda do vazado: 1,5 ....................... Button/Outline
//
// A HIERARQUIA mora no `pesoDoBotao`, não aqui: o sólido é a saída segura
// quando há ação sem volta na caixa. Ver o porquê lá.
//
// ⚠️ Altura MÍNIMA, não cravada: com a fonte do sistema ampliada, caixa travada
// corta o rótulo (DS4).
//
// Um só na árvore. Ele avisa a store que existe — sem isso, quem chama cai no
// Alert do sistema em vez de ficar mudo.
//
// COM `tipo` (design-modais, 17/10) o cartão ganha a identidade do tipo — faixa
// de 6 px no topo e selo com ícone — e a hierarquia dos botões do desenho novo:
// o primário é sempre brandGreen + forest, e só a ação destrutiva é danger. SEM
// `tipo` é o cartão de antes, número por número (travado em
// caixaIgualNosDoisLados.test.ts, que prende o app à caixa da web).
//
// A entrada e a saída são animadas por dentro, com o `Modal` em
// `animationType="none"`: o diálogo fica montado até a saída acabar (ver
// `useAnimacaoDoDialogo`).
//
// TEMA (DEC-75): o painel é o papel `painel` (branco no claro, a surface no
// escuro), o título é `textPrimary`, o corpo `textSecondary` e o véu o do
// tokens.json por tema. Forest como texto, no escuro, seria forest sobre o painel
// forest (1:1). O único hex deste arquivo é o véu do diálogo sem tipo no claro.

const ICONES: Record<TipoDeDialogo, LucideIcon> = {
  informacao: Info,
  atencao: TriangleAlert,
  dinheiro: CircleDollarSign,
  erro: CircleX,
};

// O véu do desenho novo é o do tema (tokens.json, primitivas.modal). O SEM tipo
// segue com o forest a 45% do desenho antigo no claro, preso à caixa da web por
// caixaIgualNosDoisLados.test.ts; no escuro vale o véu do tema, mais denso.
// tema-fixo: so o claro do dialogo sem tipo (a web e o teste de paridade o travam em forest a 45%)
const VEU_SEM_TIPO_CLARO = "#16330073";

type EstiloDaFaixa = ReturnType<typeof useAnimacaoDoDialogo>["estiloDaFaixa"];

type Cartao = {
  atual: DialogoNaTela;
  responder: (i: number) => void;
  fs: (n: number) => number;
  tema: Tema;
  cores: Cores;
};

export function DialogoVupth() {
  const fs = useFs();
  const { tema, cores, veu } = useTema();
  const atual = useDialogoStore((s) => s.atual);
  const responder = useDialogoStore((s) => s.responder);
  const marcarHost = useDialogoStore((s) => s.marcarHost);

  useEffect(() => {
    marcarHost(true);
    return () => marcarHost(false);
  }, [marcarHost]);

  // `mostrado` continua o último pedido enquanto a saída anima, mesmo com a
  // loja já vazia.
  const { mostrado, estiloDoVeu, estiloDoCartao, estiloDaFaixa } = useAnimacaoDoDialogo(atual);

  if (!mostrado) return null;

  const indiceCancelar = mostrado.botoes.findIndex((b) => b.estilo === "cancel");
  // Durante a saída o cartão ainda esta na tela mostrando os botoes do pedido
  // que acabou de responder. Um 2o toque nele chamaria `responder` e, se houver
  // outro aviso na fila, o responderia por engano.
  const interativo = mostrado === atual;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      // Voltar (Android) equivale ao cancelar; sem ele, o único jeito de sair de
      // um aviso seria acertar o botão.
      onRequestClose={() => responder(indiceCancelar >= 0 ? indiceCancelar : 0)}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* No claro o véu é forest, não preto: preto apaga a marca justo no
            momento em que a tela para. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: mostrado.tipo || tema === "escuro" ? veu : VEU_SEM_TIPO_CLARO },
            estiloDoVeu,
          ]}
        />
        <Animated.View
          testID="dialogo-cartao"
          pointerEvents={interativo ? "auto" : "none"}
          style={[{ width: "100%", maxWidth: 420 }, estiloDoCartao]}
        >
          {mostrado.tipo ? (
            <CartaoComTipo
              atual={mostrado}
              tipo={mostrado.tipo}
              responder={responder}
              fs={fs}
              tema={tema}
              cores={cores}
              estiloDaFaixa={estiloDaFaixa}
            />
          ) : (
            <CartaoSemTipo atual={mostrado} responder={responder} fs={fs} tema={tema} cores={cores} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function CartaoSemTipo({ atual, responder, fs, cores }: Cartao) {
  return (
    <View
      accessibilityViewIsModal
      accessibilityLabel={atual.titulo}
      style={{
        backgroundColor: cores.painel,
        borderRadius: 20,
        padding: 22,
        gap: 16,
        width: "100%",
        maxWidth: 420,
      }}
    >
      <Text
        style={{
          fontFamily: "Archivo_800ExtraBold",
          fontSize: fs(18),
          letterSpacing: -0.4,
          color: cores.textPrimary,
        }}
      >
        {atual.titulo}
      </Text>

      {/* Mensagem longa rola em vez de empurrar os botões para fora — erro
          de backend às vezes vem com parágrafo inteiro. */}
      {!!atual.mensagem && (
        <ScrollView style={{ maxHeight: 260 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: fs(14),
              lineHeight: fs(20),
              color: cores.textSecondary,
            }}
          >
            {atual.mensagem}
          </Text>
        </ScrollView>
      )}

      <View style={{ gap: 12 }}>
        {atual.botoes.map((botao, i) => {
          const peso = pesoDoBotao(atual.botoes, i);
          const vazado = peso !== "solido";
          const perigo = peso === "vazado-perigo";
          return (
            <Pressable
              key={`${botao.texto}-${i}`}
              testID={`dialogo-botao-${i}`}
              accessibilityRole="button"
              onPress={() => responder(i)}
              style={{
                minHeight: 54,
                borderRadius: 9999,
                paddingHorizontal: 24,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: vazado ? 1.5 : 0,
                // A borda é a do texto mesmo no destrutivo; só o RÓTULO é danger.
                borderColor: cores.textPrimary,
                backgroundColor: vazado ? "transparent" : cores.green,
              }}
            >
              <Text
                style={{
                  fontFamily: "Archivo_700Bold",
                  fontSize: fs(16),
                  color: perigo ? cores.danger : vazado ? cores.textPrimary : cores.onGreen,
                }}
              >
                {botao.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Os três papéis do desenho novo (design-modais) vêm de `aparenciaDoBotao`: o
// primário é o mesmo nos dois temas, o secundário é o bloco DENTRO do painel e o
// perigo é danger com onDanger.
function CartaoComTipo({
  atual,
  tipo,
  responder,
  fs,
  tema,
  cores,
  estiloDaFaixa,
}: Cartao & { tipo: TipoDeDialogo; estiloDaFaixa: EstiloDaFaixa }) {
  const aparencia = aparenciaDoTipo(tipo, atual.selo, tema);
  const Icone = ICONES[tipo];

  return (
    <View
      accessibilityViewIsModal
      accessibilityLabel={atual.titulo}
      // Sem borda e sem sombra no nativo: o véu já separa o cartão, e a borda da
      // mesma cor do fundo é o erro que a faixa veio substituir.
      style={{ backgroundColor: cores.painel, borderRadius: 20, padding: 16, width: "100%" }}
    >
      {aparencia.faixa && (
        // A faixa cresce da esquerda (scaleX); o View de fora segura os 6 px de
        // altura para o cartão não pular quando ela aparece.
        <View style={{ height: 6, marginTop: -4, marginBottom: 12 }}>
          <Animated.View
            testID="dialogo-faixa"
            style={[{ height: 6, borderRadius: 999, backgroundColor: aparencia.corDaFaixa ?? aparencia.fundo }, estiloDaFaixa]}
          />
        </View>
      )}

      <View
        testID="dialogo-selo"
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 3,
          paddingHorizontal: 9,
          borderRadius: 999,
          marginBottom: 10,
          backgroundColor: aparencia.fundo,
        }}
      >
        <Icone size={16} color={aparencia.texto} />
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: fs(12), color: aparencia.texto }}>
          {aparencia.selo}
        </Text>
      </View>

      <Text
        style={{
          fontFamily: "Archivo_700Bold",
          fontSize: fs(18),
          letterSpacing: -0.3,
          color: cores.textPrimary,
          marginBottom: 6,
        }}
      >
        {atual.titulo}
      </Text>

      {!!atual.mensagem && (
        <ScrollView style={{ maxHeight: 260 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: fs(14),
              lineHeight: fs(20),
              color: cores.textSecondary,
            }}
          >
            {atual.mensagem}
          </Text>
        </ScrollView>
      )}

      {/* Primário em cima, "Cancelar" embaixo. O índice devolvido é o da lista
          original — o `dialogo-botao-N` da bateria não muda de lugar. */}
      <View style={{ gap: 8, marginTop: 14 }}>
        {ordemDosBotoes(atual.botoes).map((i) => {
          const botao = atual.botoes[i];
          const cor = aparenciaDoBotao(papelDoBotao(atual.botoes, i), tema);
          return (
            <Pressable
              key={`${botao.texto}-${i}`}
              testID={`dialogo-botao-${i}`}
              accessibilityRole="button"
              onPress={() => responder(i)}
              style={{
                minHeight: 54,
                borderRadius: 9999,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: cor.fundo,
              }}
            >
              <Text style={{ fontFamily: "Archivo_700Bold", fontSize: fs(16), color: cor.texto }}>
                {botao.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
