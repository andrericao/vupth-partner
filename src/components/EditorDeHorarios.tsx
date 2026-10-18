import { useState, useEffect, type ReactNode } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { NwButton } from "@components/nw/Button";
import { DiaDaSemanaLinha, DataEspecialForm, ListaDeExcecoes } from "@components/HorarioSemana";
import { getApiErrorMessage } from "@lib/api";
import { isValidTime } from "@lib/time";
import { avisar } from "@lib/confirmar";
import {
  semanaInicial,
  validarSemana,
  aplicarATodos,
  descreverHorario,
  nomeDoDia,
  isoParaBr,
  hojeIso,
  type DiaSemanal,
  type HorarioDoDia,
  type HorariosDaLoja,
} from "@lib/horarioSemanal";
import { useTema } from "@hooks/useTema";

// A semana + as datas especiais + os proximos dias (S27). Nasceu na tela do
// horario da loja; a agenda-do-profissional (05/10) usa o mesmo editor com as
// chamadas do /professional/me. Quem usa diz de onde le, para onde salva e os
// textos; o editor cuida do resto.
export type ChamadasDeHorario = {
  /** `null` = o backend ainda nao tem a rota (404): mostra `semRota`. */
  buscar: () => Promise<HorariosDaLoja | null>;
  salvarSemana: (dias: DiaSemanal[]) => Promise<HorariosDaLoja>;
  salvarData: (dataIso: string, h: HorarioDoDia) => Promise<HorariosDaLoja>;
  removerData: (dataIso: string) => Promise<void>;
};

type Props = {
  chamadas: ChamadasDeHorario;
  /** Recarrega quando muda (ex.: o id da loja). */
  chave: string | null;
  /** Semeia a 1a semana quando nada foi cadastrado (o horario unico antigo). */
  semente?: { opens: string; closes: string } | null;
  /** Ou a semana inteira, quando nada foi cadastrado (a agenda: o da loja). */
  semanaSemCadastro?: (h: HorariosDaLoja) => DiaSemanal[] | null;
  /** O que mostrar quando o backend ainda nao tem a rota. */
  semRota: ReactNode;
  /** A faixa de "ainda nao cadastrado". */
  avisoSemCadastro: string;
  /** A linha abaixo de "Semana". */
  textoDaSemana: string;
  mensagemSemanaSalva: string;
};

export function EditorDeHorarios({
  chamadas,
  chave,
  semente = null,
  semanaSemCadastro,
  semRota,
  avisoSemCadastro,
  textoDaSemana,
  mensagemSemanaSalva,
}: Props) {
  const { cores } = useTema();
  const [estado, setEstado] = useState<"carregando" | "semana" | "sem-rota" | "erro">("carregando");
  const [horarios, setHorarios] = useState<HorariosDaLoja | null>(null);
  const [semana, setSemana] = useState<DiaSemanal[]>([]);
  const [salvandoSemana, setSalvandoSemana] = useState(false);
  const [salvandoData, setSalvandoData] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  // Relê a cada tentativa: o "Tentar de novo" so incrementa o contador.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    chamadas
      .buscar()
      .then((h) => {
        if (!ativo) return;
        if (!h) {
          setEstado("sem-rota");
          return;
        }
        setHorarios(h);
        setSemana((!h.configured && semanaSemCadastro?.(h)) || semanaInicial(h, semente));
        setEstado("semana");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });
    return () => {
      ativo = false;
    };
    // `semente` so semeia a 1a abertura; as chamadas mudam a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, tentativa]);

  const tentarDeNovo = () => {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  };

  const trocarDia = (dia: DiaSemanal) =>
    setSemana((s) => s.map((d) => (d.day === dia.day ? dia : d)));

  const primeiroAberto = semana.find((d) => !d.closed && isValidTime(d.opens ?? "") && isValidTime(d.closes ?? ""));

  const handleSalvarSemana = async () => {
    const erro = validarSemana(semana);
    if (erro) {
      Alert.alert("Horário inválido", erro);
      return;
    }
    setSalvandoSemana(true);
    try {
      const h = await chamadas.salvarSemana(semana);
      setHorarios(h);
      setSemana(semanaInicial(h, null));
      await avisar({ titulo: "Horário salvo", mensagem: mensagemSemanaSalva });
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o horário."));
    } finally {
      setSalvandoSemana(false);
    }
  };

  const handleAdicionarData = async (dataIso: string, h: HorarioDoDia) => {
    setSalvandoData(true);
    try {
      setHorarios(await chamadas.salvarData(dataIso, h));
      await avisar({
        titulo: "Data especial salva",
        mensagem: `${isoParaBr(dataIso)}: ${descreverHorario(h)}.`,
      });
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar a data."));
    } finally {
      setSalvandoData(false);
    }
  };

  const handleRemoverData = async (dataIso: string) => {
    setRemovendo(dataIso);
    try {
      await chamadas.removerData(dataIso);
      // DELETE devolve 204 sem corpo: relê para os "próximos dias" acompanharem.
      const h = await chamadas.buscar();
      if (h) setHorarios(h);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível remover a data."));
    } finally {
      setRemovendo(null);
    }
  };

  if (estado === "carregando") return <ActivityIndicator className="mt-10" color={cores.textPrimary} />;

  if (estado === "erro") {
    return (
      <View className="mt-6 gap-3">
        <Text className="font-body text-vupth-textSecondary">
          Não foi possível carregar o horário.
        </Text>
        <NwButton title="Tentar de novo" onPress={tentarDeNovo} />
      </View>
    );
  }

  if (estado === "sem-rota") return <>{semRota}</>;

  if (!horarios) return null;

  return (
    <View className="mt-2 gap-6">
      {!horarios.configured && (
        <View className="bg-vupth-greenTint rounded-card p-4">
          <Text className="font-body text-sm text-vupth-onGreenTint">{avisoSemCadastro}</Text>
        </View>
      )}

      <View className="gap-3">
        <Text className="font-heading text-lg text-vupth-textPrimary">Semana</Text>
        <Text className="font-body text-sm text-vupth-textSecondary">{textoDaSemana}</Text>
        {semana.map((d) => (
          <DiaDaSemanaLinha key={d.day} dia={d} onChange={trocarDia} />
        ))}
        {primeiroAberto && (
          <NwButton
            title={`Usar o horário de ${nomeDoDia(primeiroAberto.day).toLowerCase()} nos dias abertos`}
            variant="vupthOutline"
            onPress={() =>
              setSemana((s) =>
                aplicarATodos(s, {
                  opens: primeiroAberto.opens ?? "",
                  closes: primeiroAberto.closes ?? "",
                })
              )
            }
          />
        )}
        <NwButton title="Salvar semana" onPress={handleSalvarSemana} isLoading={salvandoSemana} />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-lg text-vupth-textPrimary">Datas especiais</Text>
        <Text className="font-body text-sm text-vupth-textSecondary">
          Feriado ou um dia com horário diferente. Só vale para aquela data; a semana continua
          igual.
        </Text>
        <ListaDeExcecoes
          excecoes={horarios.exceptions}
          removendo={removendo}
          onRemover={handleRemoverData}
        />
        <DataEspecialForm hoje={hojeIso()} salvando={salvandoData} onAdicionar={handleAdicionarData} />
      </View>

      {horarios.upcoming.length > 0 && (
        <View className="gap-2">
          <Text className="font-heading text-lg text-vupth-textPrimary">Próximos dias</Text>
          {horarios.upcoming.slice(0, 7).map((u) => (
            <View key={u.date} className="flex-row justify-between">
              <Text className="font-body text-sm text-vupth-textSecondary">
                {nomeDoDia(u.day)}, {isoParaBr(u.date).slice(0, 5)}
                {u.exception ? " · especial" : ""}
              </Text>
              <Text className="font-heading text-sm text-vupth-textPrimary">{descreverHorario(u)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
