import { seloDoStatus } from "@lib/statusAtendimento";
import { coresDoTema } from "@theme/tema";

// Contrato novo do backend (decisão do Andre, 18/09): REMOVED = a LOJA tirou o
// cliente da fila; CANCELLED = o CLIENTE desistiu. O backend segurou o deploy
// até os fronts aceitarem o valor: "se houver switch/if por status sem ramo
// padrão, ele cai em texto cru na tela".
describe("seloDoStatus", () => {
  it("REMOVED tem rótulo próprio — a loja retirou", () => {
    expect(seloDoStatus("REMOVED").label).toBe("Retirado");
  });

  it("CANCELLED continua 'Cancelado' — linhas antigas não dizem quem saiu", () => {
    // O backend não reconstrói o passado: o que era CANCELLED antes de 18/09
    // pode ter sido a loja ou o cliente. Chamar de "desistiu" mentiria.
    expect(seloDoStatus("CANCELLED").label).toBe("Cancelado");
  });

  it("retirado e cancelado não usam a mesma cor", () => {
    expect(seloDoStatus("REMOVED").selo).not.toBe(seloDoStatus("CANCELLED").selo);
  });

  it.each(["FINISHED", "IN_PROGRESS", "PAUSED", "SCHEDULED", "LATE"])("%s tem rótulo em português", (st) => {
    expect(seloDoStatus(st).label).not.toBe(st);
  });

  it("status desconhecido NUNCA aparece cru na tela", () => {
    const s = seloDoStatus("ALGO_NOVO");
    expect(s.label).not.toContain("ALGO_NOVO");
    expect(s.label.length).toBeGreaterThan(0);
  });
});

// O texto de cada selo e o par do fundo dele: forest sobre o greenTint ou o
// pessego so valia no claro (no escuro o forest e a surface, e o greenTint vira
// #223D0D). Mede o par que o codigo escolheu, nos dois temas.
function luminancia(hex: string): number {
  const canal = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("contraste do selo nos dois temas", () => {
  const STATUS = ["FINISHED", "CANCELLED", "REMOVED", "IN_PROGRESS", "PAUSED", "SCHEDULED", "LATE", "ALGO_NOVO"];
  const chave = (classe: string) => classe.replace(/^(bg|text)-vupth-/, "");

  it.each(STATUS.flatMap((st) => (["claro", "escuro"] as const).map((tema) => [st, tema] as const)))(
    "%s passa em 4,5:1 no tema %s",
    (st, tema) => {
      const cores = coresDoTema(tema) as Record<string, string>;
      const { selo, texto } = seloDoStatus(st);
      expect(razao(cores[chave(selo)], cores[chave(texto)])).toBeGreaterThanOrEqual(4.5);
    },
  );
});
