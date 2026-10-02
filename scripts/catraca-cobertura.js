#!/usr/bin/env node
/**
 * Catraca da cobertura (DEC-7, Andre, 02/10): o minimo do coverageThreshold
 * sobe para o valor medido (arredondado para baixo) e NUNCA desce.
 *
 * Le coverage/coverage-summary.json (o Andre roda `npm run test:coverage`
 * antes do build) e reescreve o coverageThreshold do package.json.
 *
 *   npm run cobertura:catraca
 */
const fs = require("fs");
const path = require("path");

const METRICAS = ["statements", "branches", "functions", "lines"];

/** Novo minimo de cada metrica: o maior entre o atual e o medido (inteiro). */
function subirCatraca(minimo, medido) {
  const novo = {};
  for (const m of METRICAS) {
    const atual = minimo[m] ?? 0;
    const piso = Math.floor(medido[m]?.pct ?? 0);
    novo[m] = Math.max(atual, piso);
  }
  return novo;
}

function main(raiz = path.join(__dirname, "..")) {
  const resumo = JSON.parse(
    fs.readFileSync(path.join(raiz, "coverage", "coverage-summary.json"), "utf8")
  );
  const arqPkg = path.join(raiz, "package.json");
  const pkg = JSON.parse(fs.readFileSync(arqPkg, "utf8"));
  const antes = pkg.jest.coverageThreshold.global;
  const depois = subirCatraca(antes, resumo.total);
  pkg.jest.coverageThreshold.global = depois;
  fs.writeFileSync(arqPkg, JSON.stringify(pkg, null, 2) + "\n");
  for (const m of METRICAS) {
    const seta = depois[m] > antes[m] ? `${antes[m]} -> ${depois[m]}` : `${depois[m]} (igual)`;
    console.log(`${m.padEnd(10)} medido ${resumo.total[m].pct}%  minimo ${seta}`);
  }
  return depois;
}

if (require.main === module) main();

module.exports = { subirCatraca, main };
