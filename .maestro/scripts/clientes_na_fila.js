// Poe clientes na fila do profissional pela API do staging — o papel do app do
// client, para a bateria nao depender dele.
//
// Entradas (env do runScript): API, EMAIL_PROF, SENHA, TAG, QTD e, opcional,
// PELO_ANDRE ("1" na bateria supervisionada com os dois usuarios, DEC-15): o
// ULTIMO cliente so ganha a conta e o nome — quem entra na fila e o Andre,
// pelo app Client, no segundo celular.
// Saidas: output.CLIENTE1..N (primeiro nome, como aparece no card)

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
if (!servicos || servicos.length === 0) throw new Error("o profissional nao tem servico");

var qtd = parseInt(QTD, 10);
var peloAndre = typeof PELO_ANDRE === "undefined" ? "" : String(PELO_ANDRE);
for (var i = 1; i <= qtd; i++) {
  var nome = "Cliente" + i + "x" + TAG;
  var email = "client_" + TAG + "_" + i + "@teste.com";
  pedir("POST", "/auth/register", { email: email, password: SENHA });
  var token = entrar(email);
  pedir("PATCH", "/profile/general-infos", { first_name: nome }, token);
  output["CLIENTE" + i] = nome;
  if (i === qtd && peloAndre === "1") break;
  pedir("POST", "/attendances", {
    professionalId: prof.id,
    establishmentId: prof.establishment_id,
    serviceItemIds: [servicos[0].id],
    scheduledTime: new Date().toISOString()
  }, token);
}
