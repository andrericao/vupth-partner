import { useState } from "react";
import { View, Text, Switch } from "react-native";

import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { maskTime } from "@lib/time";
import { maskDate } from "@lib/masks";
import {
  nomeDoDia,
  erroDoDia,
  descreverHorario,
  dataBrParaIso,
  isoParaBr,
  type DiaSemanal,
  type Excecao,
  type HorarioDoDia,
} from "@lib/horarioSemanal";
import { useTema } from "@hooks/useTema";

// Pecas da tela de horario por dia (S27). Sem desenho do Design ainda: segue os
// componentes que o app ja usa (NwInput, NwButton, o Switch do "aceitando
// novos"). A tela em si mora em app/(owner)/(tabs)/establishment-hours.tsx.

function Horarios({
  rotulo,
  opens,
  closes,
  onChange,
}: {
  rotulo: string;
  opens: string;
  closes: string;
  onChange: (campo: "opens" | "closes", valor: string) => void;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <NwInput
          label="Abre"
          placeholder="08:00"
          value={opens}
          onChangeText={(t) => onChange("opens", maskTime(t))}
          keyboardType="number-pad"
          accessibilityLabel={`${rotulo} abre`}
        />
      </View>
      <View className="flex-1">
        <NwInput
          label="Fecha"
          placeholder="18:00"
          value={closes}
          onChangeText={(t) => onChange("closes", maskTime(t))}
          keyboardType="number-pad"
          accessibilityLabel={`${rotulo} fecha`}
        />
      </View>
    </View>
  );
}

/** Uma linha da semana: o dia, o interruptor aberto/fechado e os horarios. */
export function DiaDaSemanaLinha({
  dia,
  onChange,
}: {
  dia: DiaSemanal;
  onChange: (dia: DiaSemanal) => void;
}) {
  const { interruptor } = useTema();
  const nome = nomeDoDia(dia.day);
  return (
    <View className="bg-vupth-surface rounded-card p-4 gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-base text-vupth-textPrimary">{nome}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-sm text-vupth-textSecondary">
            {dia.closed ? "Fechado" : "Aberto"}
          </Text>
          <Switch
            value={!dia.closed}
            onValueChange={(aberto) => onChange({ ...dia, closed: !aberto })}
            accessibilityLabel={`${nome} aberto`}
            {...interruptor}
          />
        </View>
      </View>
      {!dia.closed && (
        <Horarios
          rotulo={nome}
          opens={dia.opens ?? ""}
          closes={dia.closes ?? ""}
          onChange={(campo, valor) => onChange({ ...dia, [campo]: valor })}
        />
      )}
    </View>
  );
}

/** Criar a excecao de UMA data (horario proprio ou fechado). */
export function DataEspecialForm({
  hoje,
  salvando,
  onAdicionar,
}: {
  /** "AAAA-MM-DD" — injetado para o teste nao depender do relogio. */
  hoje: string;
  salvando?: boolean;
  onAdicionar: (dataIso: string, h: HorarioDoDia) => void;
}) {
  const { interruptor } = useTema();
  const [data, setData] = useState("");
  const [fechado, setFechado] = useState(false);
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const adicionar = () => {
    const iso = dataBrParaIso(data);
    if (!iso) return setErro("Informe a data no formato DD/MM/AAAA.");
    // O passado e documento (D5): o backend recusaria de qualquer jeito.
    if (iso < hoje) return setErro("Só dá para definir datas de hoje em diante.");
    const h = { closed: fechado, opens, closes };
    const e = erroDoDia(h);
    if (e) return setErro(e.charAt(0).toUpperCase() + e.slice(1));
    setErro(null);
    onAdicionar(iso, h);
  };

  return (
    <View className="bg-vupth-surface rounded-card p-4 gap-2">
      <NwInput
        label="Data"
        placeholder="DD/MM/AAAA"
        value={data}
        onChangeText={(t) => setData(maskDate(t))}
        keyboardType="number-pad"
        accessibilityLabel="Data"
      />
      <View className="flex-row items-center justify-between">
        <Text className="font-body text-sm text-vupth-textSecondary">Fechado nesse dia</Text>
        <Switch
          value={fechado}
          onValueChange={setFechado}
          accessibilityLabel="Fechado nesse dia"
          {...interruptor}
        />
      </View>
      {!fechado && (
        <Horarios
          rotulo="Data especial"
          opens={opens}
          closes={closes}
          onChange={(campo, valor) => (campo === "opens" ? setOpens(valor) : setCloses(valor))}
        />
      )}
      {erro && <Text className="font-body text-xs text-vupth-danger">{erro}</Text>}
      <NwButton
        title="Adicionar data especial"
        variant="vupthOutline"
        onPress={adicionar}
        isLoading={salvando}
      />
    </View>
  );
}

/** As excecoes ja criadas (so de hoje em diante — o backend nao devolve as passadas). */
export function ListaDeExcecoes({
  excecoes,
  removendo,
  onRemover,
}: {
  excecoes: Excecao[];
  removendo?: string | null;
  onRemover: (dataIso: string) => void;
}) {
  if (excecoes.length === 0) {
    return (
      <Text className="font-body text-sm text-vupth-textSecondary">
        Nenhuma data especial. Use abaixo para um feriado ou um dia com horário diferente.
      </Text>
    );
  }
  return (
    <View className="gap-2">
      {excecoes.map((e) => {
        const br = isoParaBr(e.date);
        return (
          <View key={e.date} className="flex-row items-center justify-between bg-vupth-surface rounded-card px-4 py-3">
            <View>
              <Text className="font-heading text-sm text-vupth-textPrimary">{br}</Text>
              <Text className="font-body text-sm text-vupth-textSecondary">{descreverHorario(e)}</Text>
            </View>
            <NwButton
              title="Remover"
              variant="outlineDanger"
              className="h-9 px-4"
              isLoading={removendo === e.date}
              onPress={() => onRemover(e.date)}
              accessibilityLabel={`Remover ${br}`}
            />
          </View>
        );
      })}
    </View>
  );
}
