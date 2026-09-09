import {
  getPostLoginRoute,
  getRoleCardRoute,
  getPrimeiroCaminhoDoDono,
  rotaDeVoltaDosDados,
} from "../routing";

describe("getPostLoginRoute", () => {
  it("routes CLIENT to owner onboarding (needs to create establishment)", () => {
    expect(getPostLoginRoute(["CLIENT"], "owner")).toBe(
      "/(owner)/onboarding/establishment"
    );
  });

  it("routes CLIENT+OWNER to owner dashboard", () => {
    expect(getPostLoginRoute(["CLIENT", "OWNER"])).toBe("/(owner)/dashboard");
  });

  it("routes CLIENT to professional onboarding when role=professional", () => {
    expect(getPostLoginRoute(["CLIENT"], "professional")).toBe(
      "/(professional)/onboarding"
    );
  });

  it("routes CLIENT+PROFESSIONAL to professional queue", () => {
    expect(getPostLoginRoute(["CLIENT", "PROFESSIONAL"])).toBe(
      "/(professional)/queue"
    );
  });

  it("routes CLIENT+OWNER+PROFESSIONAL to owner dashboard (owner takes priority)", () => {
    expect(
      getPostLoginRoute(["CLIENT", "OWNER", "PROFESSIONAL"])
    ).toBe("/(owner)/dashboard");
  });

  it("routes plain CLIENT without intent to role choice screen", () => {
    expect(getPostLoginRoute(["CLIENT"])).toBe("/(auth)");
  });
});

// O CICLO (2026-08-24): quem tinha conta so de CLIENT tocava "Ja tem conta?
// Entrar", logava, e caia de volta na tela de escolha de papel — pra sempre.
// A tela mandava TODO cartao pro cadastro, entao nao havia saida pra quem ja
// tinha conta. Papel se ganha criando a entidade, nao criando conta.
describe("getRoleCardRoute — o cartao da tela de entrada", () => {
  it("sem conta: manda cadastrar, preservando o papel escolhido", () => {
    expect(getRoleCardRoute(false, "owner")).toBe("/(auth)/register?role=owner");
    expect(getRoleCardRoute(false, "professional")).toBe(
      "/(auth)/register?role=professional"
    );
  });

  it("JA logado: pula o cadastro e vai criar a entidade que da o papel", () => {
    expect(getRoleCardRoute(true, "owner")).toBe("/(owner)/onboarding/establishment");
    expect(getRoleCardRoute(true, "professional")).toBe("/(professional)/onboarding");
  });

  it("logado NUNCA e mandado pro cadastro — era o que fechava o ciclo", () => {
    for (const role of ["owner", "professional"] as const) {
      expect(getRoleCardRoute(true, role)).not.toContain("register");
      expect(getRoleCardRoute(true, role)).not.toBe("/(auth)");
    }
  });

  it("o destino de quem ja e logado bate com o que o pos-login usa na mesma intencao", () => {
    // As duas portas pro mesmo lugar nao podem divergir: o cartao e o
    // `?role=` do login tem de terminar no mesmo onboarding.
    expect(getRoleCardRoute(true, "owner")).toBe(getPostLoginRoute(["CLIENT"], "owner"));
    expect(getRoleCardRoute(true, "professional")).toBe(
      getPostLoginRoute(["CLIENT"], "professional")
    );
  });
});

// 🔴 DEFEITO REAL (teste de device, 06/09): o dono que JA acumulou o perfil
// profissional entrava em "Profissionais" e via so duas opcoes — "Convidar" e
// "Ver solicitacoes" —, as duas dependendo de OUTRA pessoa. Ficava sem porta
// para o proprio servico, justo o que faltava para a loja abrir.
//
// A causa nao era "falta um card": o primeiro card tinha so o ramo FALSO. Ele
// vivia atras de `!isProfessional` e simplesmente sumia quando a condicao
// virava — em vez de mudar de papel.
describe("getPrimeiroCaminhoDoDono", () => {
  it("quem AINDA NAO e profissional recebe o convite a virar um", () => {
    const caminho = getPrimeiroCaminhoDoDono(false);

    expect(caminho.testID).toBe("path-me");
    expect(caminho.title).toMatch(/atender/i);
    // Sem rota: a escolha abre o formulario ali mesmo, na propria tela.
    expect(caminho.rota).toBeUndefined();
  });

  it("quem JA e profissional recebe a porta para os proprios servicos", () => {
    const caminho = getPrimeiroCaminhoDoDono(true);

    expect(caminho.testID).toBe("path-my-services");
    expect(caminho.title).toMatch(/servi/i);
    expect(caminho.rota).toBe("/(professional)/my-services?from=settings");
  });

  it("o slot NUNCA fica vazio — era esse o defeito", () => {
    for (const isProfessional of [true, false]) {
      const caminho = getPrimeiroCaminhoDoDono(isProfessional);
      expect(caminho.title.length).toBeGreaterThan(0);
      expect(caminho.hint.length).toBeGreaterThan(0);
    }
  });

  it("os dois estados sao distinguiveis por testID", () => {
    expect(getPrimeiroCaminhoDoDono(true).testID).not.toBe(
      getPrimeiroCaminhoDoDono(false).testID
    );
  });
});

// Teste de device, 07/09: "ao clicar em adicionar servico ele deve receber uma
// notificacao de que ira para a area do profissional, e os botoes de troca
// devem ser apresentados a ele".
describe("getPrimeiroCaminhoDoDono — o aviso de troca de contexto", () => {
  it("quem vai navegar leva aviso; quem age na propria tela, nao", () => {
    expect(getPrimeiroCaminhoDoDono(true).aviso).toBeDefined();
    expect(getPrimeiroCaminhoDoDono(false).aviso).toBeUndefined();
  });

  it("o aviso ensina os DOIS caminhos de volta, com os rotulos que existem na tela", () => {
    const aviso = getPrimeiroCaminhoDoDono(true).aviso!;

    expect(aviso.mensagem).toContain("Área do dono");
    expect(aviso.mensagem).toContain("Atender como profissional");
  });

  it("o aviso diz para ONDE se esta indo, nao so que algo vai acontecer", () => {
    expect(getPrimeiroCaminhoDoDono(true).aviso!.titulo).toMatch(/profissional/i);
  });
});

describe("rotaDeVoltaDosDados", () => {
  it("quem veio do menu do dono volta para o menu do dono", () => {
    expect(rotaDeVoltaDosDados("owner")).toBe("/(owner)/menu");
  });

  it("sem origem declarada, volta para as Configuracoes do profissional", () => {
    // O caminho antigo e o default: a tela nasceu la, e todo link existente
    // continua funcionando sem passar parametro nenhum.
    expect(rotaDeVoltaDosDados()).toBe("/(professional)/settings");
    expect(rotaDeVoltaDosDados(null)).toBe("/(professional)/settings");
  });
});
