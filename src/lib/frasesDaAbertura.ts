import { gravarItem, lerItem } from "@lib/armazenamentoOpcional";

// frases-na-abertura (PAR-7, DEC-167): frases curtas intercalando com o V da
// abertura. Lista em arquivo unico; so funcionalidades que EXISTEM no Partner.
// A frase aparece dentro do tempo da abertura, nunca o prolonga (DEC-145).
export const FRASES_DA_ABERTURA: readonly string[] = [
  "Estamos em teste: nos ajude a melhorar e envie seu feedback",
  "Defina modalidades de fila: só agenda, ou agenda e fila",
  "Abra dias na agenda e veja os agendamentos de cada um",
  "Feche a fila quando precisar de uma pausa",
  "Cadastre a sua chave Pix para receber dos clientes",
  "Defina o horário de funcionamento da sua loja",
  "Crie campanhas para atrair mais clientes",
];

const CHAVE = "abertura.frase.indice";

/** Indice da frase de uma abertura, dado o indice guardado da anterior (ou null). */
export function proximoIndice(guardado: string | null, total = FRASES_DA_ABERTURA.length): number {
  const n = Number.parseInt(guardado ?? "", 10);
  if (!Number.isInteger(n) || n < 0) return 0;
  return (n + 1) % total;
}

/** A frase desta abertura (rotacao por abertura). Nunca lanca; sem armazem, a primeira. */
export async function fraseDestaAbertura(): Promise<string> {
  const i = proximoIndice(await lerItem(CHAVE));
  await gravarItem(CHAVE, String(i));
  return FRASES_DA_ABERTURA[i];
}
