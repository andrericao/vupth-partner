import { getPostLoginRoute, getRoleCardRoute } from "../routing";

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
