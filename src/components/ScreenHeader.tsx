import { useEffect } from "react";
import { Titulo } from "@components/Titulo";
import { BackHandler, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";

type Props = {
  /** Titulo da tela. Sai em Archivo display, 26. */
  title: string;
  /** Linha de apoio, opcional. */
  subtitle?: string;
  /**
   * Mostra o botao voltar e define o destino. Ausente = tela RAIZ de aba
   * (Fila, Início, Menu...), que nao tem para onde voltar.
   */
  onBack?: () => void;
  /** Acao no canto direito, alinhada ao titulo (ex.: badge, "Agora não"). */
  action?: ReactNode;
};

/**
 * Cabecalho unico das telas do partner.
 *
 * [marca-vupth] Nasceu de duas queixas reais (QA Alexia 2026-08-21):
 *
 * 1. **A linha "VUPTH + icone" saiu.** Ela aparecia em TODA tela e nao
 *    informava nada — quem esta dentro do app ja sabe em que app esta. Era
 *    cromo ocupando os 42px mais valiosos da tela, empurrando o titulo (a
 *    unica coisa que diz ONDE voce esta) para baixo da dobra em telas curtas.
 *
 * 2. **Cada tela inventava o proprio espacamento.** Medido antes de escrever
 *    este componente: container em `py-12 px-6` (23 telas), `pt-14 pb-8 px-7`
 *    (3), `py-6 px-6` (1), `py-3 px-4` (2); titulo com `mt-8` (15) ou `mt-6`
 *    (21); e o titulo ora `text-2xl` cinza, ora `fontSize 26` forest, ora
 *    `text-3xl`. Cinco decisoes repetidas em cada tela nova, cada uma uma
 *    chance de divergir — e divergiram.
 *
 * Agora o cabecalho manda no espacamento VERTICAL (inclusive no `safe-area`) e
 * a tela so diz o QUE mostrar. Titulo 26/display sai do Pencil (frames `Head`).
 *
 * ⚠️ O cabecalho NAO tem padding horizontal proprio, de proposito: ele fica
 * DENTRO do container da tela, que ja aplica os **16px** padrao. Ter os dois
 * dava 32px e o titulo recuava mais que os cards abaixo (QA Alexia). Uma fonte
 * so de padding lateral por tela — o container.
 *
 * ⚠️ A tela NAO deve mais colocar `pt` no container: o cabecalho ja resolve o
 * topo. Padding lateral segue com a tela, porque o conteudo abaixo varia
 * (lista full-bleed x formulario).
 */
export function ScreenHeader({ title, subtitle, onBack, action }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!onBack) return;
    // O voltar do Android segue o MESMO destino do botao — sem isso os dois
    // divergem e o fisico pode deslogar caindo em /(auth).
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <View style={{ paddingTop: insets.top + 12 }} className="pb-4">
      {/* LINHA UNICA: voltar · titulo · acao. O titulo fica sempre na MESMA
          altura, tenha a tela botão ou não — antes os botões ocupavam uma
          linha própria ACIMA e empurravam o titulo pra baixo, entao cada tela
          comecava numa altura diferente (QA Alexia, com a referencia do Pix).
          `min-h` de 44 mantem a altura da linha estavel mesmo sem botao. */}
      {/* `items-start`, nao `items-center`: centrado, um titulo de DUAS linhas
          (60px) estourava os 44 da linha e comecava no topo, enquanto um de uma
          linha (30px) ficava centrado 7px abaixo — medido no navegador: 12px
          contra 19px. Ancorado no topo, a 1a linha do titulo comeca sempre na
          mesma altura, quebre ele ou nao. */}
      <View className="flex-row items-start gap-3 min-h-[44px]">
        {onBack ? (
          <Pressable
            onPress={onBack}
            testID="back-button"
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-vupth-greenTint items-center justify-center active:bg-vupth-surface"
          >
            <ChevronLeft size={20} color="#163300" />
          </Pressable>
        ) : null}

        {/* So o TITULO divide a linha com os botoes. */}
        {/* O `mt-[4px]` centra a 1a linha do titulo no botao redondo (40):
            (40 − 32) / 2, sendo 32 a entrelinha de `text-xxl`. */}
        {/* h1 da tela: e o UNICO titulo de nivel 1 que o app emite, e todas
            as telas passam por aqui — por isso a semantica mora no
            ScreenHeader e nao em cada tela. */}
        <Titulo nivel={1} numberOfLines={2} className="flex-1 mt-[4px]">
          {title}
        </Titulo>

        {/* A acao ocupa uma faixa de 40 e se centra nela — a mesma altura do
            botao redondo do voltar. Sem isso, com a linha ancorada no topo
            (`items-start`), um link ou pilula de texto fica colado no topo
            enquanto o titulo desce os 5 do respiro optico. Botao de 40 ja
            preenche a faixa e nao muda. */}
        {action ? (
          <View className="min-h-[40px] justify-center">{action}</View>
        ) : null}
      </View>

      {/* Subtitulo FORA da linha do titulo. Dentro dela, a coluna
          titulo+subtitulo ficava centrada no eixo e empurrava o titulo ~7px
          pra baixo so nas telas COM subtitulo — medido no navegador: 12px sem,
          19px com. O titulo tem de comecar na MESMA altura em toda tela. O
          recuo alinha o subtitulo com o titulo, saltando o botao voltar (40 de
          botao + 12 de gap). */}
      {subtitle ? (
        <Text
          numberOfLines={2}
          className={`font-body text-f13 text-vupth-textSecondary mt-1 ${onBack ? "ml-[52px]" : ""}`}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Voltar padrao: usa o historico quando ha, senao nao faz nada (nunca desloga). */
export function defaultBack() {
  if (router.canGoBack()) router.back();
}
