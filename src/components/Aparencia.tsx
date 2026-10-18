import { useState, type ComponentType, type ReactNode } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { ChevronRight, Moon, Type } from "lucide-react-native";
import { NwButton } from "@components/nw/Button";
import { PASSOS_DA_FONTE, rotuloDoPasso } from "@lib/fonte";
import { useFonteStore } from "@store/fonte.store";
import { useTemaStore } from "@store/tema.store";
import { useTema } from "@hooks/useTema";
import { PREFERENCIAS, ROTULO_DA_PREFERENCIA, type Preferencia } from "@theme/tema";
import { ESCURO_LIBERADO } from "@theme/liberacao";
import { avisar } from "@lib/confirmar";

// "Aparencia" (Andre, 26/09) — o mesmo submenu do Client (4cb0c205): Tema
// (claro, escuro, automatico) e Tamanho da fonte, cada um numa janela que so
// vale no "Salvar". Ao salvar o app se redesenha e a pessoa continua nesta
// tela. O PADRAO do tema e claro (DEC-75): nada muda para quem nao mexer.

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
  // Icone nao le classe: a cor vem do tema, nao de um hex (forest sobre forest no escuro).
  const { cores } = useTema();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor}`}
        testID={testID}
        className="flex-row items-center gap-3 px-4 py-4 active:bg-vupth-greenTint"
      >
        <Icone size={20} color={cores.textPrimary} />
        <View className="flex-1">
          <Text className="font-body text-xs text-vupth-textSecondary">{rotulo}</Text>
          <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{valor}</Text>
        </View>
        <ChevronRight size={18} color={cores.textSecondary} />
      </Pressable>
      {!last && <View className="h-px bg-vupth-border" />}
    </>
  );
}

function Janela({
  visivel,
  aoFechar,
  testID,
  children,
}: {
  visivel: boolean;
  aoFechar: () => void;
  testID: string;
  children: ReactNode;
}) {
  const { veu } = useTema();
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable
        onPress={aoFechar}
        style={{ flex: 1, backgroundColor: veu, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <Pressable onPress={() => {}} testID={testID} className="bg-vupth-painel rounded-card p-[22px] gap-4">
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** A opcao de uma fileira de pilulas: marcada, ganha o fundo de "selecionado". */
function Pilula({
  ativo,
  rotulo,
  etiqueta,
  onPress,
  testID,
}: {
  ativo: boolean;
  rotulo: string;
  etiqueta: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={etiqueta}
      testID={testID}
      className={`flex-1 py-2 rounded-full items-center ${ativo ? "bg-vupth-selecionado" : "bg-vupth-sobrePainel"}`}
    >
      <Text
        style={{ fontSize: 13 }}
        className={`font-heading ${ativo ? "text-vupth-onSelecionado" : "text-vupth-textPrimary"}`}
      >
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function Aparencia() {
  const passo = useFonteStore((s) => s.passo);
  const escolher = useFonteStore((s) => s.escolher);
  const { preferencia } = useTema();
  const escolherTema = useTemaStore((s) => s.escolher);
  const [janela, setJanela] = useState<"tema" | "fonte" | null>(null);
  const [rascunho, setRascunho] = useState(passo);
  const [rascunhoDoTema, setRascunhoDoTema] = useState<Preferencia>(preferencia);

  const abrirFonte = () => {
    setRascunho(passo);
    setJanela("fonte");
  };
  const abrirTema = () => {
    if (!ESCURO_LIBERADO) {
      avisar({ titulo: "Tema escuro", mensagem: "O tema escuro chega em breve. Por enquanto o app usa o tema claro." });
      return;
    }
    setRascunhoDoTema(preferencia);
    setJanela("tema");
  };
  const fechar = () => setJanela(null);
  const salvarFonte = async () => {
    fechar();
    if (rascunho !== passo) await escolher(rascunho);
  };
  const salvarTema = async () => {
    fechar();
    if (rascunhoDoTema !== preferencia) await escolherTema(rascunhoDoTema);
  };

  return (
    <View>
      <View className="bg-vupth-surface rounded-card overflow-hidden">
        <Linha
          icone={Moon}
          rotulo="Tema"
          valor={ROTULO_DA_PREFERENCIA[preferencia]}
          testID="aparencia-tema"
          onPress={abrirTema}
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

      <Janela visivel={janela === "tema"} aoFechar={fechar} testID="janela-do-tema">
        <Text className="font-heading text-lg text-vupth-textPrimary">Tema</Text>
        <View className="flex-row gap-2">
          {PREFERENCIAS.map((p) => (
            <Pilula
              key={p}
              ativo={rascunhoDoTema === p}
              rotulo={ROTULO_DA_PREFERENCIA[p]}
              etiqueta={`Tema ${ROTULO_DA_PREFERENCIA[p]}`}
              onPress={() => setRascunhoDoTema(p)}
              testID={`tema-${p}`}
            />
          ))}
        </View>
        <Text className="font-body text-xs text-vupth-textSecondary">Automático segue o tema do aparelho.</Text>
        <NwButton title="Salvar" onPress={salvarTema} testID="salvar-tema" />
        <NwButton title="Cancelar" variant="vupthOutline" onPress={fechar} />
      </Janela>

      <Janela visivel={janela === "fonte"} aoFechar={fechar} testID="janela-da-fonte">
        <Text className="font-heading text-lg text-vupth-textPrimary">Tamanho da fonte</Text>
        {/* A demonstracao: o tamanho que vai ficar, antes de salvar. */}
        <View className="bg-vupth-sobrePainel rounded-xl p-3.5" testID="amostra-da-fonte">
          <Text
            className="font-heading text-vupth-textPrimary"
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
          {PASSOS_DA_FONTE.map((p) => (
            <Pilula
              key={p}
              ativo={rascunho === p}
              rotulo={rotuloDoPasso(p)}
              etiqueta={`Tamanho ${rotuloDoPasso(p)}`}
              onPress={() => setRascunho(p)}
              testID={`fonte-${p}`}
            />
          ))}
        </View>
        <NwButton title="Salvar" onPress={salvarFonte} testID="salvar-fonte" />
        <NwButton title="Cancelar" variant="vupthOutline" onPress={fechar} />
      </Janela>
    </View>
  );
}
