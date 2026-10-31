import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { getApiErrorMessage } from "@lib/api";
import { hhmmFromIso } from "@lib/time";
import { formatCurrency } from "@utils/summaryCalculations";
import {
  apoioDoEncaixe,
  frasesDoApoio,
  lerValor,
  type ApoioDoEncaixe,
  type PedidoDeEncaixe,
} from "@lib/fitIn";

type Props = {
  pedido: PedidoDeEncaixe;
  /** Aceitar, recusar e contrapor devolvem a promessa; o cartao mostra o erro. */
  onAceitar: (id: string) => Promise<void>;
  onRecusar: (id: string) => Promise<void>;
  onContrapor: (id: string, extra: number) => Promise<void>;
  apoio?: typeof apoioDoEncaixe;
};

/**
 * aceitar-encaixe (DEC-136 a 141): um pedido de encaixe novo. O cliente nao e
 * identificado (sigilo, DEC-141): so o lugar na fila, a hora e o adicional.
 * O apoio diz quantos clientes absorvem o tempo e se passa do fechamento.
 */
export function CartaoDeEncaixe({ pedido, onAceitar, onRecusar, onContrapor, apoio = apoioDoEncaixe }: Props) {
  const [ajuda, setAjuda] = useState<ApoioDoEncaixe | null>(null);
  const [contrapondo, setContrapondo] = useState(false);
  const [valor, setValor] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    apoio(pedido.id)
      .then((a) => vivo && setAjuda(a))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [apoio, pedido.id]);

  const rodar = async (acao: () => Promise<void>) => {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
    } catch (e: any) {
      setErro(getApiErrorMessage(e, "Não foi possível responder o encaixe."));
    } finally {
      setOcupado(false);
    }
  };

  const hora = hhmmFromIso(pedido.desiredTime);
  const novoValor = lerValor(valor);
  const lugar =
    pedido.aheadCount === 0
      ? "Quer ser o próximo"
      : `Quer entrar depois de ${pedido.aheadCount} ${pedido.aheadCount === 1 ? "cliente" : "clientes"}`;

  return (
    <View testID={`encaixe-novo-${pedido.id}`} className="bg-vupth-surface rounded-card p-4 gap-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-display text-base text-vupth-textPrimary">Encaixe</Text>
          <Text className="font-body text-sm text-vupth-textPrimary mt-0.5">
            {lugar}
            {hora ? ` · chega às ${hora}` : ""}
          </Text>
        </View>
        <Text testID="encaixe-adicional" className="font-display text-base text-vupth-textPrimary">
          + {formatCurrency(pedido.currentExtra)}
        </Text>
      </View>

      {!!ajuda && (
        <View testID="encaixe-apoio" className="gap-1">
          {frasesDoApoio(ajuda).map((f) => (
            <Text
              key={f}
              className={`font-body text-xs ${
                f.startsWith("Passa do fechamento") ? "text-vupth-danger" : "text-vupth-textSecondary"
              }`}
            >
              {f}
            </Text>
          ))}
        </View>
      )}

      {contrapondo && (
        <NwInput
          label="Seu valor do adicional (R$)"
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          autoCapitalize="none"
          testID="encaixe-contraproposta"
          error={valor !== "" && novoValor == null ? "Digite um valor maior que zero." : undefined}
        />
      )}
      {!!erro && <Text className="font-body text-sm text-vupth-danger">{erro}</Text>}

      <View className="flex-row gap-2">
        <NwButton
          title="Recusar"
          variant="secondary"
          className="flex-1 h-9 mt-0"
          disabled={ocupado}
          onPress={() => rodar(() => onRecusar(pedido.id))}
        />
        {contrapondo ? (
          <NwButton
            title="Enviar valor"
            variant="vupthOutline"
            className="flex-1 h-9 mt-0"
            testID="encaixe-enviar-valor"
            disabled={ocupado || novoValor == null}
            onPress={() => rodar(() => onContrapor(pedido.id, novoValor!))}
          />
        ) : (
          <NwButton
            title="Contrapor"
            variant="vupthOutline"
            className="flex-1 h-9 mt-0"
            testID="encaixe-contrapor"
            disabled={ocupado}
            onPress={() => setContrapondo(true)}
          />
        )}
        <NwButton
          title="Aceitar"
          className="flex-1 h-9 mt-0"
          testID="encaixe-aceitar"
          disabled={ocupado}
          onPress={() => rodar(() => onAceitar(pedido.id))}
        />
      </View>
    </View>
  );
}
