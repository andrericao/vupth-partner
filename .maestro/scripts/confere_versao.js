// Confere, antes de a bateria comecar, que o app instalado e o codigo
// esperado (bateria-confere-versao, Andre 03/10). O app mostra o commit no
// rodape da tela de entrada (app-commit); o setup.sh passa o esperado.
//
// Entradas (env do runScript): COMMIT (esperados, separados por virgula — o
// setup.sh passa os da origin/dev desde o ultimo OTA), INSTALADO (da tela)

var esperados = String(typeof COMMIT === "undefined" ? "" : COMMIT)
  .split(",")
  .map(function (c) { return c.trim(); })
  .filter(function (c) { return c; });
var instalado = String(typeof INSTALADO === "undefined" ? "" : INSTALADO).trim();

// Rodada fora do setup.sh (maestro test direto): sem o esperado, nao ha o que
// conferir — avisa e segue, em vez de parar a bateria (Client parou assim, 03/10).
if (!esperados.length) {
  console.log("AVISO: sem COMMIT esperado (rodada fora do setup.sh) — versao nao conferida; instalado: " + (instalado || "(sem commit)"));
  output.COMMIT_CONFERIDO = "";
} else {
var confere = esperados.some(function (esperado) {
  return instalado && (instalado.indexOf(esperado) === 0 || esperado.indexOf(instalado) === 0);
});
if (!confere) {
  throw new Error(
    "VERSAO ERRADA — instalado: " + (instalado || "(sem commit)") + " · esperado: " + esperados.join(" ou ") +
    ". Publique o OTA da dev (ou instale o APK certo) e rode de novo."
  );
}
output.COMMIT_CONFERIDO = instalado;
}
