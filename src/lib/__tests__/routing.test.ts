import { getPostLoginRoute } from "../routing";

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
