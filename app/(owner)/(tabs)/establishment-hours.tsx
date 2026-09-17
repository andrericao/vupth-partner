import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { DiaDaSemanaLinha, DataEspecialForm, ListaDeExcecoes } from "@components/HorarioSemana";
import { useEstablishmentStore } from "@store/establishment.store";
import { getApiErrorMessage } from "@lib/api";
import { maskTime, isValidTime, parseApiTime, toApiTime } from "@lib/time";
import { avisar } from "@lib/confirmar";
import { buscarHorarios, salvarSemana, salvarData, removerData } from "@lib/horariosApi";
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

const VOLTAR = "/(owner)/establishment-data";

// 🚀 Horario POR DIA (S27, bloqueio de lancamento). Era um par unico para a
// semana inteira — nao dava para dizer "domingo fechado" nem "sabado ate o
// meio-dia". Agora: a semana (os 7 dias, sempre definidos) e as DATAS
// ESPECIAIS (feriado, um dia com horario diferente). "Todas as segundas" vai no
// PUT da semana; "so nesta segunda" vira excecao da data. O passado e
// documento: so se define de hoje em diante.
//
// Backend sem a rota nova (404) -> o formulario antigo, de horario unico, que
// continua aceito e passa a valer para os 7 dias. O app nao depende da ordem
// dos deploys.
export default function EstablishmentHoursScreen() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const id = establishment?.id ?? null;

  const [estado, setEstado] = useState<"carregando" | "semana" | "legado" | "erro">("carregando");
  const [horarios, setHorarios] = useState<HorariosDaLoja | null>(null);
  const [semana, setSemana] = useState<DiaSemanal[]>([]);
  const [salvandoSemana, setSalvandoSemana] = useState(false);
  const [salvandoData, setSalvandoData] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const legado = (() => {
    const opens = parseApiTime(establishment?.opening_time);
    const closes = parseApiTime(establishment?.closing_time);
    return opens && closes ? { opens, closes } : null;
  })();

  // Relê a cada tentativa: o "Tentar de novo" so incrementa o contador.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    buscarHorarios(id)
      .then((h) => {
        if (!ativo) return;
        if (!h) {
          setEstado("legado");
          return;
        }
        setHorarios(h);
        setSemana(semanaInicial(h, legado));
        setEstado("semana");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });
    return () => {
      ativo = false;
    };
    // `legado` so semeia a 1a abertura; nao deve recarregar a semana.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tentativa]);

  const tentarDeNovo = () => {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  };

  const trocarDia = (dia: DiaSemanal) =>
    setSemana((s) => s.map((d) => (d.day === dia.day ? dia : d)));

  const primeiroAberto = semana.find((d) => !d.closed && isValidTime(d.opens ?? "") && isValidTime(d.closes ?? ""));

  const handleSalvarSemana = async () => {
    if (!id) return;
    const erro = validarSemana(semana);
    if (erro) {
      Alert.alert("Horário inválido", erro);
      return;
    }
    setSalvandoSemana(true);
    try {
      const h = await salvarSemana(id, semana);
      setHorarios(h);
      setSemana(semanaInicial(h, null));
      await avisar({ titulo: "Horário salvo", mensagem: "O horário da semana foi atualizado." });
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o horário."));
    } finally {
      setSalvandoSemana(false);
    }
  };

  const handleAdicionarData = async (dataIso: string, h: HorarioDoDia) => {
    if (!id) return;
    setSalvandoData(true);
    try {
      setHorarios(await salvarData(id, dataIso, h));
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
    if (!id) return;
    setRemovendo(dataIso);
    try {
      await removerData(id, dataIso);
      // DELETE devolve 204 sem corpo: relê para os "próximos dias" acompanharem.
      const h = await buscarHorarios(id);
      if (h) setHorarios(h);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível remover a data."));
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
            title="Horário de funcionamento"
            onBack={() => router.navigate(VOLTAR as any)}
          />

          {estado === "carregando" && (
            <ActivityIndicator className="mt-10" color="#163300" />
          )}

          {estado === "erro" && (
            <View className="mt-6 gap-3">
              <Text className="font-body text-vupth-textSecondary">
                Não foi possível carregar o horário.
              </Text>
              <NwButton title="Tentar de novo" onPress={tentarDeNovo} />
            </View>
          )}

          {estado === "legado" && <HorarioUnico />}

          {estado === "semana" && horarios && (
            <View className="mt-2 gap-6">
              {!horarios.configured && (
                <View className="bg-vupth-greenTint rounded-card p-4">
                  <Text className="font-body text-sm text-vupth-forest">
                    Defina o horário de cada dia da semana. Ele é necessário para abrir o
                    estabelecimento, e as refeições dos profissionais precisam caber nele.
                  </Text>
                </View>
              )}

              <View className="gap-3">
                <Text className="font-heading text-lg text-vupth-forest">Semana</Text>
                <Text className="font-body text-sm text-vupth-textSecondary">
                  Vale para todas as semanas. Fechar depois de abrir (22:00 – 02:00) termina no dia
                  seguinte; abrir e fechar no mesmo horário é 24 horas.
                </Text>
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
                <Text className="font-heading text-lg text-vupth-forest">Datas especiais</Text>
                <Text className="font-body text-sm text-vupth-textSecondary">
                  Feriado ou um dia com horário diferente. Só vale para aquela data; a semana continua
                  igual.
                </Text>
                <ListaDeExcecoes
                  excecoes={horarios.exceptions}
                  removendo={removendo}
                  onRemover={handleRemoverData}
                />
                <DataEspecialForm
                  hoje={hojeIso()}
                  salvando={salvandoData}
                  onAdicionar={handleAdicionarData}
                />
              </View>

              {horarios.upcoming.length > 0 && (
                <View className="gap-2">
                  <Text className="font-heading text-lg text-vupth-forest">Próximos dias</Text>
                  {horarios.upcoming.slice(0, 7).map((u) => (
                    <View key={u.date} className="flex-row justify-between">
                      <Text className="font-body text-sm text-vupth-textSecondary">
                        {nomeDoDia(u.day)}, {isoParaBr(u.date).slice(0, 5)}
                        {u.exception ? " · especial" : ""}
                      </Text>
                      <Text className="font-heading text-sm text-vupth-forest">
                        {descreverHorario(u)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// O formulario de antes (um horario para a semana inteira). Fica so para o
// backend que ainda nao tem a rota da semana.
function HorarioUnico() {
  const establishment = useEstablishmentStore((s) => s.establishment);
  const updateGeneralInfos = useEstablishmentStore((s) => s.updateGeneralInfos);
  const fetchEstablishmentById = useEstablishmentStore((s) => s.fetchEstablishmentById);

  const [opening, setOpening] = useState(parseApiTime(establishment?.opening_time) ?? "");
  const [closing, setClosing] = useState(parseApiTime(establishment?.closing_time) ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // QA 2026-07-22 (#4): a store persistida pode nao ter o horario — busca o
  // detalhe FRESCO e preenche o que o usuario ainda nao digitou.
  useEffect(() => {
    if (!establishment?.id) return;
    let active = true;
    fetchEstablishmentById(establishment.id)
      .then((d) => {
        if (!active) return;
        setOpening((cur) => cur || (parseApiTime(d.opening_time) ?? ""));
        setClosing((cur) => cur || (parseApiTime(d.closing_time) ?? ""));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [establishment?.id, fetchEstablishmentById]);

  const handleSave = async () => {
    if (!establishment?.id) return;
    if (!isValidTime(opening) || !isValidTime(closing)) {
      Alert.alert("Horário inválido", "Informe abertura e fechamento no formato HH:MM (ex.: 09:00).");
      return;
    }
    if (opening >= closing) {
      Alert.alert("Horário inválido", "O fechamento deve ser depois da abertura.");
      return;
    }
    setIsSaving(true);
    try {
      await updateGeneralInfos(establishment.id, {
        opening_time: toApiTime(opening)!,
        closing_time: toApiTime(closing)!,
      });
      Alert.alert("Horário salvo", "O horário de funcionamento foi atualizado.");
      router.navigate(VOLTAR as any);
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o horário."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Text className="font-body text-vupth-textSecondary mt-1">
        Necessario para abrir o estabelecimento. As refeições dos profissionais precisam caber nesse
        horário.
      </Text>
      <View className="mt-6 gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <NwInput
              label="Abertura (HH:MM)"
              placeholder="09:00"
              value={opening}
              onChangeText={(t) => setOpening(maskTime(t))}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <NwInput
              label="Fechamento (HH:MM)"
              placeholder="18:00"
              value={closing}
              onChangeText={(t) => setClosing(maskTime(t))}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <NwButton title="Salvar" onPress={handleSave} isLoading={isSaving} />
      </View>
    </>
  );
}
