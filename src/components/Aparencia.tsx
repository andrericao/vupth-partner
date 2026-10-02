import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { ChevronRight, Moon, Type } from "lucide-react-native";
import type { ComponentType } from "react";
import { NwButton } from "@components/nw/Button";
import { PASSOS_DA_FONTE, rotuloDoPasso } from "@lib/fonte";
import { useFonteStore } from "@store/fonte.store";
import { avisar } from "@lib/confirmar";

// "Aparencia" (Andre, 26/09) — o mesmo submenu do Client (4cb0c205): Tema
// (claro; escuro em breve) e Tamanho da fonte numa janela com DEMONSTRACAO,
// que so vale no "Salvar". Ao salvar o app se redesenha e a pessoa continua
// nesta tela.

// A amostra soma o passo EM ESCOLHA ao tamanho de base, em px fixo: ela mostra
// o tamanho que VAI ficar, nao o de agora.
const AMOSTRA_TITULO = 18;
const AMOSTRA_TEXTO = 14;

function Linha({
  icone: Icone,
  rotulo,
  valor,
  onPress,
  testID,
  last,
}: {
  icone: ComponentType<{ size?: number; color?: string }>;
  rotulo: string;
  valor: string;
  onPress: () => void;
  testID: string;
  last?: boolean;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor}`}
        testID={testID}
        className="flex-row items-center gap-3 px-4 py-4 active:bg-vupth-greenTint"
      >
        <Icone size={20} color="#163300" />
        <View className="flex-1">
          <Text className="font-body text-xs text-vupth-textSecondary">{rotulo}</Text>
          <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{valor}</Text>
        </View>
        <ChevronRight size={18} color="#454745" />
      </Pressable>
      {!last && <View className="h-px bg-vupth-border" />}
    </>
  );
}

export function Aparencia() {
  const passo = useFonteStore((s) => s.passo);
  const escolher = useFonteStore((s) => s.escolher);
  const [janela, setJanela] = useState(false);
  const [rascunho, setRascunho] = useState(passo);

  const abrirFonte = () => {
    setRascunho(passo);
    setJanela(true);
  };
  const salvar = async () => {
    setJanela(false);
    if (rascunho !== passo) await escolher(rascunho);
  };

  return (
    <View>
      <View className="bg-vupth-surface rounded-card overflow-hidden">
        <Linha
          icone={Moon}
          rotulo="Tema"
          valor="Claro"
          testID="aparencia-tema"
          onPress={() =>
            avisar({ titulo: "Tema escuro", mensagem: "O tema escuro chega em breve. Por enquanto o app usa o tema claro." })
          }
        />
        <Linha
          icone={Type}
          rotulo="Tamanho da fonte"
          valor={rotuloDoPasso(passo)}
          testID="aparencia-fonte"
          onPress={abrirFonte}
          last
        />
      </View>

      <Modal visible={janela} transparent animationType="fade" onRequestClose={() => setJanela(false)}>
        <Pressable
          onPress={() => setJanela(false)}
          style={{ flex: 1, backgroundColor: "#16330073", justifyContent: "center", paddingHorizontal: 24 }}
        >
          <Pressable onPress={() => {}} testID="janela-da-fonte" className="bg-white rounded-card p-[22px] gap-4">
            <Text className="font-heading text-lg text-vupth-forest">Tamanho da fonte</Text>
            {/* A demonstracao: o tamanho que vai ficar, antes de salvar. */}
            <View className="bg-vupth-surface rounded-xl p-3.5" testID="amostra-da-fonte">
              <Text
                className="font-heading text-vupth-forest"
                style={{ fontSize: AMOSTRA_TITULO + rascunho }}
                testID="amostra-titulo"
              >
                Barbearia do Carlos
              </Text>
              <Text
                className="font-body text-vupth-textSecondary mt-1"
                style={{ fontSize: AMOSTRA_TEXTO + rascunho }}
              >
                Ana é a próxima da sua fila — por volta de 14:30.
              </Text>
            </View>
            <View className="flex-row gap-2">
              {PASSOS_DA_FONTE.map((p) => {
                const ativo = rascunho === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setRascunho(p)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={`Tamanho ${rotuloDoPasso(p)}`}
                    testID={`fonte-${p}`}
                    className={`flex-1 py-2 rounded-full items-center ${ativo ? "bg-vupth-forest" : "bg-vupth-surface"}`}
                  >
                    <Text style={{ fontSize: 13 }} className={`font-heading ${ativo ? "text-vupth-green" : "text-vupth-forest"}`}>
                      {rotuloDoPasso(p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <NwButton title="Salvar" onPress={salvar} testID="salvar-fonte" />
            <NwButton title="Cancelar" variant="vupthOutline" onPress={() => setJanela(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
