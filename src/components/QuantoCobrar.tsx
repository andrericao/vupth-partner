import { useEffect, useState } from "react";
import { View, Text } from "react-native";

import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { formatarReais } from "@lib/dinheiro";
import { maskMoney, unmaskMoney } from "@lib/masks";
import {
  calcularCustos,
  explicacaoDaConta,
  faltaParaSugerido,
  lerCustos,
  salvarCustos,
  type EntradaDeCustos,
  type ResultadoDeCustos,
} from "@lib/custos";

// aba-de-custos: a calculadora "Quanto cobrar?" (desenho da Design). Cinco campos,
// o sugerido como heroi e o minimo na linha de baixo; os servicos mostram so
// quanto falta para o sugerido (informacao: o preco muda na tela de servicos).
type Servico = { id: string; customName: string; price: number };
type Props = {
  servicos: Servico[];
  carregar?: () => Promise<EntradaDeCustos>;
  salvar?: (e: EntradaDeCustos) => Promise<void>;
};

const dinheiro = (n: number) => (n > 0 ? maskMoney(String(Math.round(n * 100))) : "");
const inteiro = (t: string) => t.replace(/\D/g, "").slice(0, 3);

export function QuantoCobrar({ servicos, carregar = lerCustos, salvar = salvarCustos }: Props) {
  const [fixos, setFixos] = useState("");
  const [dias, setDias] = useState("22");
  const [cortes, setCortes] = useState("8");
  const [custo, setCusto] = useState("");
  const [ganho, setGanho] = useState("");
  const [entrada, setEntrada] = useState<EntradaDeCustos | null>(null);
  const [resultado, setResultado] = useState<ResultadoDeCustos | null>(null);
  const [saibaMais, setSaibaMais] = useState(false);

  useEffect(() => {
    carregar()
      .then((e) => {
        setFixos(dinheiro(e.fixos));
        setDias(String(e.dias));
        setCortes(String(e.cortesPorDia));
        setCusto(dinheiro(e.custoPorCorte));
        setGanho(dinheiro(e.ganho));
      })
      .catch(() => {});
  }, [carregar]);

  const lida: EntradaDeCustos = {
    fixos: unmaskMoney(fixos),
    dias: Number(dias) || 0,
    cortesPorDia: Number(cortes) || 0,
    custoPorCorte: unmaskMoney(custo),
    ganho: unmaskMoney(ganho),
  };
  const podeCalcular = calcularCustos(lida) !== null && (lida.fixos > 0 || lida.ganho > 0);

  function calcular() {
    const r = calcularCustos(lida);
    if (!r) return;
    setEntrada(lida);
    setResultado(r);
    setSaibaMais(false);
    salvar(lida).catch(() => {});
  }

  if (resultado && entrada) {
    return (
      <View testID="custos-resultado">
        <Text className="font-body text-xs text-vupth-textSecondary mt-2">
          {resultado.cortesNoMes} cortes por mês · {formatarReais(entrada.fixos)} de custo fixo
        </Text>
        <View className="mt-4 bg-vupth-green rounded-card p-4">
          <Text className="font-body text-xs text-vupth-onGreen">Preço sugerido por corte</Text>
          <Text testID="custos-sugerido" className="font-display text-3xl text-vupth-onGreen mt-1">
            {formatarReais(resultado.sugerido)}
          </Text>
          <Text testID="custos-minimo" className="font-body text-xs text-vupth-onGreen mt-1">
            Mínimo para cobrir a conta: {formatarReais(resultado.minimo)}
          </Text>
        </View>

        {servicos.length > 0 && (
          <View testID="custos-servicos" className="mt-4 bg-vupth-surface rounded-card p-4">
            <Text className="font-body text-xs text-vupth-textSecondary mb-2">Seus serviços hoje</Text>
            {servicos.map((s) => {
              const falta = faltaParaSugerido(s.price, resultado.sugerido);
              return (
                <View key={s.id} testID="custos-servico" className="flex-row justify-between py-1.5">
                  <Text className="font-body text-sm text-vupth-textPrimary">{s.customName}</Text>
                  <Text className="font-mono text-sm text-vupth-textPrimary">
                    {formatarReais(s.price)}
                    {falta ? `  −${formatarReais(falta)}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {saibaMais ? (
          <View testID="custos-saiba-mais" className="mt-4 gap-1">
            {explicacaoDaConta(resultado, entrada).map((linha) => (
              <Text key={linha} className="font-body text-xs text-vupth-textSecondary">
                {linha}
              </Text>
            ))}
          </View>
        ) : (
          <NwButton
            title="Saiba mais"
            variant="vupthOutline"
            className="h-12 mt-4"
            testID="custos-saiba-mais-abrir"
            onPress={() => setSaibaMais(true)}
          />
        )}
        <NwButton
          title="Ajustar"
          variant="vupthOutline"
          className="h-12 mt-2"
          testID="custos-ajustar"
          onPress={() => setResultado(null)}
        />
      </View>
    );
  }

  return (
    <View testID="custos-form">
      <Text className="font-body text-sm text-vupth-textSecondary mb-2">Preencha o que você gasta. O app faz a conta.</Text>
      <NwInput
        label="Custos fixos do mês"
        placeholder="Aluguel, luz, produtos, taxa"
        keyboardType="number-pad"
        value={fixos}
        onChangeText={(t) => setFixos(maskMoney(t))}
        testID="custos-fixos"
      />
      <NwInput
        label="Dias por mês"
        keyboardType="number-pad"
        value={dias}
        onChangeText={(t) => setDias(inteiro(t))}
        testID="custos-dias"
      />
      <NwInput
        label="Cortes por dia"
        keyboardType="number-pad"
        value={cortes}
        onChangeText={(t) => setCortes(inteiro(t))}
        testID="custos-cortes"
      />
      <NwInput
        label="Custo por corte"
        placeholder="Lâmina, toalha, produto"
        keyboardType="number-pad"
        value={custo}
        onChangeText={(t) => setCusto(maskMoney(t))}
        testID="custos-custo"
      />
      <NwInput
        label="Quanto quer ganhar no mês"
        keyboardType="number-pad"
        value={ganho}
        onChangeText={(t) => setGanho(maskMoney(t))}
        testID="custos-ganho"
      />
      <NwButton title="Calcular" onPress={calcular} disabled={!podeCalcular} testID="custos-calcular" />
    </View>
  );
}
