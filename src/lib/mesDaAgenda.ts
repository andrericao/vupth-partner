// agenda-mes-e-ano (Andre, 01/11): a agenda diz a que mes e ano se refere.
// A janela de dias pode cruzar a virada do mes (31 dias a frente), entao o rotulo
// acompanha os dias mostrados: um mes so ("Novembro de 2026"); dois no mesmo ano
// ("Novembro e dezembro de 2026"); dois em anos diferentes
// ("Dezembro de 2026 e janeiro de 2027").
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function partes(iso: string): { ano: number; mes: number } {
  return { ano: Number(iso.slice(0, 4)), mes: Number(iso.slice(5, 7)) - 1 };
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function rotuloDoMes(datas: string[]): string | null {
  if (datas.length === 0) return null;
  const ordenadas = [...datas].sort();
  const a = partes(ordenadas[0]);
  const b = partes(ordenadas[ordenadas.length - 1]);
  if (a.ano === b.ano && a.mes === b.mes) return `${capitalizar(MESES[a.mes])} de ${a.ano}`;
  if (a.ano === b.ano) return `${capitalizar(MESES[a.mes])} e ${MESES[b.mes]} de ${a.ano}`;
  return `${capitalizar(MESES[a.mes])} de ${a.ano} e ${MESES[b.mes]} de ${b.ano}`;
}
