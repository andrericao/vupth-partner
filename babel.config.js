module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
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
