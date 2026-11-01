// Identidade de cada variante do app.
//
// O `app.json` continua sendo a fonte de tudo — o Expo le ele primeiro e
// entrega aqui como `config`. Este arquivo so troca DUAS coisas, e so quando
// o build e de uma variante de teste: o `package`/`bundleIdentifier` e o nome
// que aparece embaixo do icone.
//
// Por que: o Android identifica app pelo `package`. Dois builds com o mesmo id
// sao o MESMO app, entao instalar o APK de teste desinstalava o de producao (e
// vice-versa). Com sufixo, os tres convivem:
//
//   development -> com.vupth.partner.dev      "VUPTH dev"      Render, Metro local
//   preview     -> com.vupth.partner.preview  "VUPTH preview"  Render, OTA da dev
//   producao    -> com.vupth.partner          "vupth parceiros" Railway, OTA da main
//
// A variante vem de `APP_VARIANT` (eas.json, env do perfil: o eas-cli a aplica ate no
// calculo LOCAL do fingerprint, e o `eas update` do CI a recebe do passo do workflow)
// ou, na falta dela, de `EAS_BUILD_PROFILE`, que so existe DENTRO do servidor do EAS.
// Sem isso o fingerprint local e o do EAS divergiam (package e nome diferentes) e o
// build parava em "Configure expo-updates" (01/11). Sem nenhuma das duas, vale o
// app.json como esta.
const { execSync } = require("child_process");

const VARIANTES = {
  development: { sufixo: ".dev", nome: "VUPTH dev" },
  preview: { sufixo: ".preview", nome: "VUPTH preview" },
};

// O commit do codigo, em `extra.commit`: a bateria Maestro confere que o app
// instalado e o codigo esperado (bateria-confere-versao, Andre 03/10). No EAS
// Build nao ha .git — o EAS carimba EAS_BUILD_GIT_COMMIT_HASH; no `eas update`
// (roda aqui) vale o git local. Sem nenhum dos dois, segue sem o carimbo.
function commitDoCodigo() {
  const doEas = process.env.EAS_BUILD_GIT_COMMIT_HASH;
  if (doEas) return doEas.slice(0, 7);
  try {
    return String(execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })).trim();
  } catch {
    return null;
  }
}

module.exports = ({ config }) => {
  const commit = commitDoCodigo();
  if (commit) config = { ...config, extra: { ...config.extra, commit } };

  const variante = VARIANTES[process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE];
  if (!variante) return config;

  return {
    ...config,
    name: variante.nome,
    android: {
      ...config.android,
      package: `${config.android.package}${variante.sufixo}`,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}${variante.sufixo}`,
    },
  };
};
