import type { EstablishmentWithProfessionals } from "@lib/types";

/**
 * O broadcast do WebSocket esta APAGANDO um atendimento em curso?
 *
 * 🔴 POR QUE ISTO EXISTE. O socket faz `setQueryData(snapshot)` — substitui o
 * cache, nao mescla. O hook documenta o topico como "snapshot COMPLETO, identico
 * ao GET", mas isso nunca foi verificado; se o broadcast vier mais pobre, ele
 * apaga o `current_attendance` que o GET trouxe, o card nao monta e o Finalizar
 * fica inalcancavel. E a hipotese aberta do "nao consigo finalizar" desde 31/08.
 *
 * ⚠️ MESCLAR SERIA PIOR. Quando o atendimento realmente acaba, o broadcast que
 * encerra tambem vem sem o campo — mesclar manteria um CARD FANTASMA, com
 * Finalizar para algo que ja terminou. Trocariamos um defeito por um pior.
 *
 * Por isso aqui nao se adivinha: detecta-se o caso suspeito para o chamador
 * PERGUNTAR ao GET, que e a autoridade. Sem perda (o WS nao apaga o que talvez
 * nao carregue) e sem fantasma (quem decide que acabou e o GET).
 *
 * Nao ha risco de laco: se o GET tambem vier vazio, o cache passa a nao ter o
 * atendimento, e o proximo broadcast deixa de ser suspeito.
 */
export function broadcastApagaAtendimento(
  anterior: EstablishmentWithProfessionals | null | undefined,
  novo: EstablishmentWithProfessionals | null | undefined
): boolean {
  if (!anterior || !novo) return false;

  const novosPorId = new Map(
    (novo.professionals ?? []).map((p: any) => [p?.id, p])
  );

  for (const antes of anterior.professionals ?? []) {
    const emCurso = (antes as any)?.current_attendance;
    if (!emCurso?.id) continue;

    const agora = novosPorId.get((antes as any).id);
    // O profissional sumiu do snapshot: isso e outra coisa (saiu da loja, ou o
    // payload veio recortado) e nao cabe a esta guarda decidir.
    if (!agora) continue;
    if (agora.current_attendance?.id) continue;

    // O servidor DISSE algo sobre este atendimento — ele so mudou de lugar.
    // Silencio e o que nos interessa, nao mudanca.
    const falouDele = (agora.waiting_list ?? []).some(
      (a: any) => a?.id === emCurso.id
    );
    if (falouDele) continue;

    return true;
  }

  return false;
}
