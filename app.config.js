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
// `EAS_BUILD_PROFILE` e carimbado pelo EAS durante o build. Rodando local ele
// nao existe, e ai vale o app.json como esta.
const VARIANTES = {
  development: { sufixo: ".dev", nome: "VUPTH dev" },
  preview: { sufixo: ".preview", nome: "VUPTH preview" },
};

module.exports = ({ config }) => {
  const variante = VARIANTES[process.env.EAS_BUILD_PROFILE];
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
