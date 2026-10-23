// maestro-campanha-cupom-e-link-no-partner (Andre, 23/10): a campanha de teste e
// criada por ele no Painel, com nome exato e os valores que quiser. Este script
// cria (ou reaproveita) um profissional so deste fluxo, consulta GET
// /campaigns/active e diz se a campanha com aquele nome esta no ar. Se nao
// estiver, o fluxo PULA (nao falha) e a bateria segue.
//
// Entradas (env do runScript): API, SENHA, TAG, NOME, SUFIXO
// Saidas: output.EMAIL_CAMP, EXISTE ("sim"/"nao"), CODIGO, FIM_PASSOU, SEM_VAGA

function chamar(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = null;
  for (var vez = 0; vez < 4; vez++) {
    r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : (metodo === "GET" || metodo === "DELETE" ? undefined : "{}") });
    if (r.status !== 429 || vez === 3) break;
    var n = /in (\d+) s/.exec(r.body || "");
    var ate = Date.now() + ((n ? parseInt(n[1], 10) : 30) + 2) * 1000;
    while (Date.now() < ate) {}
  }
  return { status: r.status, corpo: r.body ? json(r.body) : null };
}

function pedir(metodo, url, corpo, token) {
  var r = chamar(metodo, url, corpo, token);
  if (r.status >= 300) throw new Error("campanha: " + metodo + " " + url + " -> " + r.status + " " + JSON.stringify(r.corpo));
  return r.corpo;
}

var email = "prof_m" + TAG + "_" + SUFIXO + "@teste.com";
if (chamar("POST", "/auth/login", { email: email, password: SENHA }).status >= 300) {
  pedir("POST", "/auth/register", { email: email, password: SENHA });
}
var token = pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
if (chamar("GET", "/professional/me", null, token).status >= 300) {
  pedir("POST", "/professional/register", { name: "Camp" + TAG + SUFIXO, specialty: "NAIL_TECH" }, token);
}

output.EMAIL_CAMP = email;
output.EXISTE = "nao";
output.CODIGO = "";
output.FIM_PASSOU = "nao";
output.SEM_VAGA = "nao";

var r = chamar("GET", "/campaigns/active", null, token);
var lista = r.status < 300 && r.corpo && r.corpo.length !== undefined ? r.corpo : [];
for (var i = 0; i < lista.length; i++) {
  if (lista[i].name === NOME) {
    output.EXISTE = "sim";
    output.CODIGO = lista[i].code || "";
    output.FIM_PASSOU = lista[i].ends_at && new Date(lista[i].ends_at).getTime() < Date.now() ? "sim" : "nao";
    output.SEM_VAGA = lista[i].remaining_slots === 0 ? "sim" : "nao";
    break;
  }
}
