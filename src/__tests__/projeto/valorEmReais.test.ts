import fs from "fs";
import path from "path";
import { formatarReais } from "../../lib/dinheiro";

// valor-em-reais-padronizado (Andre, 22/10): "R$ 53,90" em toda tela, dica,
// aviso e botao — simbolo, espaco, virgula nos centavos, ponto no milhar, duas
// casas. Nada de "R$ 53.90" nem "R$53.90".
const RAIZ = path.resolve(__dirname, "../../..");

function arquivos(dir: string, saida: string[] = []): string[] {
  for (const nome of fs.readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) arquivos(p, saida);
    else if (/\.(ts|tsx)$/.test(nome)) saida.push(p);
  }
  return saida;
}

describe("formatarReais", () => {
  it("simbolo, espaco, virgula, ponto no milhar e duas casas", () => {
    expect(formatarReais(53.9)).toBe("R$ 53,90");
    expect(formatarReais(27.9)).toBe("R$ 27,90");
    expect(formatarReais(1234.56)).toBe("R$ 1.234,56");
    expect(formatarReais(1234567.8)).toBe("R$ 1.234.567,80");
    expect(formatarReais(0)).toBe("R$ 0,00");
    expect(formatarReais(0.1 + 0.2)).toBe("R$ 0,30");
  });

  it("sem valor ou invalido cai em zero; negativo leva o sinal na frente", () => {
    expect(formatarReais(null)).toBe("R$ 0,00");
    expect(formatarReais(undefined)).toBe("R$ 0,00");
    expect(formatarReais(NaN)).toBe("R$ 0,00");
    expect(formatarReais("12.5")).toBe("R$ 12,50");
    expect(formatarReais(-5)).toBe("-R$ 5,00");
  });
});

describe("o codigo das telas nao monta valor em reais com ponto decimal", () => {
  const codigo = [...arquivos(path.join(RAIZ, "app")), ...arquivos(path.join(RAIZ, "src"))].filter(
    (p) => !p.endsWith(path.join("lib", "dinheiro.ts"))
  );

  it("nenhum 'R$ 12.34' escrito no texto", () => {
    const achados = codigo.filter((p) => /R\$ ?\d+\.\d{2}\b/.test(fs.readFileSync(p, "utf8")));
    expect(achados).toEqual([]);
  });

  it("nenhum 'R$ ${x.toFixed(2)}' nem 'R$ {x.toFixed(2)}': use formatarReais", () => {
    const achados = codigo.filter((p) => /R\$ ?\$?\{[^}]*toFixed\(2\)/.test(fs.readFileSync(p, "utf8")));
    expect(achados).toEqual([]);
  });
});
