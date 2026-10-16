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

// DEC-79 (Andre, 16/10): todos os apps aceitam o mesmo intervalo, 6 a 64
// caracteres, e mostram o minimo e o maximo no campo.
export const SENHA_MIN = 6;
export const SENHA_MAX = 64;
/** O que o campo de senha mostra (placeholder): o minimo e o maximo. */
export const SENHA_DICA = `De ${SENHA_MIN} a ${SENHA_MAX} caracteres`;

/** O tamanho cabe no intervalo do DEC-79? */
export function senhaNoTamanho(password: string): boolean {
  return password.length >= SENHA_MIN && password.length <= SENHA_MAX;
}

// Checklist de regras (rotulo + se passou) para mostrar AO VIVO no cadastro,
// como no front-client. validatePassword deriva os erros dos rotulos reprovados.
export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { label: SENHA_DICA, passed: senhaNoTamanho(password) },
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
