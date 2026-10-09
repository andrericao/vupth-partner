// desativar-conta (bateria-desativar-conta, 08/10): contas PROPRIAS da etapa 13,
// para desativar e apagar sem sujar as das outras etapas. Um dono com a loja
// aberta 24h e um profissional ja vinculado a ela (o herdeiro da posse).
//
// Entradas (env do runScript): API, SENHA, TAG
// Saida: output.EMAIL_DONO_D, output.LOJA_D, output.EMAIL_HERDEIRO, output.HERDEIRO

function pedir(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  var r = http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : (metodo === "GET" || metodo === "DELETE" ? undefined : "{}") });
  if (r.status >= 300) throw new Error("conta_para_desativar: " + metodo + " " + url + " -> " + r.status + " " + r.body);
  return r.body ? json(r.body) : null;
}

function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

var emailDono = "prop_m" + TAG + "_d@teste.com";
var loja = "Loja D" + TAG;
pedir("POST", "/auth/register", { email: emailDono, password: SENHA });
var tokenDono = entrar(emailDono);
pedir("PATCH", "/profile/general-infos", { first_name: "Dono D" + TAG }, tokenDono);
var criada = pedir("POST", "/establishment/quick-create", { name: loja, serviceType: "BARBER" }, tokenDono);
tokenDono = entrar(emailDono);
var dias = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
pedir("PUT", "/establishment/" + criada.id + "/hours/weekly", {
  days: dias.map(function (d) { return { day: d, closed: false, opens: "00:00", closes: "00:00" }; })
}, tokenDono);

var herdeiro = "Herdeiro" + TAG;
var emailHerdeiro = "prof_m" + TAG + "_herdeiro@teste.com";
pedir("POST", "/auth/register", { email: emailHerdeiro, password: SENHA });
pedir("POST", "/professional/register", { name: herdeiro, specialty: "BARBER" }, entrar(emailHerdeiro));
pedir("POST", "/professional/affiliate", { establishmentId: criada.id }, entrar(emailHerdeiro));

output.EMAIL_DONO_D = emailDono;
output.LOJA_D = loja;
output.EMAIL_HERDEIRO = emailHerdeiro;
output.HERDEIRO = herdeiro;
