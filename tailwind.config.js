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
      // Fontes ja carregadas via @expo-google-fonts (mesmas do v1). Archivo
      // substitui Poppins em heading/display; `mono` pros numeros (fila,
      // horarios) — precisa bater com config/gluestack-ui.config.ts (fonts).
      fontFamily: {
        heading: ["Archivo_700Bold"],
        display: ["Archivo_800ExtraBold"],
        body: ["Inter_400Regular"],
        mono: ["DMMono_500Medium"],
      },
      // Cores da marca espelhando a escala `green` do config/gluestack-ui.config.ts
      // (FONTE DA VERDADE — paleta "Verde Marca", ancorada em #3b7a3f desde
      // 2026-07-09). Precisa bater 1:1: durante a migracao as telas do v1 e do
      // v2 convivem na mesma navegacao, e qualquer desvio aparece como dois
      // verdes diferentes no app.
      colors: {
        brand: {
          DEFAULT: "#3b7a3f", // = $green500
          50: "#eef5ee",
          100: "#d9ead9",
          200: "#b5d5b6",
          300: "#8bbd8d",
          400: "#5c9c60",
          500: "#3b7a3f",
          600: "#316635",
          700: "#26522a",
          800: "#1c3d1f",
          900: "#142c17",
        },
        // Verde dos campos (v1 usava a escala `success` nos inputs/busca).
        success: { 500: "#348352", 950: "#071f11" },
        amber: { 500: "#FFB703", 600: "#d97706", 700: "#b45309" },
        danger: { 500: "#E63946", 600: "#dc2626" },
        // [marca-vupth] Tokens da nova identidade (Pencil, doc pencil-new.pen).
        // Namespaced sob `vupth` pra nao colidir com `brand`/`danger`/`amber`
        // acima (paleta antiga, ainda em uso). Precisa bater 1:1 com os tokens
        // `brand*` de config/gluestack-ui.config.ts (client e partner) — mesma
        // regra do remap do green500. brandGreen so entra como FUNDO (nunca
        // texto/icone sobre claro); forest é o par de texto/icone por cima.
        vupth: {
          green: "#9FE870",
          forest: "#163300",
          forestSoft: "#223D0D",
          greenTint: "#E2F6D5",
          accentBlue: "#A0E1E1",
          accentPeach: "#FFC091",
          accentPink: "#FFD7EF",
          accentPlum: "#260A2F",
          background: "#FFFFFF",
          surface: "#F3F5F1",
          surfaceAlt: "#E2F6D5",
          textPrimary: "#163300",
          textSecondary: "#454745",
          border: "#D7DDD3",
          danger: "#B3261E",
          warning: "#FFC091",
          success: "#9FE870",
        },
      },
    },
  },
  plugins: [],
};
