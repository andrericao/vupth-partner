import { api } from "@lib/api";
import { maskPhone, unmask } from "@lib/masks";

// pagamento-pix (contrato do Backend 2a2b0ec, adendos 1a0616c e 62295f1): a chave
// Pix do profissional, cadastrada no Perfil. O cliente paga direto a ele (versao
// beta, sem gateway). Andre, 10/10: recomendar aleatoria, telefone ou e-mail;
// recomendar que nao exibam o CPF.

export type TipoDeChave = "RANDOM" | "PHONE" | "EMAIL" | "CNPJ" | "CPF";

export type ChavePix = { key_type: TipoDeChave; key: string; holder_name: string };

export const TIPOS_DE_CHAVE: { tipo: TipoDeChave; rotulo: string; recomendada?: boolean; aviso?: string }[] = [
  { tipo: "RANDOM", rotulo: "Chave aleatória", recomendada: true },
  { tipo: "PHONE", rotulo: "Telefone" },
  { tipo: "EMAIL", rotulo: "E-mail" },
  { tipo: "CNPJ", rotulo: "CNPJ" },
  { tipo: "CPF", rotulo: "CPF", aviso: "O cliente vê a chave ao pagar. Prefira não mostrar o seu CPF." },
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitosDoTelefone(texto: string): string {
  let d = unmask(texto);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + Number(d[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

/** Erro para mostrar no campo, ou null se a chave vale para o tipo. */
export function erroDaChave(tipo: TipoDeChave, texto: string): string | null {
  if (texto.trim().length === 0) return "Informe a chave Pix.";
  switch (tipo) {
    case "RANDOM":
      return UUID.test(texto.trim()) ? null : "A chave aleatória tem 32 letras e números, com hifens.";
    case "PHONE": {
      const d = digitosDoTelefone(texto);
      return d.length === 10 || d.length === 11 ? null : "Informe o telefone com DDD, ex.: (11) 98888-7777.";
    }
    case "EMAIL":
      return EMAIL.test(texto.trim()) ? null : "Informe um e-mail válido.";
    case "CNPJ":
      return cnpjValido(unmask(texto)) ? null : "CNPJ inválido.";
    case "CPF":
      return cpfValido(unmask(texto)) ? null : "CPF inválido.";
  }
}

/**
 * pix-sem-nome (PAR-6, Andre 15/10): "nao pedir nome junto da chave —
 * cadastrar a chave e pronto". O backend ainda exige o holder_name (ate 25
 * letras, vai no Pix copia-e-cola): o app manda sozinho o nome da conta.
 */
export function titularDoPix(nome: string | null | undefined): string {
  const t = (nome ?? "").trim().replace(/\s+/g, " ");
  return (t || "VUPTH").slice(0, 25).trim();
}

/** A chave como o backend espera: telefone +55DDDNUMERO, CPF/CNPJ so digitos. */
export function normalizarChave(tipo: TipoDeChave, texto: string): string {
  switch (tipo) {
    case "PHONE":
      return `+55${digitosDoTelefone(texto)}`;
    case "CPF":
    case "CNPJ":
      return unmask(texto);
    default:
      return texto.trim().toLowerCase();
  }
}

/** "Telefone · (11) 98888-7777": o tipo e a chave legivel. */
export function chaveParaMostrar(c: ChavePix): string {
  const rotulo = TIPOS_DE_CHAVE.find((t) => t.tipo === c.key_type)?.rotulo ?? c.key_type;
  const valor = c.key_type === "PHONE" ? maskPhone(digitosDoTelefone(c.key)) : c.key;
  return `${rotulo} · ${valor}`;
}

/** A chave cadastrada, ou null quando ainda nao ha (404 PIX_KEY_NOT_SET). */
export async function obterChavePix(): Promise<ChavePix | null> {
  try {
    const { data } = await api.get<ChavePix>("/professional/me/pix");
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function salvarChavePix(p: { tipo: TipoDeChave; chave: string; titular: string }): Promise<ChavePix> {
  const { data } = await api.put<ChavePix>("/professional/me/pix", {
    key_type: p.tipo,
    key: normalizarChave(p.tipo, p.chave),
    holder_name: p.titular.trim(),
  });
  return data;
}

export async function apagarChavePix(): Promise<void> {
  await api.delete("/professional/me/pix");
}
