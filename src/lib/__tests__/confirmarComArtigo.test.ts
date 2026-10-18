import { Linking } from "react-native";

import { SUPORTE_URL } from "@lib/suporte";
import { confirmarComArtigo } from "@lib/confirmarComArtigo";

type Botao = { text: string; style?: string; onPress: () => void };

// Toca nos botões na ordem dada, um por vez, a cada vez que a caixa aparece.
const alertQueToca = (...indices: number[]) => {
  let vez = 0;
  return jest.fn((_t: string, _m?: string, botoes?: Botao[]) => botoes![indices[vez++]].onPress());
};

describe("confirmarComArtigo()", () => {
  let abrir: jest.SpyInstance;
  beforeEach(() => {
    abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });
  afterEach(() => abrir.mockRestore());

  it("Cancelar é o 0, a ação é o 1 e o Saiba mais é o último (a bateria confirma pelo índice)", async () => {
    const alertImpl = alertQueToca(1);
    await confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "atraso" }, {
      plataforma: "android",
      alertImpl: alertImpl as never,
    });
    const botoes = alertImpl.mock.calls[0][2] as Botao[];
    expect(botoes.map((b) => b.text)).toEqual(["Cancelar", "Confirmar", "Saiba mais"]);
    expect(botoes[0].style).toBe("cancel");
  });

  it("usa os rótulos pedidos e marca a ação destrutiva", async () => {
    const alertImpl = alertQueToca(1);
    await confirmarComArtigo(
      { titulo: "t", mensagem: "m", confirmar: "Fechar", cancelar: "Agora não", destrutivo: true, artigo: "statusEFila" },
      { plataforma: "ios", alertImpl: alertImpl as never },
    );
    const botoes = alertImpl.mock.calls[0][2] as Botao[];
    expect(botoes.map((b) => b.text)).toEqual(["Agora não", "Fechar", "Saiba mais"]);
    expect(botoes[1].style).toBe("destructive");
  });

  it("a ação confirma; Cancelar não", async () => {
    await expect(
      confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "atraso" }, {
        plataforma: "ios",
        alertImpl: alertQueToca(1) as never,
      }),
    ).resolves.toBe(true);
    await expect(
      confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "atraso" }, {
        plataforma: "ios",
        alertImpl: alertQueToca(0) as never,
      }),
    ).resolves.toBe(false);
  });

  it("Saiba mais abre o artigo e repete a pergunta: a decisão continua valendo", async () => {
    const alertImpl = alertQueToca(2, 1);
    await expect(
      confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "atraso" }, {
        plataforma: "android",
        alertImpl: alertImpl as never,
      }),
    ).resolves.toBe(true);
    expect(abrir).toHaveBeenCalledWith(`${SUPORTE_URL}artigos/parceiro/atrasos.html`);
    expect(alertImpl).toHaveBeenCalledTimes(2);
  });

  it("depois do Saiba mais, Cancelar ainda cancela", async () => {
    await expect(
      confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "conta" }, {
        plataforma: "android",
        alertImpl: alertQueToca(2, 0) as never,
      }),
    ).resolves.toBe(false);
  });

  it("na web sem o shim do Alert só cabem dois botões: cai no confirmar() normal", async () => {
    await expect(
      confirmarComArtigo({ titulo: "t", mensagem: "m", artigo: "atraso" }, {
        plataforma: "web",
        confirmImpl: () => true,
      }),
    ).resolves.toBe(true);
    expect(abrir).not.toHaveBeenCalled();
  });
});
