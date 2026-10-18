import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import {
  usarCupom,
  minhasCampanhas,
  mensagemDoCupom,
  beneficioDaCampanha,
  validadeDaCampanha,
  type Campanha,
} from "@lib/campanhas";

// cupom-no-app (DEC-61, DEC-63): campo do cupom, um botao de uma palavra e os
// cupons ja usados. As dependencias entram por props para o teste.
type Props = {
  usar?: (codigo: string) => Promise<Campanha>;
  listar?: () => Promise<Campanha[]>;
};

export function Cupom({ usar = usarCupom, listar = minhasCampanhas }: Props) {
  const [codigo, setCodigo] = useState("");
  const [usando, setUsando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  useEffect(() => {
    listar()
      .then(setCampanhas)
      .catch(() => {});
  }, [listar]);

  async function aoUsar() {
    if (!codigo.trim()) {
      setErro("Digite o cupom.");
      return;
    }
    setUsando(true);
    setErro(null);
    try {
      const nova = await usar(codigo);
      setCampanhas((atuais) => [nova, ...atuais.filter((c) => c.id !== nova.id)]);
      setCodigo("");
    } catch (e) {
      setErro(mensagemDoCupom(e));
    } finally {
      setUsando(false);
    }
  }

  return (
    <View>
      <NwInput
        label="Cupom"
        placeholder="Ex: VUPTH10"
        value={codigo}
        onChangeText={(t) => {
          setCodigo(t);
          setErro(null);
        }}
        autoCapitalize="characters"
        error={erro ?? undefined}
        testID="cupom-codigo"
      />
      <NwButton title="Usar" onPress={aoUsar} isLoading={usando} testID="cupom-usar" />

      {campanhas.length > 0 && (
        <View className="mt-6 gap-2">
          <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEUS CUPONS</Text>
          {campanhas.map((c) => (
            <View key={c.id} testID="cupom-campanha" className="bg-vupth-surface rounded-card px-4 py-3">
              <Text className="font-heading text-sm text-vupth-textPrimary">{c.name}</Text>
              <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">
                {[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
