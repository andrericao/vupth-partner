import { resumirAtendimento, linhaDoResumo } from "../snapshotDiag";

// 🔴 IMPASSE DE UMA SEMANA (31/08 a 07/09): "nao existe botao de finalizar".
//
// O `ServingCard` mostra "Finalizar" SEMPRE — primeiro e cheio, sem condicional.
// Entao o botao nao sumiu: o CARD nao montou. E ele monta com uma condicao so,
// `current_attendance` preenchido no snapshot da fila.
//
// O que trava o diagnostico e que ninguem consegue ver esse payload: o QA roda
// em APK, onde DevTools nao existe e os logs sao gated por `__DEV__`. Este
// resumo e o que vai para o painel dos 7 toques — a resposta lida no aparelho.
//
// A pergunta que ele responde: o campo NAO VEM do backend, ou vem e alguem
// apaga? (o WS faz `setQueryData(snapshot)` sem merge — ele SUBSTITUI o que o
// GET trouxe).
describe("resumirAtendimento", () => {
  const comAtendimento = {
    professionals: [
      {
        id: "p1",
        current_attendance: { id: "a9", status: "IN_PROGRESS", clientName: "Ana" },
        waiting_list: [{ id: "w1" }, { id: "w2" }],
      },
      { id: "p2", current_attendance: null, waiting_list: [] },
    ],
  };

  it("le o atendimento do profissional certo, nao do primeiro da lista", () => {
    const r = resumirAtendimento(comAtendimento, "p1");

    expect(r.achouProfissional).toBe(true);
    expect(r.temAtendimento).toBe(true);
    expect(r.status).toBe("IN_PROGRESS");
    expect(r.cliente).toBe("Ana");
    expect(r.totalNaEspera).toBe(2);
  });

  it("distingue 'veio nulo' de 'nao achei o profissional' — sao defeitos diferentes", () => {
    const semAtendimento = resumirAtendimento(comAtendimento, "p2");
    expect(semAtendimento.achouProfissional).toBe(true);
    expect(semAtendimento.temAtendimento).toBe(false);
    expect(semAtendimento.status).toBeNull();

    const desconhecido = resumirAtendimento(comAtendimento, "p9");
    expect(desconhecido.achouProfissional).toBe(false);
    expect(desconhecido.temAtendimento).toBe(false);
  });

  it("o campo AUSENTE conta como nulo — e o caso que estamos cacando", () => {
    const semOCampo = { professionals: [{ id: "p1", waiting_list: [] }] };
    const r = resumirAtendimento(semOCampo, "p1");

    expect(r.achouProfissional).toBe(true);
    expect(r.temAtendimento).toBe(false);
    expect(r.status).toBeNull();
  });

  it("nao quebra com payload torto — diagnostico que crasha nao diagnostica", () => {
    for (const lixo of [null, undefined, {}, { professionals: null }, "texto", 42]) {
      const r = resumirAtendimento(lixo, "p1");
      expect(r.achouProfissional).toBe(false);
      expect(r.temAtendimento).toBe(false);
      expect(r.totalNaEspera).toBe(0);
    }
  });

  it("sem id de profissional nao chuta ninguem", () => {
    const r = resumirAtendimento(comAtendimento, null);
    expect(r.achouProfissional).toBe(false);
  });
});

describe("linhaDoResumo", () => {
  it("diz NULO em maiuscula quando o campo nao veio — e o achado que importa", () => {
    const linha = linhaDoResumo("WS", resumirAtendimento({ professionals: [{ id: "p1" }] }, "p1"));
    expect(linha).toContain("WS");
    expect(linha).toContain("NULO");
  });

  it("mostra status e cliente quando veio preenchido", () => {
    const r = resumirAtendimento(
      { professionals: [{ id: "p1", current_attendance: { status: "IN_PROGRESS", clientName: "Ana" } }] },
      "p1"
    );
    expect(linhaDoResumo("GET", r)).toBe("GET: IN_PROGRESS · Ana · espera 0");
  });

  it("separa 'nao estava na lista' das outras duas respostas", () => {
    expect(linhaDoResumo("GET", resumirAtendimento({}, "p1"))).toMatch(/não estava na lista/);
  });
});
