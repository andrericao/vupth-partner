import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { CardDeCampanha } from "@components/CardDeCampanha";
import { PromocaoEncerradaModal, type MotivoDaPromocao } from "@components/PromocaoEncerradaModal";
import {
  usarCupom,
  minhasCampanhas,
  campanhasAtivas,
  mensagemDoCupom,
  CUPOM_ATIVADO,
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
// cupons ja ativados. promocoes-ativar-e-codigo (Andre, 24/10): "Ativar", e o ticket mostra o codigo. As dependencias entram por props para o teste.
type Props = {
  usar?: (codigo: string) => Promise<Campanha>;
  listar?: () => Promise<Campanha[]>;
  /** promocoes-ticket-do-profissional-como-cliente: as campanhas no ar, para o ticket com Ativar. */
  disponiveis?: () => Promise<Campanha[]>;
};

export function Cupom({ usar = usarCupom, listar = minhasCampanhas, disponiveis = campanhasAtivas }: Props) {
  const [codigo, setCodigo] = useState("");
  const [usando, setUsando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [ativado, setAtivado] = useState<Campanha | null>(null);
  const [saibaMais, setSaibaMais] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDaPromocao | null>(null);
  const [noAr, setNoAr] = useState<Campanha[]>([]);
  const [erroDoTicket, setErroDoTicket] = useState<{ id: string; mensagem: string } | null>(null);
  const [ativandoId, setAtivandoId] = useState<string | null>(null);

  useEffect(() => {
    listar()
      .then(setCampanhas)
      .catch(() => {});
  }, [listar]);

  useEffect(() => {
    disponiveis()
      .then(setNoAr)
      .catch(() => {});
  }, [disponiveis]);

  // promocoes-ticket-do-profissional-como-cliente (Andre, 25/10): como um cliente, ele ve o
  // ticket da campanha (cupom: desconto ou sem taxa) com o codigo e o botao Ativar. So entra
  // quem cumpre os requisitos: o Backend decide e devolve a frase, o app mostra.
  const ativaveis = noAr.filter(
    (c) =>
      c.type !== "REFERRAL_BONUS" &&
      !!c.code &&
      !campanhas.some((m) => m.id === c.id) &&
      !estadoDoPrazo(c)
  );

  async function ativarDoTicket(c: Campanha) {
    setErroDoTicket(null);
    setAtivandoId(c.id);
    try {
      const nova = await usar(c.code as string);
      setCampanhas((atuais) => [nova, ...atuais.filter((x) => x.id !== nova.id)]);
      setAtivado(nova);
      setSaibaMais(false);
    } catch (e) {
      const fora = motivoDoErro(e);
      if (fora) setMotivo(fora);
      else setErroDoTicket({ id: c.id, mensagem: mensagemDoCupom(e) });
    } finally {
      setAtivandoId(null);
    }
  }

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
      <NwButton title="Ativar" onPress={aoUsar} isLoading={usando} testID="cupom-usar" />

      {ativado && (
        <Text testID="cupom-ativado" className="font-heading text-sm text-vupth-textPrimary mt-3">
          {CUPOM_ATIVADO}
        </Text>
      )}
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

      {(campanhas.length > 0 || ativaveis.length > 0) && (
        <View className="mt-6 gap-2">
          <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEUS CUPONS</Text>
          {ativaveis.map((c) => (
            <View key={c.id} testID="cupom-ativavel">
              <CardDeCampanha
                campanha={c}
                linha={[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
                codigo={c.code}
                testID="cupom-ativavel-card"
                acessibilidade={c.name}
              >
                <NwButton
                  title="Ativar"
                  variant="vupthOutline"
                  className="h-12 mt-3"
                  isLoading={ativandoId === c.id}
                  testID={`cupom-ativar-${c.id}`}
                  onPress={() => ativarDoTicket(c)}
                />
                {erroDoTicket?.id === c.id ? (
                  <Text testID={`cupom-ativar-erro-${c.id}`} className="font-body text-xs text-vupth-textSecondary mt-2">
                    {erroDoTicket.mensagem}
                  </Text>
                ) : null}
              </CardDeCampanha>
            </View>
          ))}
          {campanhas.map((c) => (
            <CardDeCampanha
              key={c.id}
              campanha={c}
              linha={[beneficioDaCampanha(c), validadeDaCampanha(c), estadoDaCampanha(c)].filter(Boolean).join(" · ")}
              estado={c.status === "EXPIRED" ? "ENCERRADA" : estadoDoPrazo(c)}
              codigo={c.code}
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
