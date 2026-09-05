import { confirmar, avisar } from "../confirmar";

// 🔴 DEFEITO REAL (issue #25, teste manual de 30/08): "botao de remover servico
// nao funciona" e "o botao de aceitar novos nao funciona" — os dois na WEB.
//
// Nenhum dos dois estava quebrado. Os dois pedem confirmacao com
// `Alert.alert(titulo, msg, [Cancelar, Confirmar])`, e o **react-native-web nao
// implementa o Alert com botoes**: a caixa nunca aparece, o callback nunca roda,
// e o toque parece nao ter efeito. Sao 22 chamadas assim no app.
describe("confirmar()", () => {
  it("no NATIVO usa o Alert e resolve true quando o usuario confirma", async () => {
    const alert = jest.fn((_t, _m, botoes: any[]) => {
      botoes.find((b) => b.style !== "cancel")?.onPress?.();
    });

    const ok = await confirmar(
      { titulo: "Fechar fila", mensagem: "Ninguem novo entra." },
      { plataforma: "ios", alertImpl: alert as any }
    );

    expect(ok).toBe(true);
    expect(alert).toHaveBeenCalled();
  });

  it("no NATIVO resolve false quando o usuario cancela", async () => {
    const alert = jest.fn((_t, _m, botoes: any[]) => {
      botoes.find((b) => b.style === "cancel")?.onPress?.();
    });

    const ok = await confirmar(
      { titulo: "Remover", mensagem: "Tem certeza?" },
      { plataforma: "android", alertImpl: alert as any }
    );

    expect(ok).toBe(false);
  });

  it("na WEB nao chama o Alert — ele nao existe la", async () => {
    const alert = jest.fn();
    const confirmImpl = jest.fn(() => true);

    const ok = await confirmar(
      { titulo: "Fechar fila", mensagem: "Ninguem novo entra." },
      { plataforma: "web", alertImpl: alert as any, confirmImpl }
    );

    expect(ok).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(confirmImpl).toHaveBeenCalled();
  });

  it("na WEB o texto do titulo E o da mensagem chegam ao usuario", () => {
    // A caixa nativa tem duas linhas; a do navegador tem uma so. Perder o
    // titulo deixaria "Tem certeza?" sem dizer certeza do que.
    const confirmImpl = jest.fn((_texto: string) => false);

    confirmar(
      { titulo: "Remover servico", mensagem: "Isso apaga o corte da sua lista." },
      { plataforma: "web", confirmImpl }
    );

    const texto = confirmImpl.mock.calls[0][0];
    expect(texto).toContain("Remover servico");
    expect(texto).toContain("Isso apaga o corte da sua lista.");
  });

  it("na WEB, recusar resolve false", async () => {
    const ok = await confirmar(
      { titulo: "x", mensagem: "y" },
      { plataforma: "web", confirmImpl: () => false }
    );
    expect(ok).toBe(false);
  });

  it("se o navegador bloquear o confirm, NAO executa a acao", async () => {
    // Alguns contextos (iframe com sandbox, bloqueador) fazem o confirm lancar
    // ou devolver undefined. Diante da duvida, a acao destrutiva nao acontece.
    const ok = await confirmar(
      { titulo: "x", mensagem: "y" },
      {
        plataforma: "web",
        confirmImpl: () => {
          throw new Error("blocked");
        },
      }
    );
    expect(ok).toBe(false);
  });
});

describe("avisar()", () => {
  // 🔴 O IRMAO PIOR DO confirmar(): 11 chamadas do app sao
  // `Alert.alert(titulo, msg, [{ text: "OK", onPress: () => router.replace(...) }])`.
  // Na web a caixa nao aparece, entao o onPress NUNCA roda — e a acao JA
  // ACONTECEU. O profissional envia a solicitacao de afiliacao e continua na
  // mesma tela (e envia de novo); o servico e criado e a tela nao fecha (e ele
  // cria duplicado); a senha e redefinida e o usuario fica preso.
  //
  // Diferenca de contrato em relacao ao confirmar(): aqui, se algo der errado
  // na caixa, o fluxo SEGUE. A acao ja foi feita — bloquear a navegacao seria
  // repetir o defeito que estamos consertando.
  it("no NATIVO usa o Alert e so resolve quando o usuario reconhece", async () => {
    let liberado = false;
    const alert = jest.fn((_t, _m, botoes: any[]) => {
      botoes[0].onPress?.();
    });

    await avisar(
      { titulo: "Serviço adicionado", mensagem: "Corte — R$ 40,00" },
      { plataforma: "android", alertImpl: alert as any }
    ).then(() => {
      liberado = true;
    });

    expect(alert).toHaveBeenCalled();
    expect(liberado).toBe(true);
  });

  it("na WEB nao chama o Alert e mostra titulo + mensagem", async () => {
    const alert = jest.fn();
    const alertaWeb = jest.fn((_texto: string) => undefined);

    await avisar(
      { titulo: "Senha alterada", mensagem: "Entre com a senha nova." },
      { plataforma: "web", alertImpl: alert as any, alertaWebImpl: alertaWeb }
    );

    expect(alert).not.toHaveBeenCalled();
    const texto = alertaWeb.mock.calls[0][0];
    expect(texto).toContain("Senha alterada");
    expect(texto).toContain("Entre com a senha nova.");
  });

  it("se o navegador bloquear a caixa, o fluxo SEGUE assim mesmo", async () => {
    // Este e o oposto do confirmar(): la, na duvida, nao age. Aqui a acao ja
    // aconteceu — segurar a navegacao deixaria o usuario preso, que e o bug.
    await expect(
      avisar(
        { titulo: "x", mensagem: "y" },
        {
          plataforma: "web",
          alertaWebImpl: () => {
            throw new Error("blocked");
          },
        }
      )
    ).resolves.toBeUndefined();
  });
});
