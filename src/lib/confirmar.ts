import { Alert, Platform } from "react-native";

import { alertWebInstalado } from "@lib/alertWeb";

// Confirmacao que funciona NAS DUAS PLATAFORMAS.
//
// 🔴 Por que existe (issue #25, teste manual de 30/08 na web): "botao de remover
// servico nao funciona", "o botao de aceitar novos nao funciona". Nenhum dos
// dois estava quebrado — os dois pedem confirmacao com `Alert.alert(titulo, msg,
// [Cancelar, Confirmar])`, e o **react-native-web nao implementa o Alert com
// botoes**. A caixa nunca aparece, o callback nunca roda, e o toque parece nao
// ter efeito. E a pior forma de defeito: silenciosa, e so na web.
//
// No nativo continua o Alert de sempre.
//
// ⚠️ ATUALIZADO em 07/09 (A5): a web tambem passa a usar o Alert, porque agora
// existe um SHIM que o desenha de verdade no navegador (src/lib/alertWeb.ts,
// instalado no boot). Antes daqui caia no `window.confirm` — real, mas de uma
// linha so e sem os rotulos escolhidos. Com o shim, os dois lados mostram a
// MESMA caixa, com os mesmos botoes.
//
// O `window.confirm` fica como FALLBACK, para o caso de o shim nao ter sido
// instalado (sem `document`, export estatico, teste). Melhor uma caixa feia do
// que uma acao destrutiva que acontece sem perguntar.

type Texto = {
  titulo: string;
  mensagem: string;
  /** Rotulo do botao que confirma (default "Confirmar"). */
  confirmar?: string;
  /** Rotulo do botao que cancela (default "Cancelar"). */
  cancelar?: string;
  /** Pinta o confirmar como destrutivo no iOS. */
  destrutivo?: boolean;
};

type Deps = {
  plataforma?: typeof Platform.OS;
  alertImpl?: typeof Alert.alert;
  confirmImpl?: (texto: string) => boolean;
};

export function confirmar(texto: Texto, deps: Deps = {}): Promise<boolean> {
  const plataforma = deps.plataforma ?? Platform.OS;
  const rotuloOk = texto.confirmar ?? "Confirmar";
  const rotuloCancelar = texto.cancelar ?? "Cancelar";

  if (plataforma === "web" && !alertWebInstalado()) {
    const confirmImpl =
      deps.confirmImpl ??
      ((t: string) => (typeof window !== "undefined" ? window.confirm(t) : false));
    try {
      // A caixa do navegador tem UMA linha: sem o titulo junto, "Tem certeza?"
      // fica sem dizer certeza do que.
      return Promise.resolve(confirmImpl(`${texto.titulo}\n\n${texto.mensagem}`) === true);
    } catch {
      // Bloqueado (iframe com sandbox, extensao): na duvida, NAO executa.
      return Promise.resolve(false);
    }
  }

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<boolean>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: rotuloCancelar, style: "cancel", onPress: () => resolve(false) },
      {
        text: rotuloOk,
        style: texto.destrutivo ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

// ---------------------------------------------------------------------------

type TextoAviso = {
  titulo: string;
  mensagem: string;
  /** Rotulo do botao unico (default "OK"). */
  ok?: string;
};

type DepsAviso = {
  plataforma?: typeof Platform.OS;
  alertImpl?: typeof Alert.alert;
  alertaWebImpl?: (texto: string) => void;
};

/**
 * Aviso de um botao so — o irmao PIOR do `confirmar()`.
 *
 * 🔴 Onze chamadas do app eram
 * `Alert.alert(titulo, msg, [{ text: "OK", onPress: () => router.replace(...) }])`.
 * Na web a caixa nao aparece, entao o `onPress` **nunca roda** — e a acao **ja
 * aconteceu**. O profissional envia a solicitacao de afiliacao e continua na
 * mesma tela, entao envia de novo; o servico e criado e a tela nao fecha, entao
 * ele cria duplicado; a senha e redefinida e o usuario fica preso no formulario.
 *
 * ⚠️ **Contrato diferente do `confirmar()`:** se a caixa falhar, o fluxo
 * **SEGUE**. La, na duvida, nao age — a acao destrutiva ainda nao aconteceu.
 * Aqui ela ja aconteceu, e segurar a navegacao seria repetir o proprio defeito.
 */
export function avisar(texto: TextoAviso, deps: DepsAviso = {}): Promise<void> {
  const plataforma = deps.plataforma ?? Platform.OS;

  if (plataforma === "web" && !alertWebInstalado()) {
    const alertaWeb =
      deps.alertaWebImpl ??
      ((t: string) => {
        if (typeof window !== "undefined") window.alert(t);
      });
    try {
      alertaWeb(`${texto.titulo}\n\n${texto.mensagem}`);
    } catch {
      // Caixa bloqueada nao pode virar navegacao perdida.
    }
    return Promise.resolve();
  }

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<void>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: texto.ok ?? "OK", onPress: () => resolve() },
    ]);
  });
}
