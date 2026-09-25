// Um cliente pede ENCAIXE ao profissional pela API do staging (a loja precisa
// estar fechada para novos — senao o backend responde 409).
//
// Entradas (env do runScript): API, EMAIL_PROF, SENHA, TAG
// Saida: output.CLIENTE_ENCAIXE

function pedir(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.status >= 300) throw new Error(metodo + " " + url + " -> " + r.status + " " + r.body);
  return r.body ? json(r.body) : null;
}

function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

var tokenProf = entrar(EMAIL_PROF);
var prof = pedir("GET", "/professional/me", null, tokenProf);
var servicos = pedir("GET", "/professional/" + prof.id + "/service-items", null, tokenProf);

var nome = "Encaixe" + TAG;
var email = "client_" + TAG + "_encaixe@teste.com";
pedir("POST", "/auth/register", { email: email, password: SENHA });
var token = entrar(email);
pedir("PATCH", "/profile/general-infos", { first_name: nome }, token);
pedir("POST", "/attendances/cut-requests", {
  professionalId: prof.id,
  establishmentId: prof.establishment_id,
  serviceItemIds: [servicos[0].id]
}, token);
output.CLIENTE_ENCAIXE = nome;
