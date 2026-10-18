// O escuro so entra na ESCOLHA de Perfil → Aparencia quando as telas dele
// estiverem convertidas (DEC-75: "autorizar e pôr na fila, não virar
// prioridade"). Enquanto isso a base — tokens, variaveis, store, hook — ja
// esta na `dev`, mas o app nao oferece o escuro: um tema pela metade (texto
// forest sobre fundo forest, 1:1) e pior que nenhum.
//
// Para experimentar: EXPO_PUBLIC_TEMA_ESCURO=1 npx expo start. A PR que
// converter o ultimo grupo de telas troca esta constante por `true` e apaga a
// variavel.
export const ESCURO_LIBERADO = process.env.EXPO_PUBLIC_TEMA_ESCURO === "1";
