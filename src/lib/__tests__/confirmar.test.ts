import { confirmar } from "../confirmar";

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
