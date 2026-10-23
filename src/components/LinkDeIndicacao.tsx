import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
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
import { campanhasAtivas, beneficioDaCampanha, validadeDaCampanha, estadoDoPrazo, type Campanha } from "@lib/campanhas";

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

  const entrar = async (c: Campanha) => {
    setErro(null);
    const fora = estadoDoPrazo(c);
    if (fora) {
      setMotivo(fora);
      return;
    }
    try {
      await participar(c.id);
      recarregar();
    } catch (e) {
      setErro(mensagemDaAdesao(e));
    }
  };

  return (
    <View testID="link-indicacao" className="bg-vupth-surface rounded-card px-4 py-4 mb-6">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEU LINK</Text>
      <Text selectable testID="link-indicacao-link" className="font-heading text-sm text-vupth-textPrimary mt-1">
        {meu.link}
      </Text>
      <Text
        testID="link-indicacao-clientes"
        className={`font-body text-xs text-vupth-textSecondary mt-1 ${receber ? "" : "mb-3"}`}
      >
        {clientesQueChegaram(meu.referred_clients)}
      </Text>
      {receber ? (
        <Text testID="link-indicacao-receber" className="font-heading text-xs text-vupth-textPrimary mt-1 mb-3">
          {receber}
        </Text>
      ) : null}
      {liberar ? (
        <Text testID="link-indicacao-liberar" className="font-body text-xs text-vupth-textSecondary mb-3">
          {liberar}
        </Text>
      ) : null}
      <NwButton
        title="Compartilhar"
        testID="link-indicacao-compartilhar"
        onPress={() =>
          compartilhar(meu.link, {
            titulo: "Vupth",
            mensagem: "Entre na fila da barbearia pelo app Vupth:",
          })
        }
      />
      {dasCampanhas.map((c) => (
        <View key={c.campaign_id} testID="link-indicacao-campanha" className="mt-4">
          <Text className="font-heading text-sm text-vupth-textPrimary">{c.name}</Text>
          <Text selectable className="font-body text-xs text-vupth-textSecondary mt-0.5">
            {c.link}
          </Text>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5 mb-2">{andamentoDaCampanha(c)}</Text>
          <NwButton
            title="Compartilhar"
            variant="vupthOutline"
            className="h-12"
            testID="link-indicacao-campanha-compartilhar"
            onPress={() =>
              compartilhar(c.link, {
                titulo: "Vupth",
                mensagem: "Entre na fila da barbearia pelo app Vupth:",
              })
            }
          />
        </View>
      ))}
      {aParticipar.map((c) => (
        <View key={c.id} testID="link-indicacao-aberta" className="mt-4">
          <Text className="font-heading text-sm text-vupth-textPrimary">{c.name}</Text>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5 mb-2">
            {[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
          </Text>
          <NwButton
            title="Participar"
            variant="vupthOutline"
            className="h-12"
            testID="link-indicacao-participar"
            onPress={() => entrar(c)}
          />
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
