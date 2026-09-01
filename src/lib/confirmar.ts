import { Alert, Platform } from "react-native";

// Confirmacao que funciona NAS DUAS PLATAFORMAS.
//
// 🔴 Por que existe (issue #25, teste manual de 30/08 na web): "botao de remover
// servico nao funciona", "o botao de aceitar novos nao funciona". Nenhum dos
// dois estava quebrado — os dois pedem confirmacao com `Alert.alert(titulo, msg,
// [Cancelar, Confirmar])`, e o **react-native-web nao implementa o Alert com
// botoes**. A caixa nunca aparece, o callback nunca roda, e o toque parece nao
// ter efeito. E a pior forma de defeito: silenciosa, e so na web.
//
// No nativo continua o Alert de sempre. Na web cai no `window.confirm`, que e
// feio mas e real — e o que importa aqui e a acao acontecer, nao a caixa ser
// bonita. Uma caixa desenhada por nos seria melhor; ela custa uma tela nova em
// 22 lugares, e isso e trabalho de design, nao de correcao de bug.

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

  if (plataforma === "web") {
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
