import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { NwButton } from "@components/nw/Button";
import { getApiErrorMessage } from "@lib/api";
import { rotuloDoMes } from "@lib/mesDaAgenda";
import {
  abrirDias,
  buscarAgendaAberta,
  janelaDeAbertura,
  podeAbrir,
  repetirAgendaPadrao,
  type DiaDaAgenda,
} from "@lib/agendaAberta";

type Props = {
  hoje?: Date;
  buscar?: typeof buscarAgendaAberta;
  abrir?: typeof abrirDias;
  repetir?: typeof repetirAgendaPadrao;
};

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function diaDoMes(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}

function diaDaSemana(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).getDay();
}

/**
 * abrir-agenda (Andre, 31/10, DEC-130): os proximos 31 dias como dots. Cheio =
 * dia que voce abriu; vazio = dia para abrir (toque para marcar); apagado = dia
 * que nao da para abrir (loja fechada). Abre os marcados, ou repete a agenda
 * padrao para o mes todo. Nada amarra: pode abrir so alguns dias.
 */
export function AbrirAgenda({
  hoje = new Date(),
  buscar = buscarAgendaAberta,
  abrir = abrirDias,
  repetir = repetirAgendaPadrao,
}: Props) {
  const [dias, setDias] = useState<DiaDaAgenda[] | null>(null);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);
  const { from, to } = janelaDeAbertura(hoje);

  // `versao` sobe depois de abrir: o efeito busca de novo (sem setState no corpo).
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let vivo = true;
    buscar(from, to)
      .then((d) => vivo && setDias(d))
      .catch(() => {
        if (!vivo) return;
        setDias([]);
        setMensagem({ texto: "Não foi possível carregar a sua agenda.", erro: true });
      });
    return () => {
      vivo = false;
    };
  }, [buscar, from, to, versao]);

  const tocar = (d: DiaDaAgenda) => {
    if (!podeAbrir(d)) return;
    setMarcados((m) => (m.includes(d.date) ? m.filter((x) => x !== d.date) : [...m, d.date]));
  };

  const executar = async (acao: () => Promise<void>, ok: string) => {
    setSalvando(true);
    setMensagem(null);
    try {
      await acao();
      setMarcados([]);
      setMensagem({ texto: ok, erro: false });
      setVersao((v) => v + 1);
    } catch (e: any) {
      setMensagem({ texto: getApiErrorMessage(e, "Não foi possível abrir a agenda."), erro: true });
    } finally {
      setSalvando(false);
    }
  };

  if (!dias) return null;
  const abertos = dias.filter((d) => d.openedByMe).length;
  const soSolicitacoes = dias.some((d) => d.openedByMe && !d.agendaReleased);
  const escolhidos = dias.filter((d) => marcados.includes(d.date));
  const rotulo = rotuloDoMes(dias.map((d) => d.date));

  return (
    <View testID="abrir-agenda" className="bg-vupth-surface rounded-card p-4 gap-3">
      <Text className="font-heading text-base text-vupth-textPrimary">Abrir a agenda</Text>
      {!!rotulo && (
        <Text testID="agenda-mes-ano" className="font-heading text-sm text-vupth-textSecondary">
          {rotulo}
        </Text>
      )}
      <Text className="font-body text-xs text-vupth-textSecondary">
        {abertos === 0
          ? "Você ainda não abriu nenhum dia. Toque nos dias que quer abrir (até 1 mês) ou repita a sua agenda padrão."
          : `Você abriu ${abertos} ${abertos === 1 ? "dia" : "dias"}. Toque nos vazios para abrir mais.`}
      </Text>
      {soSolicitacoes && (
        <Text testID="agenda-so-solicitacoes" className="font-body text-xs text-vupth-textSecondary">
          Nos dias abertos, por enquanto só chegam solicitações. Para o cliente agendar direto, monte a sua agenda.
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {dias.map((d) => {
          const marcado = marcados.includes(d.date);
          const aberto = d.openedByMe;
          const livre = podeAbrir(d);
          return (
            <Pressable
              key={d.date}
              testID={`agenda-dot-${d.date}`}
              accessibilityRole="button"
              accessibilityLabel={`Dia ${diaDoMes(d.date)}, ${
                aberto ? "aberto" : livre ? (marcado ? "marcado" : "fechado, toque para abrir") : "indisponível"
              }`}
              disabled={!livre}
              onPress={() => tocar(d)}
              className={`w-10 h-12 rounded-xl items-center justify-center border ${
                aberto || marcado
                  ? "bg-vupth-selecionado border-vupth-selecionado"
                  : livre
                    ? "border-vupth-border"
                    : "border-vupth-border opacity-40"
              }`}
            >
              <Text
                className={`font-body text-[10px] ${
                  aberto || marcado ? "text-vupth-onSelecionadoBranco" : "text-vupth-textSecondary"
                }`}
              >
                {SEMANA[diaDaSemana(d.date)]}
              </Text>
              <Text
                className={`font-body text-sm ${
                  aberto || marcado ? "text-vupth-onSelecionadoBranco" : "text-vupth-textPrimary"
                }`}
              >
                {diaDoMes(d.date)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!mensagem && (
        <Text
          testID="abrir-agenda-mensagem"
          className={`font-body text-sm ${mensagem.erro ? "text-vupth-danger" : "text-vupth-textPrimary"}`}
        >
          {mensagem.texto}
        </Text>
      )}
      <NwButton
        title={
          escolhidos.length > 0
            ? `Abrir ${escolhidos.length} ${escolhidos.length === 1 ? "dia" : "dias"}`
            : "Abrir os dias marcados"
        }
        testID="abrir-agenda-abrir"
        disabled={salvando || escolhidos.length === 0}
        onPress={() => executar(() => abrir(escolhidos), "Dias abertos.")}
      />
      <NwButton
        title="Repetir a minha agenda padrão"
        variant="vupthOutline"
        testID="abrir-agenda-repetir"
        disabled={salvando}
        onPress={() => executar(() => repetir(from, to), "Agenda padrão aberta para o mês.")}
      />
    </View>
  );
}
