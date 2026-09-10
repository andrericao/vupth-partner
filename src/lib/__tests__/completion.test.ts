import {
  ownerCompletion,
  professionalCompletion,
  hasBasicPending,
  hasAnyPending,
  OwnerCompletionInput,
  ProfessionalCompletionInput,
  lojaPendenteParaProfissional,
} from "../completion";

const ownerAllFalse: OwnerCompletionInput = {
  hasName: false,
  hasServiceType: false,
  hasAddress: false,
  hasHours: false,
  hasProfessionalWithService: false,
  hasPhone: false,
  hasInstagram: false,
};

const proAllFalse: ProfessionalCompletionInput = {
  isAffiliated: false,
  hasService: false,
  hasNickname: false,
  hasSpecialty: false,
};

describe("ownerCompletion", () => {
  it("basic tem 5 itens (SEM 'abrir', que e cotidiano) e profile tem 2", () => {
    const c = ownerCompletion(ownerAllFalse);
    expect(c.basic.total).toBe(5);
    expect(c.profile.total).toBe(2);
  });

  it("'abrir estabelecimento' NAO e item do checklist", () => {
    const keys = ownerCompletion(ownerAllFalse).basic.items.map((i) => i.key);
    expect(keys).not.toContain("open");
  });

  it("tudo falso => 0% e pending = total", () => {
    const c = ownerCompletion(ownerAllFalse);
    expect(c.basic.percent).toBe(0);
    expect(c.basic.done).toBe(0);
    expect(c.basic.pending).toBe(5);
    expect(c.profile.percent).toBe(0);
  });

  it("cadastro todo preenchido => básico 100% (independe da lojá estár aberta)", () => {
    const c = ownerCompletion({
      hasName: true,
      hasServiceType: true,
      hasAddress: true,
      hasHours: true,
      hasProfessionalWithService: true,
      hasPhone: true,
      hasInstagram: true,
    });
    expect(c.basic.percent).toBe(100);
    expect(c.basic.pending).toBe(0);
    expect(c.profile.percent).toBe(100);
  });

  it("arredonda o percentual (4 de 5 = 80%)", () => {
    const c = ownerCompletion({
      ...ownerAllFalse,
      hasName: true,
      hasServiceType: true,
      hasAddress: true,
      hasHours: true,
    });
    expect(c.basic.done).toBe(4);
    expect(c.basic.percent).toBe(80);
  });

  it("basic e profile sao independentes (profile pode adiantar o básico)", () => {
    const c = ownerCompletion({ ...ownerAllFalse, hasPhone: true, hasInstagram: true });
    expect(c.basic.percent).toBe(0);
    expect(c.profile.percent).toBe(100);
  });

  it("cada item carrega key, label e done", () => {
    const c = ownerCompletion(ownerAllFalse);
    const keys = c.basic.items.map((i) => i.key);
    expect(keys).toContain("hours");
    expect(keys).toContain("professionalWithService");
    expect(c.basic.items[0]).toHaveProperty("label");
    expect(c.basic.items[0]).toHaveProperty("done", false);
  });
});

describe("professionalCompletion", () => {
  it("basic tem 2 itens (SEM 'loja aberta', que e cotidiano do dono) e profile tem 2", () => {
    const c = professionalCompletion(proAllFalse);
    expect(c.basic.total).toBe(2);
    expect(c.profile.total).toBe(2);
  });

  it("'estabelecimento aberto' NAO e item do checklist", () => {
    const keys = professionalCompletion(proAllFalse).basic.items.map((i) => i.key);
    expect(keys).not.toContain("establishmentReady");
  });

  it("vinculado + serviço => básico 100%", () => {
    const c = professionalCompletion({
      ...proAllFalse,
      isAffiliated: true,
      hasService: true,
    });
    expect(c.basic.percent).toBe(100);
  });

  it("só vinculado => 50% (1 de 2)", () => {
    const c = professionalCompletion({ ...proAllFalse, isAffiliated: true });
    expect(c.basic.done).toBe(1);
    expect(c.basic.percent).toBe(50);
  });

  it("apelido + especialidade => perfil 100%", () => {
    const c = professionalCompletion({ ...proAllFalse, hasNickname: true, hasSpecialty: true });
    expect(c.profile.percent).toBe(100);
  });
});

describe("hasBasicPending (faixa)", () => {
  it("ha pendência basica => true", () => {
    expect(hasBasicPending(ownerCompletion(ownerAllFalse))).toBe(true);
  });

  it("básico 100% => false, mesmo com perfil pendente", () => {
    const c = ownerCompletion({
      ...ownerAllFalse,
      hasName: true,
      hasServiceType: true,
      hasAddress: true,
      hasHours: true,
      hasProfessionalWithService: true,
      // perfil segue pendente (phone/instagram = false)
    });
    expect(c.basic.percent).toBe(100);
    expect(c.profile.pending).toBe(2);
    expect(hasBasicPending(c)).toBe(false);
  });
});

describe("hasAnyPending (dot)", () => {
  it("tudo pendente => true", () => {
    expect(hasAnyPending(professionalCompletion(proAllFalse))).toBe(true);
  });

  it("básico completo mas perfil pendente => true (o dot cobre perfil)", () => {
    const c = professionalCompletion({
      ...proAllFalse,
      isAffiliated: true,
      hasService: true,
    });
    expect(c.basic.pending).toBe(0);
    expect(hasAnyPending(c)).toBe(true);
  });

  it("tudo completo => false", () => {
    const c = professionalCompletion({
      isAffiliated: true,
      hasService: true,
      hasNickname: true,
      hasSpecialty: true,
    });
    expect(hasAnyPending(c)).toBe(false);
  });
});

describe("lojaPendenteParaProfissional", () => {
  it("avisa quando EU estou pronto e a LOJA não está", () => {
    expect(lojaPendenteParaProfissional(true, true)).toBe(true);
  });

  it("não avisa se o meu cadastro ainda não fechou — um problema de cada vez", () => {
    expect(lojaPendenteParaProfissional(false, true)).toBe(false);
  });

  it("não avisa quando a loja está em ordem", () => {
    expect(lojaPendenteParaProfissional(true, false)).toBe(false);
  });

  it("🔴 sem a flag do backend, NÃO afirma nada", () => {
    // Chutar a partir de "loja fechada" transformaria a ação cotidiana do dono
    // (fechar à noite) em alarme diário — e alarme diário ensina a ignorar.
    expect(lojaPendenteParaProfissional(true, undefined)).toBe(false);
    expect(lojaPendenteParaProfissional(true, null)).toBe(false);
  });
});
