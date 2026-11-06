// teste-link-de-participacao (Andre, 05/11): o link pessoal do profissional numa
// campanha de link (REFERRAL_BONUS) e o premio que ja nasceu, lidos de GET
// /referrals/me. O Client usa o LINK/CODIGO para o cliente novo entrar (claim);
// o Partner usa o PREMIO para conferir os R$ 5 depois do corte concluido.
// Nunca lanca: sem conta, sem campanha ou com erro, as saidas ficam vazias.
//
// Entradas (env do runScript): API, EMAIL, SENHA, NOME (nome exato da campanha)
// Saidas: output.LINK_CAMPANHA, CODIGO_LINK, CAMPANHA_ID, PARTICIPA ("sim"/"nao"),
//         PREMIO (pending_release + to_receive, em reais, "0" sem premio)

function chamar(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = null;
  for (var vez = 0; vez < 4; vez++) {
    r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : undefined });
    if (r.status !== 429 || vez === 3) break;
    var n = /in (\d+) s/.exec(r.body || "");
    var ate = Date.now() + ((n ? parseInt(n[1], 10) : 30) + 2) * 1000;
    while (Date.now() < ate) {}
  }
  var corpoLido = null;
  try { corpoLido = r.body ? json(r.body) : null; } catch (e) { corpoLido = null; }
  return { status: r.status, corpo: corpoLido };
}

output.LINK_CAMPANHA = "";
output.CODIGO_LINK = "";
output.CAMPANHA_ID = "";
output.PARTICIPA = "nao";
output.PREMIO = "0";

try {
  var login = chamar("POST", "/auth/login", { email: EMAIL, password: SENHA });
  var token = login.status < 300 && login.corpo && login.corpo.tokens ? login.corpo.tokens.access_token : null;
  var meu = token ? chamar("GET", "/referrals/me", null, token) : { status: 0, corpo: null };
  if (meu.status < 300 && meu.corpo) {
    output.CODIGO_LINK = meu.corpo.code || "";
    var premio = Number(meu.corpo.pending_release || 0) + Number(meu.corpo.to_receive || 0);
    output.PREMIO = String(isFinite(premio) ? premio : 0);
    var campanhas = meu.corpo.campaigns || [];
    for (var i = 0; i < campanhas.length; i++) {
      if (campanhas[i].name === NOME) {
        output.PARTICIPA = "sim";
        output.LINK_CAMPANHA = campanhas[i].link || "";
        output.CAMPANHA_ID = campanhas[i].campaign_id || "";
        break;
      }
    }
  }
} catch (e) {
  console.log("link_da_campanha: " + e);
}
