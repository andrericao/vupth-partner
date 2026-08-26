import { Text, type TextProps } from "react-native";

// Titulo COM SEMANTICA. Ate aqui os dois apps nao tinham nenhuma: uma varredura
// por `accessibilityRole="header"` voltava ZERO nos dois, e no navegador a tela
// inteira sai como uma sopa plana de <div> — o "Fila" que parece o h1 e um div
// de 26px sem papel nenhum. Leitor de tela nao consegue pular pro titulo, e a
// pagina nao tem h1.
//
// `accessibilityRole="header"` vira `role="heading"` na web e anuncia
// "cabecalho" no VoiceOver/TalkBack; `aria-level` e o que separa h1 de h2.
//
// Os niveis sao os do arquivo de design (ver `fontSize` no tailwind.config):
// A familia acompanha o peso que o arquivo de design pede em cada nivel:
// "Titulo de Tela" e 800 (`display`), "Titulo de Secao" e 700 (`heading`).
//
//   1 · Titulo de Tela  — um por tela, quem entrega e o ScreenHeader
//   2 · Titulo de Secao — blocos dentro da tela
//   3 · Titulo de item  — cartoes e linhas de lista
type Nivel = 1 | 2 | 3;

const ESTILO: Record<Nivel, string> = {
  1: "font-display text-tela text-vupth-forest",
  2: "font-heading text-secao text-vupth-forest",
  3: "font-heading text-corpo text-vupth-forest",
};

type Props = TextProps & {
  nivel?: Nivel;
  className?: string;
};

export function Titulo({ nivel = 2, className, children, ...rest }: Props) {
  return (
    <Text
      accessibilityRole="header"
      aria-level={nivel}
      className={`${ESTILO[nivel]}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </Text>
  );
}
