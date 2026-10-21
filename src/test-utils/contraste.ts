import { coresDoTema, type Cores, type Tema } from "@theme/tema";

// Contraste WCAG entre duas cores #RRGGBB. Os testes do modo escuro (DEC-75)
// medem a cor que a tela RESOLVE em cada tema, nao a que o codigo escreve: uma
// classe `text-vupth-textPrimary` e so um nome ate alguem le-la no tema.
export const TEMAS: readonly Tema[] = ["claro", "escuro"];

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

/** Razao de contraste (1 a 21), na ordem que for. */
export function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

type NoComClasse = { props: { className?: string } };

/**
 * O nome do token que a classe `<prefixo>-vupth-<nome>` do no pede (`text`, `bg`
 * ou `border`), sem a opacidade. `undefined` quando o no nao tem essa classe.
 */
export function tokenDaClasse(no: NoComClasse, prefixo: "text" | "bg" | "border"): keyof Cores | undefined {
  const m = new RegExp(`(?:^|\\s)${prefixo}-vupth-([A-Za-z]+)(?:/\\d+)?(?:\\s|$)`).exec(no.props.className ?? "");
  return m ? (m[1] as keyof Cores) : undefined;
}

/** A cor que a classe do no resolve no tema (a mesma tabela que alimenta as variaveis CSS). */
export function corDaClasse(no: NoComClasse, prefixo: "text" | "bg" | "border", tema: Tema): string {
  const token = tokenDaClasse(no, prefixo);
  if (!token) throw new Error(`o no nao tem classe ${prefixo}-vupth-*: "${no.props.className}"`);
  return coresDoTema(tema)[token];
}

/** Contraste do texto (`text-vupth-*` de `texto`) sobre o fundo (`bg-vupth-*` de `fundo`), no tema. */
export function contrasteDasClasses(texto: NoComClasse, fundo: NoComClasse, tema: Tema): number {
  return razao(corDaClasse(texto, "text", tema), corDaClasse(fundo, "bg", tema));
}
