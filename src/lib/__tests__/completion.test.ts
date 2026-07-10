import {
  ownerCompletion,
  professionalCompletion,
  OwnerCompletionInput,
  ProfessionalCompletionInput,
} from "../completion";

const ownerAllFalse: OwnerCompletionInput = {
  hasName: false,
  hasServiceType: false,
  hasAddress: false,
  hasHours: false,
  hasProfessionalWithService: false,
  isOpen: false,
  hasPhone: false,
  hasInstagram: false,
};

const proAllFalse: ProfessionalCompletionInput = {
  isAffiliated: false,
  hasService: false,
  establishmentReady: false,
  hasNickname: false,
  hasSpecialty: false,
};

describe("ownerCompletion", () => {
  it("basic tem 6 itens e profile tem 2", () => {
    const c = ownerCompletion(ownerAllFalse);
    expect(c.basic.total).toBe(6);
    expect(c.profile.total).toBe(2);
  });

  it("tudo falso => 0% e pending = total", () => {
    const c = ownerCompletion(ownerAllFalse);
    expect(c.basic.percent).toBe(0);
    expect(c.basic.done).toBe(0);
    expect(c.basic.pending).toBe(6);
    expect(c.profile.percent).toBe(0);
  });

  it("tudo verdadeiro => 100% nos dois", () => {
    const c = ownerCompletion({
      hasName: true,
      hasServiceType: true,
      hasAddress: true,
      hasHours: true,
      hasProfessionalWithService: true,
      isOpen: true,
      hasPhone: true,
      hasInstagram: true,
    });
    expect(c.basic.percent).toBe(100);
    expect(c.basic.pending).toBe(0);
    expect(c.profile.percent).toBe(100);
  });

  it("arredonda o percentual (4 de 6 = 67%)", () => {
    const c = ownerCompletion({
      ...ownerAllFalse,
      hasName: true,
      hasServiceType: true,
      hasAddress: true,
      hasHours: true,
    });
    expect(c.basic.done).toBe(4);
    expect(c.basic.percent).toBe(67);
  });

  it("basic e profile sao independentes (profile pode adiantar o basico)", () => {
    const c = ownerCompletion({ ...ownerAllFalse, hasPhone: true, hasInstagram: true });
    expect(c.basic.percent).toBe(0);
    expect(c.profile.percent).toBe(100);
  });

  it("cada item carrega key, label e done", () => {
    const c = ownerCompletion(ownerAllFalse);
    const keys = c.basic.items.map((i) => i.key);
    expect(keys).toContain("hours");
    expect(keys).toContain("open");
    expect(c.basic.items[0]).toHaveProperty("label");
    expect(c.basic.items[0]).toHaveProperty("done", false);
  });
});

describe("professionalCompletion", () => {
  it("basic tem 3 itens e profile tem 2", () => {
    const c = professionalCompletion(proAllFalse);
    expect(c.basic.total).toBe(3);
    expect(c.profile.total).toBe(2);
  });

  it("vinculado + servico + estabelecimento pronto => basico 100%", () => {
    const c = professionalCompletion({
      ...proAllFalse,
      isAffiliated: true,
      hasService: true,
      establishmentReady: true,
    });
    expect(c.basic.percent).toBe(100);
  });

  it("so vinculado => 33% (1 de 3)", () => {
    const c = professionalCompletion({ ...proAllFalse, isAffiliated: true });
    expect(c.basic.done).toBe(1);
    expect(c.basic.percent).toBe(33);
  });

  it("apelido + especialidade => perfil 100%", () => {
    const c = professionalCompletion({ ...proAllFalse, hasNickname: true, hasSpecialty: true });
    expect(c.profile.percent).toBe(100);
  });
});
