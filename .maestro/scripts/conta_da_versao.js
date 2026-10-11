// fatia-de-atualizacao (Andre, 05/10): uma conta de profissional SO da 00, para
// entrar e chegar em Perfil -> Versao do app sem mexer no profissional das
// etapas (a 02 cadastra o dela pelo app).
//
// Entradas (env do runScript): API, SENHA, TAG
// Saida: output.EMAIL_VERSAO

function chamar(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  // 429 do staging (limite de logins; log 2026-10-11_023621, 08.A6): espera o
  // tempo que ele pede ("try again in N s") e tenta de novo, ate 3 vezes.
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
  if (r.status >= 300) throw new Error("conta da 00: " + metodo + " " + url + " -> " + r.status + " " + JSON.stringify(r.corpo));
  return r.corpo;
}

function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

var email = "prof_m" + TAG + "_versao@teste.com";
if (chamar("POST", "/auth/login", { email: email, password: SENHA }).status >= 300) {
  pedir("POST", "/auth/register", { email: email, password: SENHA });
}
var token = entrar(email);
if (chamar("GET", "/professional/me", null, token).status >= 300) {
  pedir("POST", "/professional/register", { name: "Versao" + TAG, specialty: "NAIL_TECH" }, token);
}
output.EMAIL_VERSAO = email;
