const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Variante `/expo` do svg-transformer: ENCADEIA com o transformer padrao do
// Expo (que o css-interop do NativeWind envolve). Sem o `/expo`, o SVG e o
// NativeWind brigariam pelo babelTransformerPath. (Ponto a validar no bundling.)
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo"
);

// withNativeWind processa o global.css (via css-interop) SEM tocar no
// babelTransformerPath acima — so adiciona o pipeline de CSS.
const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

// expo-secure-store nao tem implementacao web (o modulo nativo e um objeto
// vazio), e sem ele o app nao autentica no navegador. So no bundle web, resolve
// para o substituto em web-shims/. iOS e Android seguem usando o pacote real, e
// o codigo-fonte nao muda — os testes continuam mockando "expo-secure-store".
// Encadeia DEPOIS do withNativeWind para nao perder o resolver dele.
const path = require("path");
const defaultResolveRequest = nativeWindConfig.resolver.resolveRequest;

nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "expo-secure-store") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "web-shims/expo-secure-store.js"),
    };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = nativeWindConfig;
