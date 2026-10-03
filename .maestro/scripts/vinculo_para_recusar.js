// Um SEGUNDO profissional pede vinculo a loja do dono pela API do staging — o
// dono recusa na bateria (fluxo critico, DEC-7) e depois o convida.
//
// Entradas (env do runScript): API, EMAIL_DONO, SENHA, TAG
// Saida: output.PROF_RECUSADO (o nome, como aparece no card)

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

var lojas = pedir("GET", "/establishment/mine", null, entrar(EMAIL_DONO));
if (!lojas || lojas.length === 0) throw new Error("o dono nao tem loja");

var nome = "Recusado" + TAG;
var email = "prof_m" + TAG + "_recusado@teste.com";
pedir("POST", "/auth/register", { email: email, password: SENHA });
pedir("POST", "/professional/register", { name: nome, specialty: "NAIL_TECH" }, entrar(email));
// Login de novo: o token tem de carregar o papel PROFESSIONAL recem-criado.
// O PEDIDO (PENDING), como o app faz em establishment-detail — o
// /professional/affiliate vincula direto e nao deixa nada para o dono recusar.
pedir("POST", "/professional/me/affiliations", { establishmentId: lojas[0].id }, entrar(email));
output.PROF_RECUSADO = nome;
