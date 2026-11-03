import { unmask } from "./masks";

// campo-cpf-no-perfil (DEC-164): CPF opcional no perfil do profissional. O app confere os
// digitos verificadores antes de enviar (o Backend confere de novo: 422 CPF_INVALID).
// O CPF nunca entra em log nem em mensagem de erro.

export function cpfValido(texto: string): boolean {
  const d = unmask(texto);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

/** Erro para o campo, ou null se vale (vazio vale: o CPF e opcional e vazio apaga). */
export function erroDoCpf(texto: string): string | null {
  if (unmask(texto).length === 0) return null;
  return cpfValido(texto) ? null : "CPF inválido. Confira os 11 números.";
}

/** O CPF (ja mascarado pelo Backend) para ler, ou "—" sem CPF. */
export function cpfParaMostrar(cpf: string | null | undefined): string {
  return cpf && cpf.trim() ? cpf : "—";
}
