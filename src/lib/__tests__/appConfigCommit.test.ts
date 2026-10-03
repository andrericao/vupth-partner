// O app.config.js carimba o commit do codigo em extra.commit: no EAS Build vem
// do EAS_BUILD_GIT_COMMIT_HASH (o build nao tem .git); no eas update, do git
// local. Sem nenhum dos dois, o app segue sem o carimbo.
const mockExecSync = jest.fn();
jest.mock("child_process", () => ({ execSync: (...a: unknown[]) => mockExecSync(...a) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appConfig = require("../../../app.config.js");

const base = {
  name: "vupth parceiros",
  android: { package: "com.vupth.partner" },
  ios: { bundleIdentifier: "com.vupth.partner" },
  extra: { eas: { projectId: "x" } },
};

describe("app.config.js — commit", () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.EAS_BUILD_GIT_COMMIT_HASH;
    delete process.env.EAS_BUILD_PROFILE;
    mockExecSync.mockReset();
  });
  afterAll(() => {
    process.env = env;
  });

  it("no EAS Build: os 7 primeiros do EAS_BUILD_GIT_COMMIT_HASH", () => {
    process.env.EAS_BUILD_GIT_COMMIT_HASH = "dc28e95aaaabbbbcccc";
    const c = appConfig({ config: base });
    expect(c.extra).toEqual({ eas: { projectId: "x" }, commit: "dc28e95" });
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it("local (eas update): o git rev-parse", () => {
    mockExecSync.mockReturnValue("1accdd9\n");
    expect(appConfig({ config: base }).extra.commit).toBe("1accdd9");
  });

  it("sem git: segue sem o carimbo", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("not a git repository");
    });
    expect(appConfig({ config: base }).extra).toEqual({ eas: { projectId: "x" } });
  });

  it("a variante de teste continua trocando id e nome", () => {
    process.env.EAS_BUILD_PROFILE = "preview";
    mockExecSync.mockReturnValue("1accdd9");
    const c = appConfig({ config: base });
    expect(c.android.package).toBe("com.vupth.partner.preview");
    expect(c.name).toBe("VUPTH preview");
    expect(c.extra.commit).toBe("1accdd9");
  });
});
