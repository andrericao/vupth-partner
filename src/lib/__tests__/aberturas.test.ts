import {
  JANELA_MS,
  LIMITE_QUEDAS,
  aberturaEstavel,
  aguardarAbertura,
  decidirAbertura,
  emModoSeguro,
  iniciarAbertura,
  lerMarca,
  useModoSeguro,
  type Armazem,
} from "../aberturas";

function armazemEmMemoria(inicial: string | null = null): Armazem & { valor: () => string | null } {
  let v = inicial;
  return {
    getItemAsync: async () => v,
    setItemAsync: async (_k, novo) => {
      v = novo;
    },
    valor: () => v,
  };
}

describe("aberturas", () => {
  beforeEach(() => useModoSeguro.getState().reset());

  it("limites combinados", () => {
    expect(LIMITE_QUEDAS).toBe(2);
    expect(JANELA_MS).toBe(15000);
  });

  it("primeira abertura e abertura anterior estavel: sem quedas", () => {
    expect(decidirAbertura(null)).toEqual({ quedas: 0, modoSeguro: false });
    expect(decidirAbertura({ abrindo: false, quedas: 5 })).toEqual({ quedas: 0, modoSeguro: false });
  });

  it("uma queda seguida ainda abre normal; duas, em modo seguro", () => {
    expect(decidirAbertura({ abrindo: true, quedas: 0 })).toEqual({ quedas: 1, modoSeguro: false });
    expect(decidirAbertura({ abrindo: true, quedas: 1 })).toEqual({ quedas: 2, modoSeguro: true });
  });

  it("marca ilegivel vira 'sem marca'", () => {
    expect(lerMarca("{ruim")).toBeNull();
    expect(lerMarca(null)).toBeNull();
    expect(lerMarca('{"abrindo":true}')).toEqual({ abrindo: true, quedas: 0 });
  });

  it("laco de queda: duas aberturas que caem sobem em modo seguro e registram o motivo", async () => {
    const a = armazemEmMemoria();
    const motivos: number[] = [];
    await iniciarAbertura(a, (r) => motivos.push(r.quedas)); // abre e cai (nunca chega a estavel)
    expect(emModoSeguro()).toBe(false);
    await iniciarAbertura(a, (r) => motivos.push(r.quedas)); // 1a queda
    expect(emModoSeguro()).toBe(false);
    await iniciarAbertura(a, (r) => motivos.push(r.quedas)); // 2a queda seguida
    expect(emModoSeguro()).toBe(true);
    expect(motivos).toEqual([1, 2]);
  });

  it("saida do modo seguro: abertura estavel zera as quedas", async () => {
    const a = armazemEmMemoria(JSON.stringify({ abrindo: true, quedas: 1 }));
    await iniciarAbertura(a);
    expect(emModoSeguro()).toBe(true);
    await aberturaEstavel(a);
    expect(JSON.parse(a.valor() as string)).toEqual({ abrindo: false, quedas: 0 });
    await iniciarAbertura(a);
    expect(emModoSeguro()).toBe(false);
  });

  it("aguardarAbertura so resolve depois da leitura da marca", async () => {
    const a = armazemEmMemoria(JSON.stringify({ abrindo: true, quedas: 1 }));
    void iniciarAbertura(a);
    await aguardarAbertura();
    expect(emModoSeguro()).toBe(true);
  });

  it("armazenamento que falha nunca derruba a abertura", async () => {
    const quebrado: Armazem = {
      getItemAsync: async () => {
        throw new Error("sem secure-store");
      },
      setItemAsync: async () => {
        throw new Error("sem secure-store");
      },
    };
    await expect(iniciarAbertura(quebrado)).resolves.toEqual({ quedas: 0, modoSeguro: false });
    await expect(aberturaEstavel(quebrado)).resolves.toBeUndefined();
    expect(emModoSeguro()).toBe(false);
  });
});
