import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { buscarAgendaAberta, faltaAbrirProximaSemana, janelaDeAbertura } from "@lib/agendaAberta";
import { confirmar } from "@lib/confirmar";
import { isoDate } from "@lib/time";

type Deps = {
  agora?: () => Date;
  buscar?: typeof buscarAgendaAberta;
  perguntar?: typeof confirmar;
  ir?: (rota: string) => void;
};

/**
 * abrir-agenda (DEC-130): a caixa da vespera. No domingo, com o app aberto, o
 * profissional em modo agenda que nao abriu nenhum dia da semana que comeca na
 * segunda recebe a pergunta "Abrir os dias?". E o par do push AGENDA_NOT_OPEN
 * (domingo 10h), para quem esta com o app aberto. Uma vez por dia.
 */
export function useAvisoDaVespera(modoAgenda: boolean, deps: Deps = {}) {
  const { agora = () => new Date(), buscar = buscarAgendaAberta, perguntar = confirmar } = deps;
  const ir = deps.ir ?? ((rota: string) => router.push(rota as any));
  const jaAvisou = useRef<string | null>(null);

  useEffect(() => {
    if (!modoAgenda) return;
    const hoje = agora();
    if (hoje.getDay() !== 0) return;
    const dia = isoDate(hoje);
    if (jaAvisou.current === dia) return;
    jaAvisou.current = dia;
    const { from } = janelaDeAbertura(hoje);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
    buscar(from, isoDate(fim))
      .then(async (dias) => {
        if (!faltaAbrirProximaSemana(hoje, dias)) return;
        const abrir = await perguntar({
          titulo: "Agenda da semana que vem",
          mensagem: "Você ainda não abriu nenhum dia da semana que vem. Abrir agora?",
          confirmar: "Abrir os dias",
          cancelar: "Agora não",
        });
        if (abrir) ir("/(professional)/agenda");
      })
      .catch(() => {});
    // so ao entrar em modo agenda / abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoAgenda]);
}
