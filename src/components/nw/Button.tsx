import { Pressable, Text, View, ActivityIndicator, type PressableProps } from "react-native";
import type { ReactNode } from "react";
import { useTema } from "@hooks/useTema";
import type { Cores } from "@theme/tema";

// Primitiva NativeWind (migracao Gluestack v2). API LIMPA por VARIANTE — sem
// props de token do gluestack. Mesmo visual do Button v1 (pilula + sombra +
// Poppins), so que via `className`. Usada nas telas JA convertidas; o Button v1
// (src/components/Button.tsx) segue para as telas ainda no v1.
// [marca-vupth] O VERMELHO ($brandDanger) e so pra acao que EXCLUI ou DESFAZ
// algo — desafiliar, apagar, encerrar vinculo. Ele nao e "o botao do nao": a
// metade negativa de uma escolha binaria (Cancelar/Adicionar, Nao/Sim,
// Recusar/Aceitar) vai de `secondary`, senao o app inteiro fica pedindo
// confirmacao de perigo pra coisa rotineira. Encerrar expediente TAMBEM nao
// conta: fechar a fila e rotina do dia e da pra reabrir — o "Fechar agora" do
// ClosingPrompt e a acao afirmativa do modal, entao vai de primary.
type Variant =
  | "primary"
  | "secondary"
  // `secondary` DENTRO de painel de modal: no escuro o painel e a surface, e um
  // secondary (surface) sumiria. Usa o papel `sobrePainel` (surface no claro,
  // surfaceAlt no escuro: design-modais.html, .btn.sec).
  | "secondaryPainel"
  | "danger"
  | "outlineBrand"
  | "outlineDanger"
  // [marca-vupth] Pencil (Button/Primary, /Secondary, /Outline). Tokens em
  // tailwind.config.js sob `vupth.*` — precisam bater com os `brand*` do
  // gluestack config (client e partner).
  | "vupthPrimary"
  | "vupthSecondary"
  | "vupthOutline"
  // Button/Ghost do desenho: sem fundo, texto forest, raio 8 e caixa BAIXA
  // (10/12) — nao e uma pilula. E o peso mais leve da familia, pra acao que
  // acompanha uma lista sem competir com o botao principal da tela.
  | "vupthGhost";

type Props = Omit<PressableProps, "children"> & {
  title: string;
  isLoading?: boolean;
  variant?: Variant;
  /** Classes extras (ex.: "mt-0 h-10") — sobrescrevem as do variant. */
  className?: string;
  /**
   * Icone a direita do rotulo. Os quatro botoes do desenho tem um slot de
   * icone (18px; 16 no ghost) — nao e enfeite, e parte da primitiva.
   */
  icon?: ReactNode;
  /**
   * Classes do TEXTO — sobrescrevem a cor do variant. Para botao claro sobre
   * fundo colorido (ex.: "Finalizar" no card verde da fila), onde nenhuma
   * variante serve porque elas assumem fundo neutro.
   */
  textClassName?: string;
};

// `min-h`, e nao `h`: com a fonte do sistema ampliada (o app honra o ajuste
// do aparelho — nunca desligamos allowFontScaling), altura cravada CORTA o
// rotulo dentro do botao. Com altura minima o desenho fica identico no
// tamanho padrao e cresce em vez de truncar. Ver DS4 no HANDOFF_DESIGN.
// `active:scale-[0.97]`: o toque encolhe o botao um pouco, alem de perder opacidade.
// Escala estatica no pressionado, sem `transition-*`: as transicoes do NativeWind
// dependem do Reanimated, que o app nao importa em lugar nenhum.
const BASE = "min-h-[54px] rounded-full items-center justify-center px-4 active:scale-[0.97]";
// O ghost e o unico que NAO e pilula alta: raio 8, caixa de 10/12 (do desenho).
const BASE_GHOST = "py-2.5 px-3 rounded-md items-center justify-center active:scale-[0.97]";

// [marca-vupth] `primary` E o Button/Primary do Pencil: fundo brand-green com
// texto forest. Na primeira passada ele ficou forest+branco — troca conservadora
// pra nao mexer nas ~40 chamadas de uma vez —, mas isso deixou o app com DOIS
// primarios diferentes: o do desenho e o legado. Como a estrutura nao muda (mesma
// pilula, mesma altura), alinhar e seguro; e as chamadas sobre fundo colorido ja
// sobrescrevem o bg por `className`, entao nao dependem deste valor.
// 🔴 PRESSIONADO VISIVEL (Andre, 24/09: "o botao pausar e finalizar nao
// mostram que foram clicados"). Existia, mas nao se via: forest -> forestSoft
// e quase a mesma cor, e green -> success e a MESMA (#9FE870). Agora todo
// variant perde opacidade ao toque — perceptivel sobre qualquer fundo — e os
// vazados ainda ganham um tom de fundo. Travado em toqueVisivel.test.ts.
const BOX: Record<Variant, string> = {
  primary: "bg-vupth-green active:opacity-70",
  secondary: "bg-vupth-surface active:bg-vupth-border active:opacity-80",
  secondaryPainel: "bg-vupth-sobrePainel active:bg-vupth-border active:opacity-80",
  danger: "bg-vupth-danger active:opacity-70",
  outlineBrand: "bg-vupth-background border border-vupth-textPrimary active:bg-vupth-greenTint active:opacity-80",
  outlineDanger: "bg-transparent border border-vupth-danger active:bg-vupth-dangerTint active:opacity-80",
  // `vupthPrimary` ficou IDENTICO ao primary depois do alinhamento acima —
  // mantido como apelido pra nao quebrar quem ja chamava por ele.
  vupthPrimary: "bg-vupth-green active:opacity-70",
  // [marca-vupth] CORRIGIDO 2026-08-26. Estava `greenTint` com texto forest,
  // que nao e o Button/Secondary do desenho — la ele e o INVERSO do primary:
  // fundo `$forest`, rotulo e icone `$brand-green`. E a ancora escura do
  // sistema, o unico botao que segura peso sobre um fundo ja colorido.
  // Zero chamadas fora do proprio teste, entao a correcao nao tem raio.
  vupthSecondary: "bg-vupth-forest active:opacity-70",
  vupthOutline: "bg-transparent border-2 border-vupth-textPrimary active:bg-vupth-greenTint active:opacity-80",
  vupthGhost: "bg-transparent active:bg-vupth-surface active:opacity-80",
};

// Texto e borda usam os tokens que TROCAM de tema (textPrimary, onGreen,
// onDanger, background), nunca forest/white: no escuro o forest e a surface, e
// um rotulo forest sobre ela daria 1:1 (invisivel). No claro cada um vale o
// mesmo hex de antes. O botao primario nao muda de tema (onGreen sobre green).
const LABEL: Record<Variant, string> = {
  primary: "text-vupth-onGreen",
  secondary: "text-vupth-textPrimary",
  secondaryPainel: "text-vupth-textPrimary",
  danger: "text-vupth-onDanger",
  outlineBrand: "text-vupth-textPrimary",
  outlineDanger: "text-vupth-danger",
  vupthPrimary: "text-vupth-onGreen",
  vupthSecondary: "text-vupth-green",
  vupthOutline: "text-vupth-textPrimary",
  vupthGhost: "text-vupth-textPrimary",
};

// A cor do spinner e a do rotulo da variante: o spinner e uma prop, nao uma
// classe, entao vem do tema.
function corDoSpinner(variant: Variant, cores: Cores): string {
  if (variant === "danger") return cores.onDanger;
  if (variant === "outlineDanger") return cores.danger;
  if (variant === "vupthSecondary") return cores.green;
  if (variant === "primary" || variant === "vupthPrimary") return cores.onGreen;
  return cores.textPrimary;
}

export function NwButton({
  title,
  isLoading,
  variant = "primary",
  className,
  icon,
  textClassName,
  disabled,
  ...rest
}: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isLoading || disabled}
      className={`${variant === "vupthGhost" ? BASE_GHOST : BASE} ${BOX[variant]} ${className ?? ""}`}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={corDoSpinner(variant, cores)} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={`font-heading text-base ${textClassName ?? LABEL[variant]}`}>
            {title}
          </Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}
