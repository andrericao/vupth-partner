// O escuro so entra na ESCOLHA de Perfil → Aparencia quando as telas dele
// estiverem convertidas (DEC-75: "autorizar e pôr na fila, não virar
// prioridade"). Enquanto isso a base — tokens, variaveis, store, hook — ja
// esta na `dev`, mas o app nao oferece o escuro: um tema pela metade (texto
// forest sobre fundo forest, 1:1) e pior que nenhum.
//
// Para experimentar: EXPO_PUBLIC_TEMA_ESCURO=1 npx expo start. Com a lista da
// catraca de cor vazia, ABRIR o escuro e decisao do Andre (DEC-75): quem abrir
// troca esta constante por `true`, apaga a variavel e muda o `userInterfaceStyle`
// do app.json, que e nativo e pede versao nova.
export const ESCURO_LIBERADO = process.env.EXPO_PUBLIC_TEMA_ESCURO === "1";
