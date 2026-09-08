import { finalizarAtendimento } from "../finalizar";

// 🔴 O LAÇO QUE BLOQUEIA O MVP, na descrição dele (30/08, 07/09 e 08/09):
// "só aparece a opção de pausar, quando pausado não se pode finalizar porque o
// status não permite, só pode ser terminado o serviço em progresso e ficamos
// nesse ciclo".
//
// O backend recusa finalizar o que está PAUSADO (S36) — e isso está registrado
// como decisão deles, não como defeito. Então o front tem que fazer o caminho
// completo: quem pausou e quer encerrar precisa RETOMAR antes, e não faz sentido
// exigir que a pessoa descubra isso sozinha, clicando num botão que é recusado.
describe("finalizarAtendimento", () => {
  it("em andamento: finaliza direto", async () => {
    const retomar = jest.fn();
    const finalizar = jest.fn();

    await finalizarAtendimento("a1", false, { retomar, finalizar });

    expect(retomar).not.toHaveBeenCalled();
    expect(finalizar).toHaveBeenCalledWith("a1");
  });

  it("PAUSADO: retoma e só então finaliza — o laço morre aqui", async () => {
    const ordem: string[] = [];
    const retomar = jest.fn(async () => void ordem.push("retomar"));
    const finalizar = jest.fn(async () => void ordem.push("finalizar"));

    await finalizarAtendimento("a1", true, { retomar, finalizar });

    expect(ordem).toEqual(["retomar", "finalizar"]);
  });

  it("se o retomar falhar, NAO finaliza — senao o erro viraria dois", async () => {
    const retomar = jest.fn(async () => {
      throw new Error("falhou");
    });
    const finalizar = jest.fn();

    await expect(finalizarAtendimento("a1", true, { retomar, finalizar })).rejects.toThrow();
    expect(finalizar).not.toHaveBeenCalled();
  });
})
