const fs = require("fs");
const os = require("os");
const path = require("path");

const { subirCatraca, main } = require("../catraca-cobertura");

const medido = (pct) => ({
  statements: { pct: pct.statements },
  branches: { pct: pct.branches },
  functions: { pct: pct.functions },
  lines: { pct: pct.lines },
});

describe("catraca da cobertura (DEC-7)", () => {
  it("sobe o minimo para o medido, arredondado para baixo", () => {
    expect(
      subirCatraca(
        { statements: 98, branches: 88, functions: 98, lines: 99 },
        medido({ statements: 98.66, branches: 91.72, functions: 98.63, lines: 99.41 })
      )
    ).toEqual({ statements: 98, branches: 91, functions: 98, lines: 99 });
  });

  it("nunca desce quando a medicao cai", () => {
    expect(
      subirCatraca(
        { statements: 98, branches: 91, functions: 98, lines: 99 },
        medido({ statements: 90, branches: 80.5, functions: 97.9, lines: 98 })
      )
    ).toEqual({ statements: 98, branches: 91, functions: 98, lines: 99 });
  });

  it("metrica ausente vale zero dos dois lados", () => {
    expect(subirCatraca({}, {})).toEqual({ statements: 0, branches: 0, functions: 0, lines: 0 });
  });

  it("reescreve o coverageThreshold do package.json", () => {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "catraca-"));
    fs.mkdirSync(path.join(raiz, "coverage"));
    fs.writeFileSync(
      path.join(raiz, "coverage", "coverage-summary.json"),
      JSON.stringify({ total: medido({ statements: 98.66, branches: 91.72, functions: 98.63, lines: 99.41 }) })
    );
    fs.writeFileSync(
      path.join(raiz, "package.json"),
      JSON.stringify({ jest: { coverageThreshold: { global: { statements: 98, branches: 88, functions: 98, lines: 99 } } } })
    );
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    main(raiz);

    const pkg = JSON.parse(fs.readFileSync(path.join(raiz, "package.json"), "utf8"));
    expect(pkg.jest.coverageThreshold.global).toEqual({ statements: 98, branches: 91, functions: 98, lines: 99 });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("88 -> 91"));
    log.mockRestore();
  });
});
