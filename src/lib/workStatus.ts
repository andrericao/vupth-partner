// Status de trabalho do profissional. Ficava espalhado dentro da tela de
// "Opcoes da fila"; virou modulo quando a PILULA do cabecalho passou a mostrar
// e trocar o mesmo estado (DS3) — duas telas mexendo no mesmo semaforo com
// duas copias das regras e como o app ganha dois verdes diferentes.
export type StatusKey = "trabalhando" | "intervalo" | "indisponivel";
export type WorkStatus = "WORKING" | "ON_BREAK" | "OFF";

export const WORK_TO_KEY: Record<WorkStatus, StatusKey> = {
  WORKING: "trabalhando",
  ON_BREAK: "intervalo",
  OFF: "indisponivel",
};

export const KEY_TO_WORK: Record<StatusKey, WorkStatus> = {
  trabalhando: "WORKING",
  intervalo: "ON_BREAK",
  indisponivel: "OFF",
};

// Semaforo (Andre 2026-07-23): verde trabalhando, ambar intervalo, vermelho
// fora. As tres combinacoes de fundo+texto passam no minimo AA — ver o teste.
//
// `cor` alimenta o PONTO das listas, onde antes havia 🟢🟡🔴. Emoji nao e
// elemento de interface: ele nao herda a paleta, muda de desenho em cada
// sistema e nao escala com o texto. Aqui o proprio semaforo ja E a cor — nao
// precisa nem de icone, so do ponto.
export const STATUS_META: Record<
  StatusKey,
  { label: string; bg: string; texto: string; cor: string }
> = {
  trabalhando: {
    label: "Trabalhando",
    bg: "bg-vupth-green",
    texto: "text-vupth-forest",
    cor: "#9FE870",
  },
  intervalo: {
    label: "Intervalo",
    bg: "bg-vupth-warning",
    texto: "text-vupth-forest",
    cor: "#FFC091",
  },
  indisponivel: {
    label: "Fora",
    bg: "bg-vupth-danger",
    texto: "text-white",
    cor: "#B3261E",
  },
};

export const STATUS_ORDEM: StatusKey[] = ["trabalhando", "intervalo", "indisponivel"];

/**
 * A loja e DERIVADA do status de quem trabalha nela (decisao do Andre em
 * 2026-07-24): o primeiro a comecar acende, o ultimo a sair apaga. Ninguem
 * abre nem fecha na mao — entao o app so pode AVISAR, comparando o
 * `open_status` antes e depois. Adivinhar quem e o ultimo daria errado.
 */
export function avisoDeLoja(
  next: StatusKey,
  abertaAntes: boolean,
  abertaDepois: boolean
): { titulo: string; texto: string } | null {
  if (!abertaAntes && abertaDepois && next === "trabalhando") {
    return {
      titulo: "Loja aberta",
      texto:
        "Você foi o primeiro a começar — a loja agora aparece para os clientes e recebe a fila.",
    };
  }
  if (abertaAntes && !abertaDepois) {
    return {
      titulo: "Loja fechada",
      texto: "Você era o último em atividade — a loja foi fechada para os clientes.",
    };
  }
  return null;
}
