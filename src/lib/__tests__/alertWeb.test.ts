import {
  normalizarBotoes,
  desenharAlertWeb,
  instalarAlertWeb,
  alertWebInstalado,
} from "../alertWeb";

// 🔴 A5, reportado pelo Front-Client em 07/09: `Alert.alert` do React Native
// NAO E IMPLEMENTADO no react-native-web. Nao falha, nao loga, nao pinta nada.
// Sao 100 chamadas em 29 arquivos aqui — erros de formulario, "senha
// incorreta", o motivo de uma acao recusada. No navegador o usuario clica e
// nada acontece.
//
// Foi exatamente isso ao tentar FINALIZAR um corte: o handleAction faz
// `Alert.alert("Erro", getApiErrorMessage(...))`. O codigo esta certo; o
// navegador e que nao desenha. Com o S36 em pe, a acao e recusada E o motivo e
// invisivel.
//
// A saida e um SHIM: trocar o metodo no objeto que o `react-native` exporta.
// Isso pega as 100 chamadas sem tocar em nenhuma — e as futuras tambem.
const docFalso = () => {
  const criados: any[] = [];
  const criar = (tag: string) => {
    const no: any = {
      tag,
      style: {},
      filhos: [] as any[],
      ouvintes: {} as Record<string, () => void>,
      textContent: "",
      appendChild(f: any) {
        no.filhos.push(f);
        return f;
      },
      addEventListener(evento: string, fn: () => void) {
        no.ouvintes[evento] = fn;
      },
      setAttribute() {},
      focus() {
        no.focado = true;
      },
    };
    criados.push(no);
    return no;
  };
  const body = {
    filhos: [] as any[],
    appendChild(n: any) {
      body.filhos.push(n);
    },
    removeChild(n: any) {
      body.filhos = body.filhos.filter((x) => x !== n);
    },
  };
  return { createElement: criar, body, criados };
};

const botoesDesenhados = (doc: ReturnType<typeof docFalso>) =>
  doc.criados.filter((n) => n.tag === "button");

const textos = (doc: ReturnType<typeof docFalso>) =>
  doc.criados.map((n) => n.textContent).join(" | ");

describe("normalizarBotoes", () => {
  it("sem botoes vira um OK — Alert.alert(titulo, msg) e a chamada mais comum", () => {
    expect(normalizarBotoes()).toEqual([{ text: "OK", style: "default" }]);
    expect(normalizarBotoes([])).toEqual([{ text: "OK", style: "default" }]);
  });

  it("preserva rotulo e callback de cada botao", () => {
    const onPress = jest.fn();
    const [b] = normalizarBotoes([{ text: "Finalizar", onPress }]);

    expect(b.text).toBe("Finalizar");
    b.onPress?.();
    expect(onPress).toHaveBeenCalled();
  });

  it("cancelar vem primeiro — a acao que confirma fica na direita, como no nativo", () => {
    const ordem = normalizarBotoes([
      { text: "Excluir", style: "destructive" },
      { text: "Voltar", style: "cancel" },
    ]).map((b) => b.text);

    expect(ordem).toEqual(["Voltar", "Excluir"]);
  });
});

describe("desenharAlertWeb", () => {
  it("monta a caixa no body, com titulo e mensagem", () => {
    const doc = docFalso();
    desenharAlertWeb(doc as any, "Erro", "Senha incorreta");

    expect(doc.body.filhos).toHaveLength(1);
    expect(textos(doc)).toContain("Erro");
    expect(textos(doc)).toContain("Senha incorreta");
  });

  it("o clique chama o onPress do botao e FECHA a caixa", () => {
    const doc = docFalso();
    const onPress = jest.fn();
    desenharAlertWeb(doc as any, "Remover", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", onPress, style: "destructive" },
    ]);

    const [cancelar, remover] = botoesDesenhados(doc);
    expect(cancelar.textContent).toBe("Cancelar");

    remover.ouvintes.click();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(doc.body.filhos).toHaveLength(0);
  });

  it("botao sem onPress apenas fecha — nao pode explodir", () => {
    const doc = docFalso();
    desenharAlertWeb(doc as any, "Pronto", "Serviço criado");

    expect(() => botoesDesenhados(doc)[0].ouvintes.click()).not.toThrow();
    expect(doc.body.filhos).toHaveLength(0);
  });

  it("mensagem ausente nao vira 'undefined' na tela", () => {
    const doc = docFalso();
    desenharAlertWeb(doc as any, "Só o título");

    expect(textos(doc)).not.toContain("undefined");
  });
});

describe("instalarAlertWeb", () => {
  it("no NATIVO nao instala nada — la o Alert ja funciona", () => {
    const alvo = { alert: jest.fn() };
    const instalou = instalarAlertWeb({ plataforma: "ios", alvo: alvo as any, doc: docFalso() as any });

    expect(instalou).toBe(false);
    expect(alertWebInstalado(alvo as any)).toBe(false);
  });

  it("sem document nao instala — e nao quebra o boot", () => {
    const alvo = { alert: jest.fn() };
    expect(instalarAlertWeb({ plataforma: "web", alvo: alvo as any, doc: null })).toBe(false);
  });

  it("na WEB troca o metodo: as 100 chamadas existentes passam a desenhar", () => {
    const doc = docFalso();
    const alvo = { alert: jest.fn() };

    expect(instalarAlertWeb({ plataforma: "web", alvo: alvo as any, doc: doc as any })).toBe(true);
    expect(alertWebInstalado(alvo as any)).toBe(true);

    // A chamada de sempre, sem nenhuma mudanca no ponto de uso.
    alvo.alert("Erro", "Não foi possível finalizar");

    expect(doc.body.filhos).toHaveLength(1);
    expect(textos(doc)).toContain("Não foi possível finalizar");
  });

  it("instalar duas vezes nao empilha patch sobre patch", () => {
    const doc = docFalso();
    const alvo = { alert: jest.fn() };
    instalarAlertWeb({ plataforma: "web", alvo: alvo as any, doc: doc as any });
    const primeiro = alvo.alert;
    instalarAlertWeb({ plataforma: "web", alvo: alvo as any, doc: doc as any });

    expect(alvo.alert).toBe(primeiro);
  });
});
