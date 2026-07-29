import { Alert } from "react-native";

// Placeholder para funcionalidades cujo BACKEND ainda nao existe: a UI ja fica
// pronta e, no clique, avisamos "em breve". Ao ligar o endpoint, troca-se a
// chamada de `comingSoon(...)` pela API real — assim medimos quais features
// fizeram mais falta. (Estrategia Andre 2026-07-12.)
export function comingSoon(feature = "Essa funcionalidade") {
  Alert.alert("Em breve 🚧", `${feature} estara disponivel em breve.`);
}
