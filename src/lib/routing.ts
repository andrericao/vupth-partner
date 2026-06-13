type RoleIntent = "owner" | "professional" | undefined;

export function getPostLoginRoute(
  roles: string[],
  intent?: RoleIntent
): string {
  const hasOwner = roles.includes("OWNER");
  const hasProfessional = roles.includes("PROFESSIONAL");

  if (hasOwner && hasProfessional) {
    if (intent === "professional") return "/(professional)/queue";
    return "/(owner)/dashboard";
  }

  if (hasOwner) return "/(owner)/dashboard";
  if (hasProfessional) return "/(professional)/queue";

  if (intent === "owner") return "/(owner)/onboarding/establishment";
  if (intent === "professional") return "/(professional)/onboarding";

  return "/(auth)";
}
