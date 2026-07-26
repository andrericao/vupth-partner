/** @type {import('tailwindcss').Config} */
// NativeWind v4 (migracao Gluestack v1->v2, faseada). `content` cobre app/ e
// src/ — como a migracao e tela por tela, o Tailwind so gera as classes que
// realmente aparecem no codigo (o v1 com props $token segue intocado).
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Cores-ancora da marca (mesmas do gluestack-ui.config v1) p/ o className
      // bater com o visual atual durante a migracao.
      colors: {
        brand: {
          DEFAULT: "#00B37E",
          500: "#00B37E",
          600: "#1B4332",
          400: "#52B788",
        },
        amber: { 500: "#FFB703", 600: "#B45309" },
        danger: { 500: "#E63946", 600: "#B91C1C" },
      },
    },
  },
  plugins: [],
};
