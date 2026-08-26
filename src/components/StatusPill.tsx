import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";

import {
  STATUS_META,
  STATUS_ORDEM,
  type StatusKey,
} from "@lib/workStatus";

// DS3 — "o profissional nao acha onde abrir/fechar a propria fila".
//
// A causa, medida no codigo: `work_status` era lido em UM arquivo so, o da tela
// de Opcoes. O estado dele nao existia na interface ate abrir o menu. A pilula
// resolve a metade "como eu estou": fica no cabecalho, aparece sempre e nao
// gasta um cartao.
//
// Nao e invencao — o arquivo de design ja poe uma pilula "Trabalhando" na barra
// de topo da PROF · 01 Fila, e a tela do DONO ja usa exatamente este padrao no
// mesmo lugar (ABERTO / PAUSADO / FECHADO). Isto alinha os dois papeis.
//
// Toca e TROCA (decisao da Alexia, 2026-08-26). Abre um seletor curto em vez de
// ciclar os tres: "Fora" tem consequencia — sendo o ultimo, fecha a loja —, e
// num ciclo ela fica a dois toques distraidos de distancia.
type Props = {
  current: StatusKey | null;
  onSelect: (next: StatusKey) => void;
};

export function StatusPill({ current, onSelect }: Props) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();
  const meta = current ? STATUS_META[current] : null;

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={
          meta ? `Você está: ${meta.label}. Toque para trocar.` : "Definir seu status"
        }
        hitSlop={8}
        className={`px-3 py-1.5 rounded-full active:opacity-70 ${meta ? meta.bg : "bg-vupth-surface"}`}
      >
        <Text
          className={`font-display text-xs ${meta ? meta.texto : "text-vupth-textSecondary"}`}
        >
          {meta ? meta.label : "Definir status"}
        </Text>
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="slide"
        onRequestClose={() => setAberto(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" }}
            onPress={() => setAberto(false)}
            accessibilityLabel="Fechar seletor de status"
          />
          <View
            className="bg-vupth-background rounded-t-hero p-4 gap-1"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <Text className="font-heading text-xs text-vupth-textSecondary mb-1">
              VOCÊ ESTÁ
            </Text>
            {STATUS_ORDEM.map((key) => {
              const m = STATUS_META[key];
              const ativo = key === current;
              return (
                <Pressable
                  key={key}
                  testID={`status-${key}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  onPress={() => {
                    setAberto(false);
                    if (!ativo) onSelect(key);
                  }}
                  className="flex-row items-center gap-3 py-3.5 px-3 rounded-card active:bg-vupth-surface"
                >
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.cor }} />
                  <Text className="font-body text-md flex-1 text-vupth-textPrimary">
                    {m.label}
                  </Text>
                  {ativo && <Check size={18} color="#163300" />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}
