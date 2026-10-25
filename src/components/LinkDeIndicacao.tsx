import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { CardDeCampanha } from "@components/CardDeCampanha";
import { PromocaoEncerradaModal, type MotivoDaPromocao } from "@components/PromocaoEncerradaModal";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import {
  meuLinkDeIndicacao,
  clientesQueChegaram,
  aReceber,
  aLiberar,
  andamentoDaCampanha,
  participarDaCampanha,
  mensagemDaAdesao,
  type MeuLink,
} from "@lib/indicacao";
import {
  campanhasAtivas,
  beneficioDaCampanha,
  validadeDaCampanha,
  validadeAoAtivar,
  diasDaCampanha,
  estadoDoPrazo,
  motivoDoErro,
  type Campanha,
} from "@lib/campanhas";

// link-de-indicacao (DEC-70): o link para compartilhar e quantos clientes
// chegaram por ele. Sem resposta da API, o bloco nao aparece (o cupom segue).
// compartilhe-e-ganhe-no-partner (DEC-113): as campanhas de link entram por
// adesao ("Participar"); cada uma traz o link dela e o andamento.
type Props = {
  carregar?: () => Promise<MeuLink>;
  compartilhar?: typeof compartilharComAviso;
  listarCampanhas?: () => Promise<Campanha[]>;
  participar?: (id: string) => Promise<void>;
};

export function LinkDeIndicacao({
  carregar = meuLinkDeIndicacao,
  compartilhar = compartilharComAviso,
  listarCampanhas = campanhasAtivas,
  participar = participarDaCampanha,
}: Props) {
  const [meu, setMeu] = useState<MeuLink | null>(null);
  const [abertas, setAbertas] = useState<Campanha[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoDaPromocao | null>(null);
  const [explicando, setExplicando] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    carregar()
      .then(setMeu)
      .catch(() => {});
  }, [carregar]);

  useEffect(() => {
    recarregar();
    listarCampanhas()
      .then((l) => setAbertas(l.filter((c) => c.type === "REFERRAL_BONUS")))
      .catch(() => {});
  }, [recarregar, listarCampanhas]);

  if (!meu) return null;
  const receber = aReceber(meu);
  const liberar = aLiberar(meu);
  const dasCampanhas = meu.campaigns ?? [];
  const aParticipar = abertas.filter((c) => !dasCampanhas.some((d) => d.campaign_id === c.id));
  const mensagem = { titulo: "Vupth", mensagem: "Entre na fila da barbearia pelo app Vupth:" };

  const entrar = async (c: Campanha) => {
    setErro(null);
    const fora = estadoDoPrazo(c);
    if (fora) {
      setMotivo(fora);
      return;
    }
    try {
      await participar(c.id);
      setExplicando(null);
      recarregar();
    } catch (e) {
      const fora = motivoDoErro(e);
      if (fora) setMotivo(fora);
      else setErro(mensagemDaAdesao(e));
    }
  };

  // promocoes-um-cartao-por-campanha (Andre, 24/10): UM cartao por campanha, com UM
  // Compartilhar; o cartao "SEU LINK" separado some quando ha campanha de que ele
  // participa. O link geral so aparece enquanto nao participa de nenhuma.
  const resumo = (
    <>
      <Text testID="link-indicacao-clientes" className={`font-body text-xs text-vupth-textSecondary mt-1 ${receber ? "" : "mb-1"}`}>
        {clientesQueChegaram(meu.referred_clients)}
      </Text>
      {receber ? (
        <Text testID="link-indicacao-receber" className="font-heading text-xs text-vupth-textPrimary mt-1">
          {receber}
        </Text>
      ) : null}
      {liberar ? (
        <Text testID="link-indicacao-liberar" className="font-body text-xs text-vupth-textSecondary mt-1">
          {liberar}
        </Text>
      ) : null}
    </>
  );

  return (
    <View testID="link-indicacao" className="mb-6">
      {dasCampanhas.length === 0 ? (
        <View className="bg-vupth-surface rounded-card px-4 py-4">
          <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEU LINK</Text>
          <Text selectable testID="link-indicacao-link" className="font-heading text-sm text-vupth-textPrimary mt-1">
            {meu.link}
          </Text>
          {resumo}
          <NwButton
            title="Compartilhar"
            className="mt-3"
            testID="link-indicacao-compartilhar"
            onPress={() => compartilhar(meu.link, mensagem)}
          />
        </View>
      ) : (
        <>
          {dasCampanhas.map((c) => {
            const base = abertas.find((a) => a.id === c.campaign_id);
            return (
              <View key={c.campaign_id} testID="link-indicacao-campanha" className="mb-4">
                <CardDeCampanha
                  campanha={base ?? { type: "REFERRAL_BONUS", name: c.name }}
                  linha={andamentoDaCampanha(c)}
                >
                  <Text
                    selectable
                    testID={`link-indicacao-link-${c.campaign_id}`}
                    className="font-heading text-xs text-vupth-textPrimary mt-2"
                  >
                    {c.link}
                  </Text>
                  <NwButton
                    title="Compartilhar link"
                    variant="vupthOutline"
                    className="h-12 mt-3"
                    testID="link-indicacao-campanha-compartilhar"
                    onPress={() => compartilhar(c.link, mensagem)}
                  />
                </CardDeCampanha>
              </View>
            );
          })}
          <View className="px-1 mb-2">{resumo}</View>
        </>
      )}

      {aParticipar.map((c) => (
        <View key={c.id} className="mt-4">
          <CardDeCampanha
            campanha={c}
            linha={[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
            estado={estadoDoPrazo(c)}
            onPress={() => setExplicando((atual) => (atual === c.id ? null : c.id))}
            testID="link-indicacao-aberta"
            acessibilidade={c.name}
          >
            {explicando === c.id && (
              <View testID="link-indicacao-explicacao" className="mt-3 gap-1">
                {c.description ? (
                  <Text className="font-body text-xs text-vupth-textSecondary">{c.description}</Text>
                ) : null}
                <Text className="font-body text-xs text-vupth-textSecondary">
                  {`Vale ${diasDaCampanha(c)}, para qualquer serviço.`}
                </Text>
                {validadeAoAtivar(c) ? (
                  <Text className="font-body text-xs text-vupth-textSecondary">{`${validadeAoAtivar(c)}.`}</Text>
                ) : null}
                <NwButton
                  title="Participar"
                  className="h-12 mt-2"
                  testID="link-indicacao-participar"
                  onPress={() => entrar(c)}
                />
              </View>
            )}
          </CardDeCampanha>
        </View>
      ))}
      <PromocaoEncerradaModal motivo={motivo} aoFechar={() => setMotivo(null)} />
      {erro ? (
        <Text testID="link-indicacao-erro" className="font-body text-xs text-vupth-textSecondary mt-2">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}
