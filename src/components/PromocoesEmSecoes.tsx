import { useCallback, useEffect, useState, type ReactNode } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { CardDeCampanha } from "@components/CardDeCampanha";
import { PromocaoEncerradaModal, type MotivoDaPromocao } from "@components/PromocaoEncerradaModal";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import {
  meuLinkDeIndicacao,
  clientesQueChegaram,
  aReceber,
  andamentoDaCampanha,
  participarDaCampanha,
  mensagemDaAdesao,
  type MeuLink,
} from "@lib/indicacao";
import {
  campanhasAtivas,
  minhasCampanhas,
  usarCupom,
  mensagemDoCupom,
  beneficioDaCampanha,
  validadeDaCampanha,
  validadeAoAtivar,
  estadoDaCampanha,
  diasDaCampanha,
  estadoDoPrazo,
  motivoDoErro,
  type Campanha,
} from "@lib/campanhas";
import { separarEmSecoes, dinheiroDaIndicacao, cupomPassado } from "@lib/secoesDePromocoes";

// promocoes-em-secoes (Andre, 05/11): a tela Promocoes em Ativas, Disponiveis e
// Passadas (regras em secoesDePromocoes.ts). Sem campanha de link, o cartao "SEU
// LINK" geral fica em cima, como antes (link-de-indicacao, DEC-70). Cada carga
// falha sozinha: sem /referrals/me os cupons aparecem; sem os cupons, o link.
type Props = {
  carregar?: () => Promise<MeuLink>;
  listarNoAr?: () => Promise<Campanha[]>;
  listarCupons?: () => Promise<Campanha[]>;
  participar?: (id: string) => Promise<void>;
  usar?: (codigo: string) => Promise<Campanha>;
  compartilhar?: typeof compartilharComAviso;
  /** Muda quando outro bloco (o campo Cupom) ativou algo: recarrega. */
  versao?: number;
  /** Avisa que a pessoa entrou numa campanha (o carrossel da Home deixa de mostra-la). */
  aoMudar?: () => void;
};

const MENSAGEM = { titulo: "Vupth", mensagem: "Entre na fila da barbearia pelo app Vupth:" };

function Secao({ titulo, testID, children }: { titulo: string; testID: string; children: ReactNode }) {
  return (
    <View testID={testID} className="mt-6 gap-3">
      <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">{titulo}</Text>
      {children}
    </View>
  );
}

export function PromocoesEmSecoes({
  carregar = meuLinkDeIndicacao,
  listarNoAr = campanhasAtivas,
  listarCupons = minhasCampanhas,
  participar = participarDaCampanha,
  usar = usarCupom,
  compartilhar = compartilharComAviso,
  versao = 0,
  aoMudar,
}: Props) {
  const [meu, setMeu] = useState<MeuLink | null>(null);
  const [noAr, setNoAr] = useState<Campanha[]>([]);
  const [cupons, setCupons] = useState<Campanha[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [erroDoTicket, setErroDoTicket] = useState<{ id: string; mensagem: string } | null>(null);
  const [ativandoId, setAtivandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoDaPromocao | null>(null);
  const [explicando, setExplicando] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    carregar()
      .then(setMeu)
      .catch(() => {});
    listarNoAr()
      .then(setNoAr)
      .catch(() => {});
    listarCupons()
      .then(setCupons)
      .catch(() => {});
  }, [carregar, listarNoAr, listarCupons]);

  useEffect(() => {
    recarregar();
  }, [recarregar, versao]);

  const s = separarEmSecoes({ meu, noAr, cupons });
  const dinheiro = dinheiroDaIndicacao(meu);
  const semCampanhaDeLink = (meu?.campaigns ?? []).length === 0;

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
      aoMudar?.();
    } catch (e) {
      const recusa = motivoDoErro(e);
      if (recusa) setMotivo(recusa);
      else setErro(mensagemDaAdesao(e));
    }
  };

  const ativar = async (c: Campanha) => {
    setErroDoTicket(null);
    setAtivandoId(c.id);
    try {
      const nova = await usar(c.code as string);
      setCupons((atuais) => [nova, ...atuais.filter((x) => x.id !== nova.id)]);
      aoMudar?.();
    } catch (e) {
      const recusa = motivoDoErro(e);
      if (recusa) setMotivo(recusa);
      else setErroDoTicket({ id: c.id, mensagem: mensagemDoCupom(e) });
    } finally {
      setAtivandoId(null);
    }
  };

  // O dinheiro mora no bloco da campanha quando ha uma so; com varias, um total embaixo.
  const linhasDoDinheiro = (
    <>
      {dinheiro.receber ? (
        <Text testID="link-indicacao-receber" className="font-heading text-xs text-vupth-onGreenTint mt-2">
          {dinheiro.receber}
        </Text>
      ) : null}
      {dinheiro.liberar ? (
        <Text testID="link-indicacao-liberar" className="font-body text-xs text-vupth-onGreenTint mt-1">
          {dinheiro.liberar}
        </Text>
      ) : null}
    </>
  );
  const dinheiroNoCartao = s.linksAtivos.length === 1;

  const temAtivas = s.linksAtivos.length + s.cuponsAtivos.length > 0;
  const temDisponiveis = s.linksDisponiveis.length + s.cuponsDisponiveis.length > 0;
  const temPassadas = s.linksPassados.length + s.cuponsPassados.length > 0;

  return (
    <View testID="link-indicacao" className="mb-6">
      {meu && semCampanhaDeLink ? (
        <View testID="link-indicacao-geral" className="bg-vupth-surface rounded-card px-4 py-4">
          <Text className="font-body text-f11 font-bold tracking-wider text-vupth-textSecondary">SEU LINK</Text>
          <Text selectable testID="link-indicacao-link" className="font-heading text-sm text-vupth-textPrimary mt-1">
            {meu.link}
          </Text>
          <Text testID="link-indicacao-clientes" className="font-body text-xs text-vupth-textSecondary mt-1">
            {clientesQueChegaram(meu.referred_clients)}
          </Text>
          {aReceber(meu) ? (
            <Text testID="link-indicacao-receber" className="font-heading text-xs text-vupth-textPrimary mt-1">
              {aReceber(meu)}
            </Text>
          ) : null}
          {dinheiro.liberar ? (
            <Text testID="link-indicacao-liberar" className="font-body text-xs text-vupth-textSecondary mt-1">
              {dinheiro.liberar}
            </Text>
          ) : null}
          <NwButton
            title="Compartilhar"
            className="mt-3"
            testID="link-indicacao-compartilhar"
            onPress={() => compartilhar(meu.link, MENSAGEM)}
          />
        </View>
      ) : null}

      {temAtivas ? (
        <Secao titulo="ATIVAS" testID="promocoes-ativas">
          {s.linksAtivos.map(({ link: c, base }) => (
            <View key={c.campaign_id} testID="link-indicacao-campanha">
              <CardDeCampanha campanha={base ?? { type: "REFERRAL_BONUS", name: c.name }} linha={andamentoDaCampanha(c)}>
                <Text
                  selectable
                  testID={`link-indicacao-link-${c.campaign_id}`}
                  className="font-heading text-xs text-vupth-onGreenTint mt-2"
                >
                  {c.link}
                </Text>
                {dinheiroNoCartao ? linhasDoDinheiro : null}
                <NwButton
                  title="Compartilhar link"
                  variant="vupthOutline"
                  className="h-12 mt-3"
                  testID="link-indicacao-campanha-compartilhar"
                  onPress={() => compartilhar(c.link, MENSAGEM)}
                />
              </CardDeCampanha>
            </View>
          ))}
          {!dinheiroNoCartao && s.linksAtivos.length > 1 ? <View className="px-1">{linhasDoDinheiro}</View> : null}
          {s.cuponsAtivos.map((c) => (
            <CardDeCampanha
              key={c.id}
              campanha={c}
              linha={[beneficioDaCampanha(c), validadeDaCampanha(c)].filter(Boolean).join(" · ")}
              estado={estadoDoPrazo(c)}
              codigo={c.code}
              onPress={estadoDoPrazo(c) ? () => setMotivo(estadoDoPrazo(c)) : undefined}
              testID="cupom-campanha"
              acessibilidade={c.name}
            />
          ))}
        </Secao>
      ) : null}

      {temDisponiveis ? (
        <Secao titulo="DISPONÍVEIS" testID="promocoes-disponiveis">
          {s.linksDisponiveis.map((c) => (
            <CardDeCampanha
              key={c.id}
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
                    <Text className="font-body text-xs text-vupth-onGreenTint">{c.description}</Text>
                  ) : null}
                  <Text className="font-body text-xs text-vupth-onGreenTint">
                    {`Vale ${diasDaCampanha(c)}, para qualquer serviço.`}
                  </Text>
                  {validadeAoAtivar(c) ? (
                    <Text className="font-body text-xs text-vupth-onGreenTint">{`${validadeAoAtivar(c)}.`}</Text>
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
          ))}
          {s.cuponsDisponiveis.map((c) => (
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
                  onPress={() => ativar(c)}
                />
                {erroDoTicket?.id === c.id ? (
                  <Text testID={`cupom-ativar-erro-${c.id}`} className="font-body text-xs text-vupth-onGreenTint mt-2">
                    {erroDoTicket.mensagem}
                  </Text>
                ) : null}
              </CardDeCampanha>
            </View>
          ))}
        </Secao>
      ) : null}

      {temPassadas ? (
        <Secao titulo="PASSADAS" testID="promocoes-passadas">
          {s.linksPassados.map(({ link: c, base }) => (
            <CardDeCampanha
              key={c.campaign_id}
              campanha={base ?? { type: "REFERRAL_BONUS", name: c.name }}
              linha={andamentoDaCampanha(c)}
              estado="ENCERRADA"
              testID="link-indicacao-passada"
            />
          ))}
          {s.cuponsPassados.map((c) => (
            <CardDeCampanha
              key={c.id}
              campanha={c}
              linha={[beneficioDaCampanha(c), validadeDaCampanha(c), estadoDaCampanha(c)].filter(Boolean).join(" · ")}
              estado={cupomPassado(c) && c.status !== "USED" ? "ENCERRADA" : null}
              codigo={c.code}
              onPress={c.status !== "USED" ? () => setMotivo("ENCERRADA") : undefined}
              testID="cupom-passado"
              acessibilidade={c.name}
            />
          ))}
        </Secao>
      ) : null}

      <PromocaoEncerradaModal motivo={motivo} aoFechar={() => setMotivo(null)} />
      {erro ? (
        <Text testID="link-indicacao-erro" className="font-body text-xs text-vupth-textSecondary mt-2">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}
