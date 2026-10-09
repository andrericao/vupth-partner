import {
  DIAS,
  nomeDoDia,
  normalizarHorarios,
  semanaInicial,
  erroDoDia,
  validarSemana,
  descreverHorario,
  aplicarATodos,
  dataBrParaIso,
  isoParaBr,
  hojeIso,
  temHorarioDefinido,
  resumoDoDia,
  semanaDosProximosDias,
  type DiaSemanal,
} from "@lib/horarioSemanal";

// Contrato do backend (16/09, "horario por dia"): a semana tem os 7 dias sempre
// definidos (horario ou fechado) e o dono pode criar excecao por data.
const aberto = (day: DiaSemanal["day"], opens = "08:00", closes = "18:00"): DiaSemanal => ({
  day,
  closed: false,
  opens,
  closes,
});

describe("DIAS", () => {
  it("segunda a domingo, na ordem do contrato", () => {
    expect(DIAS.map((d) => d.day)).toEqual([
      "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
    ]);
    expect(DIAS[0].nome).toBe("Segunda");
    expect(DIAS[6].nome).toBe("Domingo");
  });
});

describe("normalizarHorarios", () => {
  it("le o corpo do GET e poe a semana na ordem, com HH:mm", () => {
    const h = normalizarHorarios({
      configured: true,
      weekly: [
        { day: "SUNDAY", closed: true },
        ...DIAS.slice(0, 6).map((d) => ({ day: d.day, closed: false, opens: "08:00:00", closes: "18:00" })),
      ],
      exceptions: [{ date: "2026-09-28", closed: true }],
      upcoming: [{ date: "2026-09-17", day: "THURSDAY", closed: false, opens: "08:00", closes: "18:00", exception: false }],
    });
    expect(h.configured).toBe(true);
    expect(h.weekly[0]).toEqual({ day: "MONDAY", closed: false, opens: "08:00", closes: "18:00" });
    expect(h.weekly[6]).toEqual({ day: "SUNDAY", closed: true, opens: null, closes: null });
    expect(h.exceptions).toHaveLength(1);
    expect(h.upcoming[0].exception).toBe(false);
  });

  it("aguenta campos faltando (loja sem horario ainda)", () => {
    const h = normalizarHorarios({ configured: false });
    expect(h).toEqual({ configured: false, weekly: [], exceptions: [], upcoming: [] });
  });

  it("as excecoes saem em ordem de data", () => {
    const h = normalizarHorarios({
      configured: true,
      weekly: [],
      exceptions: [
        { date: "2026-10-02", closed: true },
        { date: "2026-09-21", closed: false, opens: "10:00", closes: "14:00" },
      ],
    });
    expect(h.exceptions.map((e) => e.date)).toEqual(["2026-09-21", "2026-10-02"]);
  });
});

describe("semanaInicial", () => {
  it("loja configurada: a semana que veio", () => {
    const weekly = DIAS.map((d) => aberto(d.day));
    expect(semanaInicial({ configured: true, weekly, exceptions: [], upcoming: [] }, null)).toEqual(weekly);
  });

  it("loja sem horario: 7 dias abertos e vazios, para o dono preencher", () => {
    const s = semanaInicial({ configured: false, weekly: [], exceptions: [], upcoming: [] }, null);
    expect(s).toHaveLength(7);
    expect(s.every((d) => !d.closed && d.opens === "" && d.closes === "")).toBe(true);
  });

  it("sem semana mas com o horario unico antigo: ele preenche os 7 dias", () => {
    const s = semanaInicial(
      { configured: false, weekly: [], exceptions: [], upcoming: [] },
      { opens: "09:00", closes: "19:00" }
    );
    expect(s.every((d) => d.opens === "09:00" && d.closes === "19:00")).toBe(true);
  });
});

describe("erroDoDia / validarSemana", () => {
  it("fechado nao precisa de horario", () => {
    expect(erroDoDia({ closed: true })).toBeNull();
  });

  it("aberto exige os dois horarios validos", () => {
    expect(erroDoDia({ closed: false, opens: "", closes: "18:00" })).toMatch(/abertura/);
    expect(erroDoDia({ closed: false, opens: "08:00", closes: "25:00" })).toMatch(/fechamento/);
  });

  it("fechar antes de abrir vale (vira a meia-noite) e igual vale (24h)", () => {
    expect(erroDoDia({ closed: false, opens: "22:00", closes: "02:00" })).toBeNull();
    expect(erroDoDia({ closed: false, opens: "00:00", closes: "00:00" })).toBeNull();
  });

  it("a semana aponta o PRIMEIRO dia com problema, pelo nome", () => {
    const semana = DIAS.map((d) => aberto(d.day));
    semana[2] = { day: "WEDNESDAY", closed: false, opens: "8", closes: "18:00" };
    expect(validarSemana(semana)).toBe("Quarta: informe a abertura no formato HH:MM.");
  });

  it("semana completa e valida = null", () => {
    expect(validarSemana(DIAS.map((d) => aberto(d.day)))).toBeNull();
  });

  it("semana sem os 7 dias nao passa", () => {
    expect(validarSemana(DIAS.slice(0, 6).map((d) => aberto(d.day)))).toMatch(/7 dias/);
  });
});

describe("descreverHorario", () => {
  it.each([
    [{ closed: true }, "Fechado"],
    [{ closed: false, opens: "08:00", closes: "18:00" }, "08:00 às 18:00"],
    [{ closed: false, opens: "09:00", closes: "09:00" }, "24 horas"],
    [{ closed: false, opens: "22:00", closes: "02:00" }, "22:00 às 02:00 (vira o dia)"],
  ])("%j -> %s", (h, esperado) => {
    expect(descreverHorario(h)).toBe(esperado);
  });
});

describe("aplicarATodos", () => {
  it("copia o horario para os dias ABERTOS e respeita os fechados", () => {
    const semana: DiaSemanal[] = DIAS.map((d) => aberto(d.day, "", ""));
    semana[6] = { day: "SUNDAY", closed: true, opens: null, closes: null };
    const r = aplicarATodos(semana, { opens: "09:00", closes: "17:00" });
    expect(r.slice(0, 6).every((d) => d.opens === "09:00" && d.closes === "17:00")).toBe(true);
    expect(r[6].closed).toBe(true);
  });
});

describe("datas", () => {
  it("DD/MM/AAAA <-> ISO", () => {
    expect(dataBrParaIso("21/09/2026")).toBe("2026-09-21");
    expect(isoParaBr("2026-09-21")).toBe("21/09/2026");
  });

  it("data impossivel ou incompleta = null", () => {
    expect(dataBrParaIso("31/02/2026")).toBeNull();
    expect(dataBrParaIso("21/09/26")).toBeNull();
  });

  it("hoje no relogio do aparelho", () => {
    expect(hojeIso(new Date(2026, 8, 7, 23, 30))).toBe("2026-09-07");
  });
});

// O card "Complete o cadastro" do dono. Com o contrato novo, opening_time vem
// NULO no dia em que a loja fecha — olhar so ele acusaria "falta o horario"
// todo domingo.
describe("temHorarioDefinido", () => {
  it("com a semana do backend, vale o `configured`", () => {
    expect(temHorarioDefinido({ configured: true }, { opening_time: null, closing_time: null })).toBe(true);
    expect(temHorarioDefinido({ configured: false }, { opening_time: "08:00", closing_time: "18:00" })).toBe(false);
  });

  it("backend antigo (sem a semana): cai no horario unico", () => {
    expect(temHorarioDefinido(null, { opening_time: "08:00", closing_time: "18:00" })).toBe(true);
    expect(temHorarioDefinido(null, { opening_time: null, closing_time: "18:00" })).toBe(false);
    expect(temHorarioDefinido(null, null)).toBe(false);
  });
});

// A tela que o profissional ve antes de pedir vinculo mostra o horario DO DIA.
// As frases sao as do client (mandadas por eles em 17/09), letra por letra:
// "Hoje, 08:00 às 18:00" · "Fechada hoje" · "Reabre amanhã, 09:00" · "Reabre
// sábado, 09:00". Duas regras: o "reabre" só lê `upcoming` (dias já resolvidos),
// senão promete um sábado que a exceção fechou; e `configured: false` não
// mostra linha nenhuma.
describe("resumoDoDia", () => {
  const dia = (date: string, day: any, over: any = {}) => ({
    date, day, closed: false, opens: "08:00", closes: "18:00", exception: false, ...over,
  });
  const loja = (upcoming: any[], configured = true) =>
    ({ configured, weekly: [], exceptions: [], upcoming });

  it("loja sem horario definido: nada", () => {
    expect(resumoDoDia(loja([], false), "2026-09-19")).toBeNull();
  });

  it("hoje aberta: a faixa do dia", () => {
    const r = resumoDoDia(loja([dia("2026-09-19", "SATURDAY")]), "2026-09-19");
    expect(r).toEqual({ hoje: "Hoje, 08:00 às 18:00", reabre: null });
  });

  it("hoje 24 horas e hoje virando o dia usam as mesmas palavras da semana", () => {
    expect(
      resumoDoDia(loja([dia("2026-09-19", "SATURDAY", { opens: "09:00", closes: "09:00" })]), "2026-09-19")?.hoje
    ).toBe("Hoje, 24 horas");
    expect(
      resumoDoDia(loja([dia("2026-09-19", "SATURDAY", { opens: "22:00", closes: "02:00" })]), "2026-09-19")?.hoje
    ).toBe("Hoje, 22:00 às 02:00 (vira o dia)");
  });

  it("hoje fechada: 'Fechada hoje' e o reabre de AMANHA", () => {
    const r = resumoDoDia(
      loja([
        dia("2026-09-19", "SATURDAY", { closed: true, opens: null, closes: null }),
        dia("2026-09-20", "SUNDAY", { opens: "09:00", closes: "13:00" }),
      ]),
      "2026-09-19"
    );
    expect(r).toEqual({ hoje: "Fechada hoje", reabre: "Reabre amanhã, 09:00" });
  });

  it("fechada hoje e amanha: o reabre diz o DIA DA SEMANA, em minuscula", () => {
    const r = resumoDoDia(
      loja([
        dia("2026-09-19", "FRIDAY", { closed: true, opens: null, closes: null }),
        dia("2026-09-20", "SATURDAY", { closed: true, opens: null, closes: null }),
        dia("2026-09-21", "MONDAY", { opens: "10:00", closes: "19:00" }),
      ]),
      "2026-09-19"
    );
    expect(r).toEqual({ hoje: "Fechada hoje", reabre: "Reabre segunda, 10:00" });
  });

  it("fechada e sem nenhum dia aberto a frente: sem promessa", () => {
    const r = resumoDoDia(
      loja([dia("2026-09-19", "SATURDAY", { closed: true, opens: null, closes: null })]),
      "2026-09-19"
    );
    expect(r).toEqual({ hoje: "Fechada hoje", reabre: null });
  });

  it("hoje nao esta no upcoming: nada (nao inventa pela semana)", () => {
    expect(resumoDoDia(loja([dia("2026-09-20", "SUNDAY")]), "2026-09-19")).toBeNull();
  });
});

// agenda-do-profissional (05/10): sem agenda, a semana abre com o horario
// efetivo da loja, tirado dos proximos dias.
describe("semanaDosProximosDias", () => {
  const dia = (date: string, day: any, extra: object = {}) => ({
    date, day, exception: false, closed: false, opens: "09:00", closes: "18:00", ...extra,
  });
  const upcoming = [
    dia("2026-10-05", "MONDAY"),
    dia("2026-10-06", "TUESDAY", { exception: true, closed: true, opens: null, closes: null }),
    dia("2026-10-07", "WEDNESDAY"),
    dia("2026-10-08", "THURSDAY"),
    dia("2026-10-09", "FRIDAY"),
    dia("2026-10-10", "SATURDAY", { closes: "12:00" }),
    dia("2026-10-11", "SUNDAY", { closed: true, opens: null, closes: null }),
    dia("2026-10-13", "TUESDAY"),
  ];

  it("um dia de cada, na ordem da semana, pulando a data especial", () => {
    const s = semanaDosProximosDias(upcoming as any)!;
    expect(s.map((d) => d.day)).toEqual(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
    expect(s[1]).toEqual({ day: "TUESDAY", closed: false, opens: "09:00", closes: "18:00" });
    expect(s[5].closes).toBe("12:00");
    expect(s[6].closed).toBe(true);
  });

  it("faltando um dia: null", () => {
    expect(semanaDosProximosDias(upcoming.slice(0, 3) as any)).toBeNull();
  });
});

// cobertura-98 (Andre, 08/10): os cantos — dia desconhecido, horario curto e
// opens/closes ausentes.
describe("cantos", () => {
  it("nomeDoDia de um dia desconhecido devolve o proprio codigo", () => {
    expect(nomeDoDia("FERIADO" as any)).toBe("FERIADO");
  });

  it("horario curto ou nao-string vira null", () => {
    const h = normalizarHorarios({ weekly: [{ day: "MONDAY", closed: false, opens: "8:0", closes: 900 }] });
    expect(h.weekly[0]).toMatchObject({ opens: null, closes: null });
  });

  it("erroDoDia com abertura ou fechamento ausentes", () => {
    expect(erroDoDia({ closed: false, opens: null, closes: "18:00" } as any)).toMatch(/abertura/);
    expect(erroDoDia({ closed: false, opens: "08:00", closes: null } as any)).toMatch(/fechamento/);
  });
});
