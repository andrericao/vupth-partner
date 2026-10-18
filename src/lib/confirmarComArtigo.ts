import { Alert, Platform } from "react-native";

import { abrirArtigo, type Artigo } from "@lib/artigosDoSuporte";
import { confirmar } from "@lib/confirmar";

// `confirmar()` com "Saiba mais" como TERCEIRO botão, depois dos dois de sempre.
//
// Por que por último (e não no meio, como em `confirmarComSaibaMais`): a bateria
// Maestro confirma pelo índice (`apoio/confirmar.yaml` toca `dialogo-botao-1`).
// Com o "Saiba mais" no meio, o 1 deixa de ser a ação e passa a abrir o
// navegador — a bateria "confirmaria" lendo um artigo. No fim, Cancelar segue
// sendo 0 e a ação segue sendo 1.
//
// "Saiba mais" não confirma nem cancela: abre o artigo e repete a pergunta, que
// continua valendo quando a pessoa volta. Fechar a caixa ao tocar nele obrigaria
// a refazer o caminho até ela.
//
// A flag é a que o shim da web crava ao instalar; sem ele a web só tem dois
// botões e cai no `confirmar()` normal.
const alertWebInstalado = () =>
  (Alert as unknown as { __vupthWebAlert?: boolean }).__vupthWebAlert === true;

// O artigo vai DENTRO do texto (e nao como segundo argumento): trocar um
// `confirmar({...})` por este e so trocar o nome e acrescentar uma chave, sem
// mexer na linha `});` que fecha a chamada.
type Texto = Parameters<typeof confirmar>[0] & { artigo: Artigo };
type Deps = Parameters<typeof confirmar>[1];

export function confirmarComArtigo(texto: Texto, deps: Deps = {}): Promise<boolean> {
  const plataforma = deps.plataforma ?? Platform.OS;
  if (plataforma === "web" && !alertWebInstalado()) return confirmar(texto, deps);

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<boolean>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: texto.cancelar ?? "Cancelar", style: "cancel", onPress: () => resolve(false) },
      {
        text: texto.confirmar ?? "Confirmar",
        style: texto.destrutivo ? "destructive" : "default",
        onPress: () => resolve(true),
      },
      {
        text: "Saiba mais",
        onPress: () => {
          void abrirArtigo(texto.artigo);
          resolve(confirmarComArtigo(texto, deps));
        },
      },
    ]);
  });
}
