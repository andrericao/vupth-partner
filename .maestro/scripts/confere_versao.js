// Confere, antes de a bateria comecar, que o app instalado e o codigo
// esperado (bateria-confere-versao, Andre 03/10). O app mostra o commit no
// rodape da tela de entrada (app-commit); o setup.sh passa o esperado.
//
// Entradas (env do runScript): COMMIT (esperado), INSTALADO (copiado da tela)

var esperado = String(typeof COMMIT === "undefined" ? "" : COMMIT).trim();
var instalado = String(typeof INSTALADO === "undefined" ? "" : INSTALADO).trim();

if (!esperado) {
  throw new Error("faltou o commit esperado: rode com -e COMMIT=<commit> (o setup.sh imprime o comando)");
}
if (instalado.indexOf(esperado) !== 0 && esperado.indexOf(instalado) !== 0) {
  throw new Error(
    "VERSAO ERRADA — instalado: " + (instalado || "(sem commit)") + " · esperado: " + esperado +
    ". Publique o OTA da dev (ou instale o APK certo) e rode de novo."
  );
}
output.COMMIT_CONFERIDO = instalado;
