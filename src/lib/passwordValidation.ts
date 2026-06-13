// Regras de senha forte para o cadastro (register.tsx).
// Mantido como funcao pura para ser testavel sem renderizar a tela.

export type PasswordCheck = {
  valid: boolean;
  errors: string[];
};

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Mínimo de ${MIN_LENGTH} caracteres`);
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Pelo menos uma letra");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Pelo menos um número");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Pelo menos um caractere especial");
  }

  return { valid: errors.length === 0, errors };
}
