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

if (!esperados.length) {
  throw new Error("faltou o commit esperado: rode pelo setup.sh (bash .maestro/setup.sh), que acha o commit sozinho");
}
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
