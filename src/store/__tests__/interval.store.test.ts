import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { useIntervalStore, mealName, type Interval } from "../interval.store";

describe("mealName", () => {
  it("humaniza Lunch/Dinner Break para Almoco/Janta", () => {
    expect(mealName("Lunch Break")).toBe("Almoço");
    expect(mealName("Dinner Break")).toBe("Janta");
  });
  it("mantem descricoes customizadas", () => {
    expect(mealName("Cafe da tarde")).toBe("Cafe da tarde");
  });
});

const mock = new MockAdapter(api);
const PROF = "prof-uuid-1";
const BASE = `/api/v1/professionals/${PROF}/intervals`;

const LUNCH: Interval = {
  intervalId: "int-1",
  type: "RECURRENT",
  status: "SCHEDULED",
  durationMinutes: 60,
  startTime: null,
  endTime: null,
  description: "Lunch Break",
  fixedStartTime: "12:00Z",
  recurrencePattern: "WEEKDAYS",
};

beforeEach(() => {
  useIntervalStore.setState({ intervals: [], isLoading: false });
  mock.reset();
  jest.clearAllMocks();
});

describe("interval.store", () => {
  describe("fetchIntervals", () => {
    it("GET .../intervals?date e guarda a lista", async () => {
      mock.onGet(BASE).reply(200, [LUNCH]);

      await useIntervalStore.getState().fetchIntervals(PROF, "2026-06-16");

      expect(mock.history.get[0].url).toBe(BASE);
      expect(mock.history.get[0].params).toEqual({ date: "2026-06-16" });
      expect(useIntervalStore.getState().intervals).toEqual([LUNCH]);
    });
  });

  describe("updateInterval", () => {
    it("PATCH .../intervals/{id} e refaz o fetch", async () => {
      mock.onPatch(`${BASE}/int-1`).reply(200, {});
      mock.onGet(BASE).reply(200, [{ ...LUNCH, fixedStartTime: "11:30Z", durationMinutes: 90 }]);

      await useIntervalStore
        .getState()
        .updateInterval(PROF, "int-1", { fixedStartTime: "11:30:00Z", durationMinutes: 90 });

      expect(JSON.parse(mock.history.patch[0].data)).toEqual({
        fixedStartTime: "11:30:00Z",
        durationMinutes: 90,
      });
      expect(useIntervalStore.getState().intervals[0].durationMinutes).toBe(90);
    });
  });

  describe("deleteInterval", () => {
    it("DELETE .../intervals/{id} e refaz o fetch", async () => {
      useIntervalStore.setState({ intervals: [LUNCH] });
      mock.onDelete(`${BASE}/int-1`).reply(204);
      mock.onGet(BASE).reply(200, []);

      await useIntervalStore.getState().deleteInterval(PROF, "int-1");

      expect(mock.history.delete[0].url).toBe(`${BASE}/int-1`);
      expect(useIntervalStore.getState().intervals).toEqual([]);
    });
  });

  describe("createRecurring", () => {
    it("POST .../intervals/recurring e refaz o fetch", async () => {
      mock.onPost(`${BASE}/recurring`).reply(201, {});
      mock.onGet(BASE).reply(200, [LUNCH]);

      await useIntervalStore.getState().createRecurring(PROF, {
        durationMinutes: 60,
        fixedStartTime: "12:00:00Z",
        recurrencePattern: "WEEKDAYS",
        description: "Almoço",
      });

      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        durationMinutes: 60,
        fixedStartTime: "12:00:00Z",
        recurrencePattern: "WEEKDAYS",
        description: "Almoço",
      });
      expect(useIntervalStore.getState().intervals).toEqual([LUNCH]);
    });
  });

  describe("start/finish", () => {
    it("PATCH .../start e .../finish refazem o fetch", async () => {
      mock.onPatch(`${BASE}/int-1/start`).reply(200, {});
      mock.onPatch(`${BASE}/int-1/finish`).reply(200, {});
      mock.onGet(BASE).reply(200, [LUNCH]);

      await useIntervalStore.getState().startInterval(PROF, "int-1");
      expect(mock.history.patch[0].url).toBe(`${BASE}/int-1/start`);

      await useIntervalStore.getState().finishInterval(PROF, "int-1");
      expect(mock.history.patch[1].url).toBe(`${BASE}/int-1/finish`);
    });
  });

  describe("skipInterval", () => {
    it("PATCH .../skip ('Não almocar' do dia) e refaz o fetch", async () => {
      mock.onPatch(`${BASE}/int-1/skip`).reply(200, {});
      mock.onGet(BASE).reply(200, []);

      await useIntervalStore.getState().skipInterval(PROF, "int-1");

      expect(mock.history.patch[0].url).toBe(`${BASE}/int-1/skip`);
    });
  });

  describe("startNextInterval (Modelo B)", () => {
    it("PATCH .../next/start — o backend escolhe a proxima nao feita, nao pulada e nao suprimida", async () => {
      mock.onPatch(`${BASE}/next/start`).reply(200, {});
      mock.onGet(BASE).reply(200, []);

      await useIntervalStore.getState().startNextInterval(PROF);

      expect(mock.history.patch[0].url).toBe(`${BASE}/next/start`);
      expect(mock.history.get).toHaveLength(1);
    });

    it("409 INTERVAL_CONFLICT (nenhuma para iniciar) sobe para a tela", async () => {
      mock.onPatch(`${BASE}/next/start`).reply(409, { code: "INTERVAL_CONFLICT" });

      await expect(useIntervalStore.getState().startNextInterval(PROF)).rejects.toBeTruthy();
      expect(mock.history.get).toHaveLength(0);
    });
  });
});
