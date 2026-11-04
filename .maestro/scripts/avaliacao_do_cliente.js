// estrela-no-card (PAR-4, DEC-184): o cliente da rodada avalia pela API o
// atendimento que o profissional finalizou na 05a, para o card do dono mostrar
// a estrela e a media no print para o Andre. Nunca derruba a etapa: sem
// atendimento FINISHED (etapa avulsa) ou ja avaliado, so nao avalia.
//
// Entradas (env do runScript): API, SENHA, TAG, NOTA (1 a 5; padrao 5)
// Saida: output.AVALIOU ("1" avaliou agora ou ja estava avaliado; "0" nao achou)

function pedir(metodo, url, corpo, token) {
  var headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  return http.request(API + url, { method: metodo, headers: headers, body: corpo ? JSON.stringify(corpo) : undefined });
}

output.AVALIOU = "0";
var login = pedir("POST", "/auth/login", { email: "client_" + TAG + "_1@teste.com", password: SENHA });
if (login.status < 300) {
  var token = json(login.body).tokens.access_token;
  var lista = pedir("GET", "/attendances/client/me?status=FINISHED", null, token);
  var itens = lista.status < 300 && lista.body ? json(lista.body) : [];
  var nota = typeof NOTA === "undefined" || !NOTA ? 5 : parseInt(NOTA, 10);
  for (var i = 0; i < itens.length && output.AVALIOU === "0"; i++) {
    var r = pedir("POST", "/attendances/" + itens[i].id + "/rating", { score: nota, comment: "bateria " + TAG }, token);
    // 201 avaliou; 409 ja tinha a nota desta rodada
    if (r.status === 201 || r.status === 409) output.AVALIOU = "1";
  }
}
console.log("AVALIACAO-DO-CLIENTE: " + (output.AVALIOU === "1" ? "nota dada" : "sem atendimento finalizado para avaliar"));
