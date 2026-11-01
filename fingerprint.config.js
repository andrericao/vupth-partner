// O fingerprint e o que decide qual OTA chega a qual build (runtimeVersion por fingerprint,
// DEC-152). So pode mudar quando muda o NATIVO.
//
// `extra` do app.json/app.config.js leva o `commit` do codigo (app.config.js): ele muda a cada
// commit, e com ele no hash NENHUM OTA casaria com NENHUM build (provado em 01/11: um commit
// vazio mudava o hash). `extra` e dado de JavaScript, nao entra no binario: fica fora.
const { SourceSkips } = require("@expo/fingerprint");

module.exports = {
  sourceSkips: SourceSkips.ExpoConfigExtraSection,
};
