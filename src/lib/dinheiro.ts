// valor-em-reais-padronizado (Andre, 22/10): um padrao so em toda tela, dica, aviso
// e botao — "R$ 53,90": simbolo, espaco, virgula nos centavos, ponto no milhar
// ("R$ 1.234,56"), sempre com duas casas. Nada de ponto decimal nem "R$53.90".
// Hermes nem sempre traz o Intl completo, entao a conta e feita na mao.
export function formatarReais(valor: number | string | null | undefined): string {
  const n = Number(valor ?? 0);
  const v = Number.isFinite(n) ? n : 0;
  const centavos = Math.round(Math.abs(v) * 100);
  const inteiro = Math.floor(centavos / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const resto = String(centavos % 100).padStart(2, "0");
  return `${v < 0 && centavos > 0 ? "-" : ""}R$ ${inteiro},${resto}`;
}
