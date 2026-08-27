module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind (Gluestack v2): jsxImportSource "nativewind" habilita a prop
    // `className` em qualquer componente + o preset processa as classes. NAO
    // afeta as telas v1 (que usam props $token, nao className).
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@lib": "./src/lib",
            "@store": "./src/store",
            "@hooks": "./src/hooks",
            "@components": "./src/components",
            "@assets": "./src/assets",
            "@theme": "./src/theme",
            "@utils": "./src/utils",
          },
        },
      ],
    ],
  };
};
