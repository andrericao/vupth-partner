import { maskPhone, unmask } from "./masks";

// telefone-de-contato (Andre, 05/10; contrato BAK 02dd5ef): o numero que o
// profissional escolhe mostrar ao cliente, em "Informacoes do profissional".
// Opcional e so numero — o backend recusa letra com 422. Nao e o telefone da
// conta, que continua privado.

/** Erro para mostrar no campo, ou null se o numero vale (vazio vale: nao mostra). */
export function erroDoTelefoneDeContato(texto: string): string | null {
  const digitos = unmask(texto);
  if (digitos.length === 0) return null;
  if (digitos.length < 10) return "Informe o número com DDD, ex.: (11) 98888-7777.";
  return null;
}

/** O numero formatado para ler, ou "—" sem numero. */
export function telefoneParaMostrar(telefone: string | null | undefined): string {
  let digitos = unmask(telefone ?? "");
  if (digitos.length === 0) return "—";
  if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);
  return maskPhone(digitos);
}
