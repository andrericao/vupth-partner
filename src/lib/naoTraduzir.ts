// Pedir ao navegador que NAO traduza a pagina.
//
// 🔴 O "Xiaomi muito diferente" (15/09) era o navegador traduzindo um app que ja
// esta em portugues. O `lang: "pt-BR"` (18/09) tirou o motivo do convite, mas o
// Chrome guarda "traduzir sempre este site" POR DOMINIO: quem aceitou uma vez
// continua com a pagina traduzida.
//
// E o estrago passa do texto: a traducao reescreve o DOM por baixo do React e
// QUEBRA o campo controlado. No cadastro de servico, R$ 60,00 chegava ao calculo
// como R$ 0,06 e R$ 1.000,00 como R$ 0,01 — so o primeiro digito sobrevivia
// (prints do Andre, 18/09). O preco e a mascara estao certos.
//
// ⚠️ POR QUE AQUI, e nao num `app/+html.tsx`: a web deste app e gerada como
// PAGINA UNICA (`web.output: "single"` no app.json) e, nesse formato, o Expo
// monta o index.html pelo modelo DELE e ignora o `+html.tsx` — conferido no
// build local de 19/09, o arquivo nao tinha efeito nenhum. Entao o pedido e
// feito no boot, na propria pagina.
//
// Desde 25/09 o pedido principal mora no `public/index.html` (o modelo que a
// pagina unica usa): o boot chegava depois de o navegador decidir, e o Xiaomi
// seguia oferecendo traduzir. Isto aqui fica como reforco.
//
// Isto NAO substitui desmarcar "traduzir sempre" nas configuracoes do site:
// essa preferencia e do navegador e nenhuma pagina a apaga.
export function pedirParaNaoTraduzir(doc?: Document | null): boolean {
  const d = doc ?? (typeof document !== "undefined" ? document : null);
  if (!d?.documentElement) return false;

  d.documentElement.setAttribute("translate", "no");
  d.documentElement.classList?.add("notranslate");

  if (!d.querySelector?.('meta[name="google"][content="notranslate"]')) {
    const meta = d.createElement("meta");
    meta.setAttribute("name", "google");
    meta.setAttribute("content", "notranslate");
    d.head?.appendChild(meta);
  }
  return true;
}
