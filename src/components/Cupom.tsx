import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { CardDeCampanha } from "@components/CardDeCampanha";
import { PromocaoEncerradaModal, type MotivoDaPromocao } from "@components/PromocaoEncerradaModal";
import {
  usarCupom,
  minhasCampanhas,
  mensagemDoCupom,
  beneficioDaCampanha,
  validadeDaCampanha,
  estadoDaCampanha,
  validadeAoAtivar,
  estadoDoPrazo,
  motivoDoErro,
  diasDaCampanha,
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
  const [ativado, setAtivado] = useState<Campanha | null>(null);
  const [saibaMais, setSaibaMais] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDaPromocao | null>(null);

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
      const fora = estadoDoPrazo(nova);
      if (fora) {
        setMotivo(fora);
        setCodigo("");
        return;
      }
      setCampanhas((atuais) => [nova, ...atuais.filter((c) => c.id !== nova.id)]);
      setCodigo("");
      setAtivado(nova);
      setSaibaMais(false);
    } catch (e) {
      const fora = motivoDoErro(e);
      if (fora) {
        setMotivo(fora);
        setCodigo("");
      } else {
        setErro(mensagemDoCupom(e));
      }
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

      {ativado && validadeAoAtivar(ativado) && (
        <View testID="cupom-validade" className="mt-3 bg-vupth-greenTint rounded-card px-4 py-3">
          <Text className="font-heading text-sm text-vupth-textPrimary">{validadeAoAtivar(ativado)}</Text>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">Se não usar até lá, perde o cupom.</Text>
          {saibaMais ? (
            <View testID="cupom-saiba-mais" className="mt-2">
              <Text className="font-body text-xs text-vupth-textSecondary">Vale {diasDaCampanha(ativado)}, para qualquer serviço.</Text>
              {ativado.description ? (
                <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{ativado.description}</Text>
              ) : null}
            </View>
          ) : (
            <NwButton
              title="Saiba mais"
              variant="vupthOutline"
              className="h-12 mt-2"
              testID="cupom-saiba-mais-abrir"
              onPress={() => setSaibaMais(true)}
            />
          )}
        </View>
      )}

      {campanhas.length > 0 && (
        <View className="mt-6 gap-2">
          <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEUS CUPONS</Text>
          {campanhas.map((c) => (
            <CardDeCampanha
              key={c.id}
              campanha={c}
              linha={[beneficioDaCampanha(c), validadeDaCampanha(c), estadoDaCampanha(c)].filter(Boolean).join(" · ")}
              estado={c.status === "EXPIRED" ? "ENCERRADA" : estadoDoPrazo(c)}
              onPress={() => setMotivo(c.status === "EXPIRED" ? "ENCERRADA" : estadoDoPrazo(c))}
              testID="cupom-campanha"
              acessibilidade={c.name}
            />
          ))}
        </View>
      )}
      <PromocaoEncerradaModal motivo={motivo} aoFechar={() => setMotivo(null)} />
    </View>
  );
}
