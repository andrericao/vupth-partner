// Um profissional SO desta etapa (conta propria: a 10 muda o vinculo e nao pode
// mexer no profissional das outras), ja vinculado a loja do dono pela API.
//
// Entradas (env do runScript): API, EMAIL_DONO, SENHA, TAG e, opcional, QUEM
// ("Troca" na 10, "Abre" na 11 — uma conta por etapa)
// Saidas: output.EMAIL_<QUEM>, output.PROF_<QUEM> (ex.: EMAIL_TROCA, PROF_TROCA)

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
  if (r.status >= 300) throw new Error(metodo + " " + url + " -> " + r.status + " " + JSON.stringify(r.corpo));
  return r.corpo;
}

function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

var lojas = pedir("GET", "/establishment/mine", null, entrar(EMAIL_DONO));
if (!lojas || lojas.length === 0) throw new Error("o dono nao tem loja");

var quem = typeof QUEM === "undefined" || !QUEM ? "Troca" : String(QUEM);
var nome = quem + TAG;
var email = "prof_m" + TAG + "_" + quem.toLowerCase() + "@teste.com";
if (chamar("POST", "/auth/login", { email: email, password: SENHA }).status >= 300) {
  pedir("POST", "/auth/register", { email: email, password: SENHA });
}
var token = entrar(email);
if (chamar("GET", "/professional/me", null, token).status >= 300) {
  pedir("POST", "/professional/register", { name: nome, specialty: "NAIL_TECH" }, token);
  token = entrar(email);
}
// Login de novo acima: o token tem de carregar o papel PROFESSIONAL.
var me = pedir("GET", "/professional/me", null, token);
if (!me.establishment_id) {
  pedir("POST", "/professional/affiliate", { establishmentId: lojas[0].id }, token);
}
output["EMAIL_" + quem.toUpperCase()] = email;
output["PROF_" + quem.toUpperCase()] = nome;
