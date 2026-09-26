import * as Location from "expo-location";

// "Usar minha localizacao" no endereco da loja (build 1.4.0). Sem coordenada a
// loja some da busca por proximidade (S25); o backend aceita latitude e
// longitude no POST do endereco — os dois juntos, e (0,0) e recusado.

const UFS: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** "São Paulo" -> "SP"; "mg" -> "MG"; desconhecido -> "". */
export function siglaDaUf(regiao: string | null | undefined): string {
  if (!regiao) return "";
  const t = semAcento(regiao);
  if (/^[a-z]{2}$/.test(t) && Object.values(UFS).includes(t.toUpperCase())) return t.toUpperCase();
  return UFS[t] ?? "";
}

export type EnderecoSugerido = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

export function enderecoDaPosicao(g: Location.LocationGeocodedAddress): EnderecoSugerido {
  return {
    street: g.street ?? "",
    number: g.streetNumber ?? "",
    neighborhood: g.district ?? "",
    city: g.city ?? g.subregion ?? "",
    state: siglaDaUf(g.region),
    zipCode: g.postalCode ?? "",
  };
}

type Dep = Pick<
  typeof Location,
  "requestForegroundPermissionsAsync" | "getCurrentPositionAsync" | "reverseGeocodeAsync" | "Accuracy"
>;

/**
 * A posicao do aparelho e, quando o sistema consegue, o endereco do lugar
 * (para preencher o que o dono ainda nao digitou). O endereco e bonus: se o
 * geocoder falhar, a coordenada vale sozinha.
 */
export async function pegarLocalizacao(
  deps: { location?: Dep } = {}
): Promise<{ coordenada: { latitude: number; longitude: number }; endereco: EnderecoSugerido | null }> {
  const L = deps.location ?? Location;
  const permissao = await L.requestForegroundPermissionsAsync();
  if (!permissao.granted) {
    throw new Error("Permita o acesso à localização para usar a posição da loja.");
  }
  const { coords } = await L.getCurrentPositionAsync({ accuracy: L.Accuracy.Balanced });
  if (coords.latitude === 0 && coords.longitude === 0) {
    throw new Error("Não foi possível ler a posição do aparelho. Tente de novo ao ar livre.");
  }
  const coordenada = {
    latitude: Math.round(coords.latitude * 1e6) / 1e6,
    longitude: Math.round(coords.longitude * 1e6) / 1e6,
  };
  let endereco: EnderecoSugerido | null = null;
  try {
    const [g] = await L.reverseGeocodeAsync(coordenada);
    if (g) endereco = enderecoDaPosicao(g);
  } catch {
    // sem geocoder no aparelho: segue so com a coordenada
  }
  return { coordenada, endereco };
}

/** Junta o sugerido pelo aparelho sem apagar o que o dono ja digitou. */
export function preencherVazios(atual: EnderecoSugerido, sugerido: EnderecoSugerido): EnderecoSugerido {
  const r = { ...atual };
  (Object.keys(r) as (keyof EnderecoSugerido)[]).forEach((k) => {
    if (!r[k].trim() && sugerido[k]) r[k] = sugerido[k];
  });
  return r;
}
