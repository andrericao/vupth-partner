// Um profissional SO desta etapa (conta propria: a 10 muda o vinculo e nao pode
// mexer no profissional das outras), ja vinculado a loja do dono pela API.
//
// Entradas (env do runScript): API, EMAIL_DONO, SENHA, TAG
// Saidas: output.EMAIL_TROCA, output.PROF_TROCA

function chamar(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : undefined });
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

var nome = "Troca" + TAG;
var email = "prof_m" + TAG + "_troca@teste.com";
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
output.EMAIL_TROCA = email;
output.PROF_TROCA = nome;
