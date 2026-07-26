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
module.exports = withNativeWind(config, { input: "./global.css" });
