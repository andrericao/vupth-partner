// Prepara pela API do staging o estado que a etapa ETAPA espera (bateria-nao-para,
// Andre 03/10): cada etapa roda sozinha, mesmo que a anterior tenha falhado.
// Tudo e idempotente — se a etapa anterior passou, o que ela criou pelo app e
// reaproveitado; se falhou, o preparo cria o que faltou.
//
// Entradas (env do runScript): API, SENHA, TAG, ETAPA (1..8)
// Saidas: output.CLIENTE1 e output.CLIENTE2 nas etapas 6 e 8 (o historico)

var etapa = parseInt(ETAPA, 10);
var EMAIL_DONO = "prop_m" + TAG + "@teste.com";
var EMAIL_PROF = "prof_m" + TAG + "@teste.com";
var LOJA = "Loja M" + TAG;
var PROF = "Prof" + TAG;

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
  if (r.status >= 300) throw new Error("preparo da etapa " + etapa + ": " + metodo + " " + url + " -> " + r.status + " " + JSON.stringify(r.corpo));
  return r.corpo;
}

// Entra; sem a conta, cria e entra.
function conta(email) {
  var r = chamar("POST", "/auth/login", { email: email, password: SENHA });
  if (r.status < 300) return r.corpo.tokens.access_token;
  pedir("POST", "/auth/register", { email: email, password: SENHA });
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

// Login de novo: o token tem de carregar o papel recem-criado (OWNER/PROFESSIONAL).
function entrar(email) {
  return pedir("POST", "/auth/login", { email: email, password: SENHA }).tokens.access_token;
}

// ── A partir da 02: o dono com a loja aberta 24 horas (o que a 01 faz) ──
var loja = null;
var tokenDono = null;
if (etapa >= 2) {
  tokenDono = conta(EMAIL_DONO);
  var lojas = chamar("GET", "/establishment/mine", null, tokenDono);
  if (lojas.status < 300 && lojas.corpo && lojas.corpo.length > 0) {
    loja = lojas.corpo[0];
  } else {
    pedir("PATCH", "/profile/general-infos", { first_name: "Dono " + TAG }, tokenDono);
    loja = pedir("POST", "/establishment/quick-create", { name: LOJA, serviceType: "BARBER" }, tokenDono);
    tokenDono = entrar(EMAIL_DONO);
    var dias = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    pedir("PUT", "/establishment/" + loja.id + "/hours/weekly", {
      days: dias.map(function (d) { return { day: d, closed: false, opens: "00:00", closes: "00:00" }; })
    }, tokenDono);
  }
}

// ── A partir da 03: o profissional cadastrado (o que a 02 faz) ──
var prof = null;
var tokenProf = null;
if (etapa >= 3) {
  tokenProf = conta(EMAIL_PROF);
  var me = chamar("GET", "/professional/me", null, tokenProf);
  if (me.status >= 300) {
    pedir("POST", "/professional/register", { name: PROF, specialty: "NAIL_TECH" }, tokenProf);
    tokenProf = entrar(EMAIL_PROF);
    me = chamar("GET", "/professional/me", null, tokenProf);
  }
  prof = me.corpo;
}

// O pedido pendente do profissional, lido do lado dele: a lista da loja nem
// sempre casa com o id de /professional/me (a 03 caiu num 409 com o pedido la).
function pedidoPendente() {
  var r = chamar("GET", "/professional/me/affiliations", null, tokenProf);
  var lista = r.status < 300 && Array.isArray(r.corpo) ? r.corpo : [];
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].status).toUpperCase() === "PENDING") return lista[i];
  }
  return null;
}

// ── 03: o pedido de vinculo pendente, para o dono aceitar ──
// 409 AFFILIATION_ALREADY_PENDING = a 02 ja deixou o pedido: e o estado esperado.
if (etapa === 3 && !prof.establishment_id && !pedidoPendente()) {
  var pedido = chamar("POST", "/professional/me/affiliations", { establishmentId: loja.id }, tokenProf);
  var jaPendente = pedido.status === 409 && pedido.corpo && pedido.corpo.code === "AFFILIATION_ALREADY_PENDING";
  if (pedido.status >= 300 && !jaPendente) {
    throw new Error("preparo da etapa 3: POST /professional/me/affiliations -> " + pedido.status + " " + JSON.stringify(pedido.corpo));
  }
}

// ── A partir da 04: o profissional ja vinculado (o que a 03 faz) ──
if (etapa >= 4 && !prof.establishment_id) {
  var pendente = pedidoPendente();
  if (pendente) pedir("PATCH", "/affiliations/" + pendente.id + "/accept", null, tokenDono);
  else pedir("POST", "/professional/affiliate", { establishmentId: loja.id }, tokenProf);
  tokenProf = entrar(EMAIL_PROF);
  prof = pedir("GET", "/professional/me", null, tokenProf);
}

// ── A partir da 05: um servico e o profissional Trabalhando (o que a 04 faz) ──
// A 04b (etapas-curtas; log 2026-10-11_143031, 04.51) so precisa do servico
// (o que a 04a faz): sem ele o Trabalhando nao abre. O status ela mesma troca.
var so04b = String(ETAPA) === "4b";
var servicos = [];
if (etapa >= 5 || so04b) {
  servicos = pedir("GET", "/professional/" + prof.id + "/service-items", null, tokenProf) || [];
  if (servicos.length === 0) {
    // R$ 30 digitados, sem absorcao: o cliente paga 31,90 (x1,06 e X,90 pra cima)
    pedir("POST", "/professional-queue/" + prof.id + "/add-service-items", {
      serviceItemType: "MANICURE", customName: "Manicure " + TAG,
      price: 31.9, pro_receives: 30, base_price: 30, estimatedMinutes: 60
    }, tokenProf);
    servicos = pedir("GET", "/professional/" + prof.id + "/service-items", null, tokenProf);
  }
  if (so04b) {
    // so o servico
  } else if (prof.work_status !== "WORKING") {
    pedir("PATCH", "/professional/me/status", { status: "WORKING" }, tokenProf);
  }
  // Rodada depois do fechamento da loja: o auto-fechamento poe accepting_new=false
  // e o POST /attendances da 409 PROFESSIONAL_NOT_ACCEPTING_NEW (log 06/10 20:30).
  if (prof.accepting_new === false || prof.acceptingNew === false) {
    pedir("PATCH", "/professional/me/accepting-new", { value: true }, tokenProf);
  }
}

// ── 06 e 08: um atendimento Finalizado e um Retirado hoje (o que a 05 faz) ──
// Clientes proprios do preparo (sufixo h): nao dependem de a 05 ter passado.
function clienteNaFila(n) {
  var nome = "Cliente" + n + "h" + TAG;
  var token = conta("client_" + TAG + "_h" + n + "_e" + etapa + "@teste.com");
  pedir("PATCH", "/profile/general-infos", { first_name: nome }, token);
  var at = pedir("POST", "/attendances", {
    professionalId: prof.id,
    establishmentId: prof.establishment_id,
    serviceItemIds: [servicos[0].id],
    scheduledTime: new Date().toISOString()
  }, token);
  return { nome: nome, id: at.id };
}

if (etapa === 6 || etapa === 8) {
  var finalizado = clienteNaFila(1);
  pedir("PATCH", "/attendances/" + finalizado.id + "/start", null, tokenProf);
  pedir("PATCH", "/attendances/" + finalizado.id + "/finish", null, tokenProf);
  var retirado = clienteNaFila(2);
  pedir("DELETE", "/professional-queue/" + retirado.id + "/remove", null, tokenProf);
  output.CLIENTE1 = finalizado.nome;
  output.CLIENTE2 = retirado.nome;
}
