type RoleIntent = "owner" | "professional" | undefined;

/**
 * Para onde o cartao de papel da tela de entrada leva.
 *
 * Papel neste sistema nao tem endpoint proprio: ele nasce como efeito de
 * CRIAR a entidade (loja -> OWNER, perfil profissional -> PROFESSIONAL) e
 * aparece no token no `refreshToken()` seguinte. Logo, quem ja tem conta nao
 * precisa passar pelo cadastro — precisa ir direto criar a entidade.
 *
 * Era esse desvio que faltava, e a falta dele fechava um ciclo: quem tinha
 * conta so de CLIENT tocava "Ja tem conta? Entrar", logava, e o
 * `getPostLoginRoute` abaixo — sem papel de parceiro e sem intencao —
 * devolvia `/(auth)`, a mesma tela de onde a pessoa veio.
 */
export function getRoleCardRoute(
  isAuthenticated: boolean,
  role: "owner" | "professional"
): string {
  if (!isAuthenticated) return `/(auth)/register?role=${role}`;
  return role === "owner"
    ? "/(owner)/onboarding/establishment"
    : "/(professional)/onboarding";
}

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

  // Logado, mas sem papel de parceiro e sem intencao declarada: a tela de
  // entrada e o lugar certo pra perguntar O QUE criar. Ela reconhece a sessao
  // (ver `getRoleCardRoute`) e manda pro onboarding, nao pro cadastro — sem
  // isso, isto aqui era um ciclo.
  return "/(auth)";
}
