import { Alert } from "react-native";

import { escolherOpcao, confirmar, avisar, confirmarComSaibaMais } from "../confirmar";

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

// O caminho que roda DE VERDADE no navegador: sem `confirmImpl`/`alertaWebImpl`
// injetados, `confirmar()` e `avisar()` caem nos impls padrao, que falam com o
// `window`. Todos os testes acima contornam esses dois por injecao — entao a
// unica coisa que o usuario da web executa de fato ficava descoberta.
describe("na WEB sem injecao — o impl padrao, que e o que o navegador roda", () => {
  const janela = globalThis as unknown as { window?: Record<string, unknown> };
  let confirmOriginal: unknown;
  let alertOriginal: unknown;

  beforeEach(() => {
    if (!janela.window) janela.window = {};
    confirmOriginal = janela.window.confirm;
    alertOriginal = janela.window.alert;
  });

  afterEach(() => {
    if (!janela.window) return;
    janela.window.confirm = confirmOriginal;
    janela.window.alert = alertOriginal;
  });

  it("chama o window.confirm do navegador, com titulo e mensagem juntos", async () => {
    const confirmDoNavegador = jest.fn(() => true);
    janela.window!.confirm = confirmDoNavegador;

    const ok = await confirmar(
      { titulo: "Fechar fila", mensagem: "Ninguem novo entra." },
      { plataforma: "web" }
    );

    expect(ok).toBe(true);
    expect(confirmDoNavegador).toHaveBeenCalledWith("Fechar fila\n\nNinguem novo entra.");
  });

  it("recusar no navegador NAO executa a acao", async () => {
    janela.window!.confirm = jest.fn(() => false);

    const ok = await confirmar(
      { titulo: "Desafiliar", mensagem: "Voce perde o vinculo." },
      { plataforma: "web" }
    );

    expect(ok).toBe(false);
  });

  it("avisar() chama o window.alert do navegador", async () => {
    const alertDoNavegador = jest.fn();
    janela.window!.alert = alertDoNavegador;

    await avisar({ titulo: "Tudo certo", mensagem: "Fila reaberta." }, { plataforma: "web" });

    expect(alertDoNavegador).toHaveBeenCalledWith("Tudo certo\n\nFila reaberta.");
  });
});

// A5 (07/09): com o SHIM instalado, a web deixa de cair no `window.confirm` e
// passa a usar o mesmo dialogo do nativo — mesmos botoes, mesmos rotulos. Duas
// caixas diferentes no mesmo app e divergencia que so aparece quando um usuario
// reclama.
describe("na WEB com o shim de Alert instalado", () => {
  const marcado = Alert as unknown as { __vupthWebAlert?: boolean };

  beforeEach(() => {
    marcado.__vupthWebAlert = true;
  });
  afterEach(() => {
    delete marcado.__vupthWebAlert;
  });

  it("confirmar() usa o Alert com os DOIS botoes, nao o window.confirm", async () => {
    const confirmImpl = jest.fn(() => true);
    const alert = jest.fn((_t, _m, botoes: any[]) => {
      botoes.find((b) => b.style !== "cancel")?.onPress?.();
    });

    const ok = await confirmar(
      { titulo: "Fechar fila", mensagem: "Ninguém novo entra.", confirmar: "Fechar" },
      { plataforma: "web", alertImpl: alert as any, confirmImpl }
    );

    expect(ok).toBe(true);
    expect(confirmImpl).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();
    // Os rotulos escolhidos chegam ao usuario — o window.confirm nao os mostrava.
    expect(alert.mock.calls[0][2].map((b: any) => b.text)).toEqual(["Cancelar", "Fechar"]);
  });

  it("avisar() tambem passa pelo Alert", async () => {
    const alertaWebImpl = jest.fn();
    const alert = jest.fn((_t, _m, botoes: any[]) => botoes[0].onPress?.());

    await avisar(
      { titulo: "Tudo certo", mensagem: "Fila reaberta." },
      { plataforma: "web", alertImpl: alert as any, alertaWebImpl }
    );

    expect(alertaWebImpl).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();
  });

  it("SEM o shim, o fallback do navegador continua valendo", async () => {
    delete marcado.__vupthWebAlert;
    const confirmImpl = jest.fn(() => true);

    await confirmar(
      { titulo: "Remover", mensagem: "Tem certeza?" },
      { plataforma: "web", confirmImpl }
    );

    expect(confirmImpl).toHaveBeenCalled();
  });
});

// Tres opcoes (ex.: foto de perfil — Cancelar / Remover / Escolher outra). O
// shim da web e o DialogoVupth desenham quantos botoes vierem; so a web SEM o
// shim (window.confirm, dois botoes) degrada para a opcao principal.
describe("escolherOpcao()", () => {
  const opcoes = [
    { texto: "Remover foto", valor: "remover" as const, destrutivo: true },
    { texto: "Escolher outra", valor: "escolher" as const },
  ];

  it("no aparelho: um botao por opcao + Cancelar, e devolve a escolhida", async () => {
    const alertImpl = jest.fn((_t: string, _m?: string, botoes?: any[]) => botoes![2].onPress());
    const r = await escolherOpcao({ titulo: "Foto", mensagem: "m", opcoes }, { plataforma: "android", alertImpl });
    expect(r).toBe("escolher");
    const botoes = alertImpl.mock.calls[0][2]!;
    expect(botoes.map((b: any) => b.text)).toEqual(["Cancelar", "Remover foto", "Escolher outra"]);
    expect(botoes[1].style).toBe("destructive");
  });

  it("Cancelar devolve null", async () => {
    const alertImpl = jest.fn((_t: string, _m?: string, botoes?: any[]) => botoes![0].onPress());
    const r = await escolherOpcao({ titulo: "Foto", mensagem: "m", opcoes }, { plataforma: "ios", alertImpl });
    expect(r).toBeNull();
  });

  it("web sem o shim: pergunta so a opcao principal (a ultima)", async () => {
    const confirmImpl = jest.fn((_t: string) => true);
    const r = await escolherOpcao({ titulo: "Foto", mensagem: "m", opcoes }, { plataforma: "web", confirmImpl });
    expect(r).toBe("escolher");
    expect(confirmImpl.mock.calls[0][0]).toContain("Escolher outra");
  });

  it("web sem o shim, caixa bloqueada: null (na duvida, nao age)", async () => {
    const r = await escolherOpcao(
      { titulo: "Foto", mensagem: "m", opcoes },
      {
        plataforma: "web",
        confirmImpl: () => {
          throw new Error("bloqueado");
        },
      }
    );
    expect(r).toBeNull();
  });

  it("web sem o shim e sem confirmImpl: usa o window.confirm", async () => {
    const original = window.confirm;
    window.confirm = jest.fn(() => true);
    try {
      const r = await escolherOpcao({ titulo: "Foto", mensagem: "m", opcoes }, { plataforma: "web" });
      expect(r).toBe("escolher");
    } finally {
      window.confirm = original;
    }
  });

  it("web sem o shim, recusado: null", async () => {
    const r = await escolherOpcao(
      { titulo: "Foto", mensagem: "m", opcoes },
      { plataforma: "web", confirmImpl: () => false }
    );
    expect(r).toBeNull();
  });
});

// cobertura-98 (Andre, 08/10): os padroes — sem deps, a plataforma e o Alert do
// react-native; na web sem shim e sem confirmImpl, o window.confirm/alert do
// navegador (ou "nao" quando nao ha window).
describe("os padroes de confirmar, avisar e escolherOpcao", () => {
  const g = globalThis as any;
  let janelaAntes: unknown;
  beforeEach(() => {
    janelaAntes = g.window;
  });
  afterEach(() => {
    g.window = janelaAntes;
    jest.restoreAllMocks();
  });

  it("sem deps, usa o Alert do react-native (e o destrutivo pinta o botao)", async () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, botoes: any) => {
      expect(botoes[1].style).toBe("destructive");
      botoes[1].onPress();
    });
    await expect(confirmar({ titulo: "t", mensagem: "m", destrutivo: true })).resolves.toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it("avisar e escolherOpcao sem deps tambem usam o Alert", async () => {
    jest.spyOn(Alert, "alert").mockImplementation((_t, _m, botoes: any) => {
      botoes[botoes.length - 1].onPress();
    });
    await expect(avisar({ titulo: "t", mensagem: "m" })).resolves.toBeUndefined();
    await expect(
      escolherOpcao({ titulo: "t", mensagem: "m", opcoes: [{ texto: "A", valor: 1 }] })
    ).resolves.toBe(1);
  });

  it("na web sem shim, cai no window do navegador", async () => {
    g.window = { confirm: jest.fn(() => true), alert: jest.fn() };
    await expect(confirmar({ titulo: "t", mensagem: "m" }, { plataforma: "web" })).resolves.toBe(true);
    await avisar({ titulo: "t", mensagem: "m" }, { plataforma: "web" });
    expect(g.window.alert).toHaveBeenCalled();
    await expect(
      escolherOpcao({ titulo: "t", mensagem: "m", opcoes: [{ texto: "A", valor: 1 }] }, { plataforma: "web" })
    ).resolves.toBe(1);
  });

  it("na web sem window, na duvida nao executa (e o aviso segue)", async () => {
    g.window = undefined;
    await expect(confirmar({ titulo: "t", mensagem: "m" }, { plataforma: "web" })).resolves.toBe(false);
    await expect(avisar({ titulo: "t", mensagem: "m" }, { plataforma: "web" })).resolves.toBeUndefined();
    await expect(
      escolherOpcao({ titulo: "t", mensagem: "m", opcoes: [{ texto: "A", valor: 1 }] }, { plataforma: "web" })
    ).resolves.toBeNull();
  });
});

describe("confirmarComSaibaMais()", () => {
  const alertQueToca = (indice: number) =>
    jest.fn((_t: string, _m?: string, botoes?: any[]) => botoes![indice].onPress());

  it("tem Cancelar, Saiba mais e Sim, nessa ordem", async () => {
    const alertImpl = alertQueToca(2);
    await confirmarComSaibaMais({ titulo: "t", mensagem: "m", confirmar: "Sim" }, jest.fn(), {
      plataforma: "android",
      alertImpl: alertImpl as any,
    });
    const rotulos = (alertImpl.mock.calls[0][2] as any[]).map((b) => b.text);
    expect(rotulos).toEqual(["Cancelar", "Saiba mais", "Sim"]);
  });

  it("Sim confirma", async () => {
    await expect(
      confirmarComSaibaMais({ titulo: "t", mensagem: "m" }, jest.fn(), {
        plataforma: "ios",
        alertImpl: alertQueToca(2) as any,
      })
    ).resolves.toBe(true);
  });

  it("Cancelar nao confirma", async () => {
    await expect(
      confirmarComSaibaMais({ titulo: "t", mensagem: "m" }, jest.fn(), {
        plataforma: "ios",
        alertImpl: alertQueToca(0) as any,
      })
    ).resolves.toBe(false);
  });

  it("Saiba mais abre o link e NAO confirma", async () => {
    const aoSaberMais = jest.fn();
    await expect(
      confirmarComSaibaMais({ titulo: "t", mensagem: "m" }, aoSaberMais, {
        plataforma: "android",
        alertImpl: alertQueToca(1) as any,
      })
    ).resolves.toBe(false);
    expect(aoSaberMais).toHaveBeenCalledTimes(1);
  });

  it("na web sem shim cai no confirmar() de dois botoes", async () => {
    await expect(
      confirmarComSaibaMais({ titulo: "t", mensagem: "m" }, jest.fn(), {
        plataforma: "web",
        confirmImpl: () => true,
      })
    ).resolves.toBe(true);
  });
});
