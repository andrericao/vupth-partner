// Erros de acesso (login, cadastro, esqueci a senha) — contrato do Backend de
// 03/10 (fd9a3af): e-mail sem conta tem codigo proprio (EMAIL_NOT_FOUND: 401 no
// login, 404 no esqueci) e as tres rotas limitam tentativas (429
// TOO_MANY_REQUESTS com Retry-After). Antes o 401 era sempre "e-mail ou senha
// invalidos", e quem errava o e-mail nao sabia que podia criar a conta.

export type ErroDeAcesso =
  | { tipo: "sem-conta" }
  | { tipo: "senha-errada" }
  | { tipo: "espera"; mensagem: string }
  | { tipo: "outro" };

const ESPERA_PADRAO = 60;

/** Segundos do Retry-After de um 429 (numero ou data HTTP); sem ele, 60. */
export function segundosDeEspera(error: any, agora: number = Date.now()): number {
  const headers = error?.response?.headers ?? {};
  const valor = headers["retry-after"] ?? headers["Retry-After"];
  if (valor === undefined || valor === null) return ESPERA_PADRAO;

  const texto = String(valor).trim();
  if (/^\d+$/.test(texto)) return Number(texto);

  const data = Date.parse(texto);
  if (Number.isNaN(data)) return ESPERA_PADRAO;
  return Math.max(1, Math.ceil((data - agora) / 1000));
}

export function textoDaEspera(segundos: number): string {
  const quando = segundos < 60 ? `${segundos} s` : `${Math.ceil(segundos / 60)} min`;
  return `Muitas tentativas. Tente de novo em ${quando}.`;
}

export function classificarErroDeAcesso(error: any): ErroDeAcesso {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;

  if (code === "EMAIL_NOT_FOUND") return { tipo: "sem-conta" };
  if (status === 429) return { tipo: "espera", mensagem: textoDaEspera(segundosDeEspera(error)) };
  if (status === 401) return { tipo: "senha-errada" };
  return { tipo: "outro" };
}

/** Para onde o "Criar conta" leva quem tentou entrar com e-mail sem conta. */
export function rotaDoCadastro(role: string | undefined): string {
  return role === "owner" || role === "professional" ? `/(auth)/register?role=${role}` : "/(auth)";
}
