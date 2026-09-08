import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useEffect } from "react";

import { useDialogoStore } from "@store/dialogo.store";

// O diálogo do app, no APK — o mesmo desenho da web.
//
// 🔴 "o modal de aviso na versão web tá melhor que o modal do apk, quero que
// também acompanhe o design do app" (08/09). O `Alert` nativo é do sistema
// operacional: não aceita fonte, cor nem raio. Seguir o desenho exigia trocá-lo
// por um modal nosso.
//
// CADA NÚMERO AQUI É O MESMO do `web-shims/alert.js`, para as duas plataformas
// mostrarem a mesma caixa:
//
//   fundo rgba(0,0,0,.45) e respiro 24 ......... backdrop do shim
//   card branco, raio 20, padding 24 ........... `.vupth-alert-box`
//   título Archivo 18, margem 12 ............... `.vupth-alert-title`
//   corpo Inter 16, entrelinha 1.45 ............ `.vupth-alert-msg`
//   botões EMPILHADOS, gap 12, topo 24 ......... `.vupth-alert-actions`
//   pílula, altura MÍNIMA 54 ................... `.vupth-alert-btn`
//   sólido #9FE870 com texto #163300 ........... idem (brandGreen é claro
//                                                demais para texto branco)
//   cancel e destructive VAZADOS, borda 2 ...... `[data-style=...]`
//
// ⚠️ Altura mínima, não cravada: com a fonte do sistema ampliada, caixa travada
// corta o rótulo (DS4).
//
// Um só na árvore, montado no `_layout`. Ele avisa a store que existe — sem
// isso, quem chama cai no Alert do sistema em vez de ficar mudo.
export function DialogoVupth() {
  const atual = useDialogoStore((s) => s.atual);
  const responder = useDialogoStore((s) => s.responder);
  const marcarHost = useDialogoStore((s) => s.marcarHost);

  useEffect(() => {
    marcarHost(true);
    return () => marcarHost(false);
  }, [marcarHost]);

  if (!atual) return null;

  const indiceCancelar = atual.botoes.findIndex((b) => b.estilo === "cancel");

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Voltar (Android) equivale ao botão de cancelar; sem ele, o único jeito
      // de sair de um aviso seria acertar o botão.
      onRequestClose={() => responder(indiceCancelar >= 0 ? indiceCancelar : 0)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,.45)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          accessibilityLabel={atual.titulo}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 420,
          }}
        >
          <Text className="font-heading text-[18px] text-vupth-forest mb-3">{atual.titulo}</Text>

          {/* Mensagem longa rola em vez de empurrar os botões para fora — erro
              de backend as vezes vem com parágrafo inteiro. */}
          {!!atual.mensagem && (
            <ScrollView style={{ maxHeight: 260 }}>
              <Text className="font-body text-[16px] leading-6 text-vupth-textSecondary">
                {atual.mensagem}
              </Text>
            </ScrollView>
          )}

          <View style={{ marginTop: 24, gap: 12 }}>
            {atual.botoes.map((botao, i) => {
              const cancel = botao.estilo === "cancel";
              const destrutivo = botao.estilo === "destructive";
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
                    borderWidth: cancel || destrutivo ? 2 : 0,
                    borderColor: destrutivo ? "#B3261E" : "#163300",
                    backgroundColor: cancel || destrutivo ? "transparent" : "#9FE870",
                  }}
                >
                  <Text
                    className="font-heading text-[16px]"
                    style={{ color: destrutivo ? "#B3261E" : "#163300" }}
                  >
                    {botao.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
