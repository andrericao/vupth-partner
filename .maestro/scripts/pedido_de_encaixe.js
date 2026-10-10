// Um cliente pede ENCAIXE ao profissional pela API do staging (a loja precisa
// estar fechada para novos — senao o backend responde 409).
//
// Entradas (env do runScript): API, EMAIL_PROF, SENHA, TAG e, opcionais, QUEM
// (outro cliente na mesma rodada — o do pedido que a bateria RECUSA) e AMANHA
// ("sim": o pedido e para amanha as 10h — pedido-de-corte-outro-dia, sem prazo)
// Saida: output.CLIENTE_ENCAIXE, ou output.CLIENTE_<QUEM> quando QUEM vem

function pedir(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : (metodo === "GET" || metodo === "DELETE" ? undefined : "{}") });
  if (r.status >= 300) throw new Error(metodo + " " + url + " -> " + r.status + " " + r.body);
  return r.body ? json(r.body) : null;
}

function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

var tokenProf = entrar(EMAIL_PROF);
var prof = pedir("GET", "/professional/me", null, tokenProf);
var servicos = pedir("GET", "/professional/" + prof.id + "/service-items", null, tokenProf);

var quem = typeof QUEM === "undefined" ? "" : QUEM;
var nome = (quem ? quem : "Encaixe") + TAG;
var email = "client_" + TAG + "_encaixe" + quem.toLowerCase() + "@teste.com";
pedir("POST", "/auth/register", { email: email, password: SENHA });
var token = entrar(email);
pedir("PATCH", "/profile/general-infos", { first_name: nome }, token);
var corpo = {
  professionalId: prof.id,
  establishmentId: prof.establishment_id,
  serviceItemIds: [servicos[0].id]
};
if (typeof AMANHA !== "undefined" && AMANHA) {
  // o "amanha" e o de Brasilia (UTC-3): depois das 21h, o dia UTC ja virou e o
  // pedido caia depois de amanha ("Quer dom" no lugar de "Quer amanha", bateria 09/10 22:48)
  var amanha = new Date(Date.now() - 3 * 3600 * 1000 + 24 * 3600 * 1000);
  amanha.setUTCHours(13, 0, 0, 0); // 10h de Brasilia
  corpo.desiredTime = amanha.toISOString();
}
pedir("POST", "/attendances/cut-requests", corpo, token);
if (quem) output["CLIENTE_" + quem.toUpperCase()] = nome;
else output.CLIENTE_ENCAIXE = nome;
