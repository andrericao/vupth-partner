import { maskTime, isValidTime, parseApiTime, toApiTime, deviceOffsetSuffix, isoDate, periodRange, hhmmFromIso } from "../time";

describe("isoDate", () => {
  it("formata como YYYY-MM-DD com zero-pad", () => {
    expect(isoDate(new Date(2026, 5, 7))).toBe("2026-06-07");
    expect(isoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("periodRange", () => {
  it("day: dateFrom === dateTo (hoje)", () => {
    const r = periodRange("day");
    expect(r.dateFrom).toBe(r.dateTo);
  });
  it("week e month: dateFrom <= dateTo", () => {
    expect(periodRange("week").dateFrom <= periodRange("week").dateTo).toBe(true);
    expect(periodRange("month").dateFrom <= periodRange("month").dateTo).toBe(true);
  });
});

describe("maskTime", () => {
  it("formats digits as HH:MM", () => {
    expect(maskTime("0900")).toBe("09:00");
    expect(maskTime("9")).toBe("9");
    expect(maskTime("09")).toBe("09");
    expect(maskTime("093")).toBe("09:3");
  });

  it("strips non-digits and caps at 4 digits", () => {
    expect(maskTime("09:00")).toBe("09:00");
    expect(maskTime("090000")).toBe("09:00");
    expect(maskTime("ab12cd34ef")).toBe("12:34");
  });
});

describe("isValidTime", () => {
  it("accepts valid HH:MM", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("09:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  it("rejects out-of-range or malformed", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("09:60")).toBe(false);
    expect(isValidTime("9:00")).toBe(false);
    expect(isValidTime("0900")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});

// QA 2026-07-24 (bug do fuso, 2a metade): o `toApiTime` ja manda o offset REAL
// do aparelho, mas o backend NORMALIZA o OffsetTime para UTC e devolve "15:00Z"
// p/ um almoco de 12:00 local — a UI mostrava 15:00 (+3h). O parseApiTime tem
// de CONVERTER o OffsetTime de volta ao relogio de parede local (inverso do
// toApiTime), robusto a qualquer offset que o backend ecoe.
describe("parseApiTime", () => {
  const withOffset = (min: number, fn: () => void) => {
    const spy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(min);
    try {
      fn();
    } finally {
      spy.mockRestore();
    }
  };

  it("aparelho em UTC: hora Z fica igual", () => {
    withOffset(0, () => {
      expect(parseApiTime("09:00Z")).toBe("09:00");
      expect(parseApiTime("11:30Z")).toBe("11:30");
      expect(parseApiTime("18:05:00Z")).toBe("18:05");
    });
  });

  it("Brasil (UTC-3): converte o UTC normalizado do backend p/ o relogio local", () => {
    withOffset(180, () => {
      // backend guarda 12:00 local como 15:00Z; a UI deve mostrar 12:00.
      expect(parseApiTime("15:00:00Z")).toBe("12:00");
      expect(parseApiTime("15:00Z")).toBe("12:00");
      expect(parseApiTime("21:30Z")).toBe("18:30");
    });
  });

  it("round-trip com toApiTime preserva o relogio de parede", () => {
    withOffset(180, () => {
      expect(parseApiTime(toApiTime("12:00")!)).toBe("12:00");
      expect(parseApiTime(toApiTime("18:30")!)).toBe("18:30");
      // tanto faz o offset ecoado: "-03:00" original OU "Z" normalizado.
      expect(parseApiTime("18:30:00-03:00")).toBe("18:30");
    });
  });

  it("lida com a virada de dia (modulo 24h)", () => {
    withOffset(180, () => {
      // 01:00Z = 22:00 local do dia anterior.
      expect(parseApiTime("01:00Z")).toBe("22:00");
    });
  });

  it("sem offset explicito, trata como relogio local (sem shift)", () => {
    withOffset(180, () => {
      expect(parseApiTime("12:00")).toBe("12:00");
      expect(parseApiTime("12:00:00")).toBe("12:00");
    });
  });

  it("aplica offset com sinal '+' (leste de Greenwich)", () => {
    withOffset(0, () => {
      // 12:00 num fuso +02:00 = 10:00 UTC; aparelho em UTC mostra 10:00.
      expect(parseApiTime("12:00+02:00")).toBe("10:00");
    });
  });

  it("returns null for null/empty/garbage e HH:MM fora de faixa", () => {
    expect(parseApiTime(null)).toBeNull();
    expect(parseApiTime("")).toBeNull();
    expect(parseApiTime("nope")).toBeNull();
    expect(parseApiTime("24:00Z")).toBeNull();
    expect(parseApiTime("12:60Z")).toBeNull();
  });
});

// QA 2026-07-23 (bug do fuso): a hora digitada e LOCAL e precisa ir com o
// offset REAL do aparelho — rotular como "Z" deslocava a janela em -3h no
// Brasil (loja "aberta" as 6:30, cliente barrado as 18:30).
describe("deviceOffsetSuffix", () => {
  const withOffset = (min: number, fn: () => void) => {
    const spy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(min);
    try {
      fn();
    } finally {
      spy.mockRestore();
    }
  };

  it("Brasil (UTC-3, getTimezoneOffset=180) vira '-03:00'", () => {
    withOffset(180, () => expect(deviceOffsetSuffix()).toBe("-03:00"));
  });

  it("leste de Greenwich (ex.: UTC+5:30, offset=-330) vira '+05:30'", () => {
    withOffset(-330, () => expect(deviceOffsetSuffix()).toBe("+05:30"));
  });

  it("UTC exato vira 'Z'", () => {
    withOffset(0, () => expect(deviceOffsetSuffix()).toBe("Z"));
  });
});

describe("toApiTime", () => {
  it("monta OffsetTime com o offset do aparelho (não mais 'Z' fixo)", () => {
    const spy = jest.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(180);
    try {
      expect(toApiTime("09:00")).toBe("09:00:00-03:00");
      expect(toApiTime("18:30")).toBe("18:30:00-03:00");
    } finally {
      spy.mockRestore();
    }
  });

  it("returns null for invalid input", () => {
    expect(toApiTime("24:00")).toBeNull();
    expect(toApiTime("9:00")).toBeNull();
    expect(toApiTime("")).toBeNull();
  });
});

// hhmmFromIso — o card da solicitacao de corte mostra a HORA do pedido
// (`created_at` vem como ISO completo, nao como OffsetTime do parseApiTime).
describe("hhmmFromIso", () => {
  it("extrai HH:MM no relogio LOCAL do aparelho", () => {
    const iso = new Date(2026, 7, 7, 14, 32).toISOString();
    expect(hhmmFromIso(iso)).toBe("14:32");
  });

  it("preenche o zero a esquerda", () => {
    const iso = new Date(2026, 7, 7, 9, 5).toISOString();
    expect(hhmmFromIso(iso)).toBe("09:05");
  });

  it("entrada inválida ou ausente não quebra o card", () => {
    expect(hhmmFromIso("não e data")).toBeNull();
    expect(hhmmFromIso(null)).toBeNull();
    expect(hhmmFromIso(undefined)).toBeNull();
    expect(hhmmFromIso("")).toBeNull();
  });
});
