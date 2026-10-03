/**
 * Se o endereco da loja ja virou ponto no mapa (loja-sem-coordenada, S25;
 * contrato BAK d215d5a). So LOCATED entra na busca por proximidade; PENDING e
 * o geocoding na fila (segundos); UNRESOLVED e o geocoder que nao achou — o
 * dono manda a posicao do aparelho ou corrige o endereco. Campo opcional:
 * backend antigo nao manda, e ai nao ha o que avisar.
 */
export type LocationStatus = "LOCATED" | "PENDING" | "UNRESOLVED";

type ComStatus = { locationStatus?: string | null } | null | undefined;

export function situacaoDoPonto(endereco: ComStatus): "sem-ponto" | "localizando" | null {
  switch (endereco?.locationStatus) {
    case "UNRESOLVED":
      return "sem-ponto";
    case "PENDING":
      return "localizando";
    default:
      return null;
  }
}

/** O aviso depois de salvar o endereco, conforme o que o backend devolveu. */
export function mensagemDoEnderecoSalvo(endereco: ComStatus): string {
  if (endereco?.locationStatus === "LOCATED") {
    return "Sua loja já aparece para quem busca por perto.";
  }
  if (situacaoDoPonto(endereco) === "sem-ponto") {
    return (
      "Não achamos o endereço no mapa: sua loja não aparece para quem busca por perto. " +
      "Na loja, toque em \"Usar minha localização\" e salve de novo, ou confira o endereço."
    );
  }
  return "Estamos localizando sua loja no mapa — leva alguns segundos.";
}
