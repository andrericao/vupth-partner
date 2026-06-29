// Regras de senha forte para o cadastro (register.tsx).
// Mantido como funcao pura para ser testavel sem renderizar a tela.

export type PasswordCheck = {
  valid: boolean;
  errors: string[];
};

export type PasswordRule = {
  label: string;
  passed: boolean;
};

const MIN_LENGTH = 8;

// Checklist de regras (rotulo + se passou) para mostrar AO VIVO no cadastro,
// como no front-client. validatePassword deriva os erros dos rotulos reprovados.
export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { label: `Mínimo de ${MIN_LENGTH} caracteres`, passed: password.length >= MIN_LENGTH },
    { label: "Pelo menos uma letra", passed: /[a-zA-Z]/.test(password) },
    { label: "Pelo menos um número", passed: /[0-9]/.test(password) },
    { label: "Pelo menos um caractere especial", passed: /[^a-zA-Z0-9]/.test(password) },
  ];
}

export function validatePassword(password: string): PasswordCheck {
  const errors = getPasswordRules(password)
    .filter((r) => !r.passed)
    .map((r) => r.label);

  return { valid: errors.length === 0, errors };
}
