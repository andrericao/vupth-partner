import { Alert, Platform } from "react-native";

import { abrirDialogo, useDialogoStore, type BotaoDialogo } from "@store/dialogo.store";
import type { TipoDeDialogo } from "@lib/tipoDeDialogo";

// A flag que o shim do web crava ao instalar (web-shims/alert.js) — mesmo nome
// do Front-Client, para os dois apps poderem ler o estado um do outro em
// qualquer investigacao conjunta.
const alertWebInstalado = () =>
  (Alert as unknown as { __vupthWebAlert?: boolean }).__vupthWebAlert === true;

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
// existe um SHIM que o desenha de verdade no navegador
// (`web-shims/alert.js`, instalado no boot — implementacao espelhada do
// Front-Client). Antes daqui caia no `window.confirm` — real, mas de uma linha
// so, sem os rotulos escolhidos, BLOQUEANTE (trava o event loop) e limitado a
// dois botoes. Com o shim, os dois lados mostram a MESMA caixa.
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
  /**
   * Identidade do aviso no DialogoVupth: faixa + selo (design-modais, 17/10).
   * So o nativo desenha; na web (shim) e sem o host montado o aviso sai sem
   * tipo, como sempre saiu. Destrutivo e para o que NAO tem volta: o primario
   * de um aviso com tipo e verde, e o vermelho so aparece com `destrutivo`.
   */
  tipo?: TipoDeDialogo;
  /** Troca o rotulo do selo ("Multa" em vez de "Pagamento"). */
  selo?: string;
};

type Deps = {
  plataforma?: typeof Platform.OS;
  alertImpl?: typeof Alert.alert;
  confirmImpl?: (texto: string) => boolean;
  /** Teste: quem desenha o aviso com tipo (default: o DialogoVupth, pela loja). */
  dialogoImpl?: typeof abrirDialogo;
  /** Teste: o DialogoVupth esta montado? (default: a loja diz). */
  hostMontado?: () => boolean;
};

/**
 * O caminho do aviso COM tipo. O `Alert.alert` nao tem onde carregar o tipo, e
 * a interceptacao dele (alertNativo) so repassa titulo e botoes; entao o aviso
 * tipado fala direto com a loja do DialogoVupth. Sem host montado (ou na web)
 * devolve null e quem chama segue pelo Alert, sem tipo: feio e visivel e
 * melhor que um aviso que ninguem desenha.
 */
function pelaCaixaComTipo(
  texto: { titulo: string; mensagem: string; tipo?: TipoDeDialogo; selo?: string },
  deps: Deps,
  plataforma: typeof Platform.OS
): ((botoes: BotaoDialogo[]) => Promise<number>) | null {
  if (!texto.tipo || plataforma === "web") return null;
  const hostMontado = deps.hostMontado ?? (() => useDialogoStore.getState().hostMontado);
  if (!hostMontado()) return null;
  const abrir = deps.dialogoImpl ?? abrirDialogo;
  return (botoes) =>
    abrir({ titulo: texto.titulo, mensagem: texto.mensagem, tipo: texto.tipo, selo: texto.selo, botoes });
}

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

  const comTipo = pelaCaixaComTipo(texto, deps, plataforma);
  if (comTipo) {
    // O indice 1 e o confirmar; o DialogoVupth mostra o primario em cima, mas
    // devolve sempre o indice da lista original.
    return comTipo([
      { texto: rotuloCancelar, estilo: "cancel" },
      { texto: rotuloOk, estilo: texto.destrutivo ? "destructive" : "default" },
    ]).then((i) => i === 1);
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

/**
 * `confirmar()` com um terceiro botao, "Saiba mais" (guia de texto curto): a
 * frase fica curta e a explicacao mora no Suporte. "Saiba mais" NAO confirma
 * nem cancela a acao: abre o link e a pergunta continua valendo (resolve
 * `false`, a pessoa fica onde estava e pode tocar de novo). Na web sem o shim
 * do Alert so cabem dois botoes: cai no `confirmar()` normal.
 */
export function confirmarComSaibaMais(
  texto: Texto,
  aoSaberMais: () => void,
  deps: Deps = {}
): Promise<boolean> {
  const plataforma = deps.plataforma ?? Platform.OS;
  if (plataforma === "web" && !alertWebInstalado()) return confirmar(texto, deps);

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<boolean>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: texto.cancelar ?? "Cancelar", style: "cancel", onPress: () => resolve(false) },
      {
        text: "Saiba mais",
        onPress: () => {
          aoSaberMais();
          resolve(false);
        },
      },
      { text: texto.confirmar ?? "Sim", onPress: () => resolve(true) },
    ]);
  });
}

// ---------------------------------------------------------------------------

type TextoAviso = {
  titulo: string;
  mensagem: string;
  /** Rotulo do botao unico (default "OK"). */
  ok?: string;
  /** Faixa + selo no DialogoVupth (ver `Texto.tipo`). */
  tipo?: TipoDeDialogo;
  selo?: string;
};

type DepsAviso = {
  plataforma?: typeof Platform.OS;
  alertImpl?: typeof Alert.alert;
  alertaWebImpl?: (texto: string) => void;
  dialogoImpl?: typeof abrirDialogo;
  hostMontado?: () => boolean;
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

  const comTipo = pelaCaixaComTipo(texto, deps, plataforma);
  if (comTipo) {
    return comTipo([{ texto: texto.ok ?? "OK", estilo: "default" }]).then(() => undefined);
  }

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<void>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: texto.ok ?? "OK", onPress: () => resolve() },
    ]);
  });
}

// ---------------------------------------------------------------------------

type Opcao<T> = { texto: string; valor: T; destrutivo?: boolean };

/**
 * Pergunta com MAIS de uma acao (alem do Cancelar) — ex.: a foto de perfil:
 * "Remover foto" / "Escolher outra". Devolve o `valor` escolhido, ou null.
 *
 * Pela mesma costura do `confirmar()`: no aparelho o DialogoVupth e, na web,
 * o shim desenham quantos botoes vierem. So a web SEM o shim cai no
 * `window.confirm` (dois botoes) — ai pergunta apenas a opcao principal, a
 * ULTIMA da lista (o padrao do iOS que o app segue).
 */
export function escolherOpcao<T>(
  texto: { titulo: string; mensagem: string; opcoes: Opcao<T>[] },
  deps: Deps = {}
): Promise<T | null> {
  const plataforma = deps.plataforma ?? Platform.OS;
  const principal = texto.opcoes[texto.opcoes.length - 1];

  if (plataforma === "web" && !alertWebInstalado()) {
    const confirmImpl =
      deps.confirmImpl ??
      ((t: string) => (typeof window !== "undefined" ? window.confirm(t) : false));
    try {
      const ok = confirmImpl(`${texto.titulo}\n\n${texto.mensagem}\n\n${principal.texto}?`) === true;
      return Promise.resolve(ok ? principal.valor : null);
    } catch {
      return Promise.resolve(null);
    }
  }

  const alertImpl = deps.alertImpl ?? Alert.alert;
  return new Promise<T | null>((resolve) => {
    alertImpl(texto.titulo, texto.mensagem, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
      ...texto.opcoes.map((o) => ({
        text: o.texto,
        style: (o.destrutivo ? "destructive" : "default") as "destructive" | "default",
        onPress: () => resolve(o.valor),
      })),
    ]);
  });
}
