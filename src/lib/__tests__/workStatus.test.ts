import {
  WORK_TO_KEY,
  KEY_TO_WORK,
  STATUS_META,
  STATUS_ORDEM,
  avisoDeLoja,
  type StatusKey,
} from "../workStatus";
import { coresDoTema } from "@theme/tema";

// As classes `vupth-*` do tailwind leem variaveis (modo escuro, DEC-75); o hex
// de cada uma NO TEMA CLARO, que e o que estas cores fixas do codigo repetem,
// vem de src/theme/tokens.json por tema.ts. O escuro tem teste proprio.
const vupth: Record<string, string> = coresDoTema("claro");

describe("mapa de status", () => {
  it.each(STATUS_ORDEM)("%s vai e volta sem perder o valor", (key) => {
    expect(WORK_TO_KEY[KEY_TO_WORK[key]]).toBe(key);
  });

  it("cobre os tres estados e nada alem", () => {
    expect(STATUS_ORDEM).toHaveLength(3);
    expect(Object.keys(STATUS_META).sort()).toEqual([...STATUS_ORDEM].sort());
  });
});

describe("aviso de loja — ela e DERIVADA, o app so compara antes/depois", () => {
  it("avisa que ABRIU so quando eu fui o primeiro a comecar", () => {
    expect(avisoDeLoja("trabalhando", false, true)?.titulo).toBe("Loja aberta");
  });

  it("nao avisa que abriu se a loja ja estava aberta", () => {
    expect(avisoDeLoja("trabalhando", true, true)).toBeNull();
  });

  it("nao credita a abertura a quem entrou em intervalo", () => {
    // Se a loja abriu enquanto eu ia pro intervalo, quem abriu foi outro.
    expect(avisoDeLoja("intervalo", false, true)).toBeNull();
  });

  it("avisa que FECHOU seja qual for o status escolhido", () => {
    // Fechar pode vir de "Fora" e tambem de "Intervalo" — se eu era o ultimo
    // em atividade, a loja apaga nos dois casos.
    for (const key of ["intervalo", "indisponivel"] as StatusKey[]) {
      expect(avisoDeLoja(key, true, false)?.titulo).toBe("Loja fechada");
    }
  });

  it("fica calado quando nada mudou", () => {
    expect(avisoDeLoja("indisponivel", false, false)).toBeNull();
  });
});

// A pilula fica no cabecalho, em texto pequeno, sobre cor cheia — o pior caso
// pra contraste. Este teste mede em vez de confiar no comentario.
function luminancia(hex: string): number {
  const c = hex.replace("#", "");
  const canal = (i: number) => {
    const v = parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("contraste da pilula", () => {
  const hexDe = (classe: string) => {
    const chave = classe.replace(/^(bg|text)-(vupth-)?/, "");
    return chave === "white" ? "#FFFFFF" : vupth[chave];
  };

  it.each(STATUS_ORDEM)("%s passa no minimo AA (4.5:1)", (key) => {
    const { bg, texto } = STATUS_META[key];
    const fundo = hexDe(bg);
    const frente = hexDe(texto);
    expect(fundo).toBeTruthy();
    expect(frente).toBeTruthy();
    expect(razao(fundo, frente)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(STATUS_ORDEM)("%s passa no minimo AA tambem no tema ESCURO", (key) => {
    // O texto e o par `on*` do fundo; um forest ou white fixo sobre o fundo do
    // escuro daria 1:1 ou quase.
    const { bg, texto } = STATUS_META[key];
    const escuro = coresDoTema("escuro") as Record<string, string>;
    const chave = (classe: string) => classe.replace(/^(bg|text)-vupth-/, "");
    expect(razao(escuro[chave(bg)], escuro[chave(texto)])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("o ponto de cada status", () => {
  it("no CLARO sao os tres hex do semaforo de antes", () => {
    const claro = coresDoTema("claro");
    expect(STATUS_ORDEM.map((k) => claro[STATUS_META[k].cor])).toEqual(["#9FE870", "#FFC091", "#B3261E"]);
  });

  it("no ESCURO o ponto segue visivel sobre a surface (3:1 de componente grafico)", () => {
    // O `warning` no escuro e o FUNDO marrom do bloco; como ponto ele sumiria.
    const escuro = coresDoTema("escuro");
    for (const key of STATUS_ORDEM) {
      expect(razao(escuro[STATUS_META[key].cor], escuro.surface)).toBeGreaterThanOrEqual(3);
    }
  });
});
