import { View, Text, Pressable } from "react-native";
import {
  Scissors,
  UserRound,
  Eye,
  Palette,
  Sparkles,
  HandHeart,
  Flower,
  BriefcaseMedical,
  Tag,
  CircleCheck,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useTema } from "@hooks/useTema";

// [#11] Seletor de "Tipo de servico" em grade de chips com icone (no lugar da
// lista de pilulas de texto). 2 colunas, selecao verde com check. Idioma Verde
// Imersivo (verde da marca, cantos arredondados).
// Migrado p/ NativeWind (v2).

// Icone por tipo (por palavra-chave no value do ServiceItemType). lucide —
// mesma familia da tab bar.
//
// [marca-vupth] BARBA saiu do `man` do Ionicons pro UserRound: o lucide nao tem
// navalha/barba, e cabeca+ombros mantem a leitura "servico no rosto" sem repetir
// a tesoura do CORTE dentro da mesma grade.
// MASSAGEM saiu do `body` (silhueta inteira) pro HandHeart: maos que cuidam
// dizem massagem/drenagem; a silhueta sozinha sairia igual ao icone da BARBA.
function iconFor(value: string): LucideIcon {
  const v = value.toUpperCase();
  if (v.includes("CORTE") || v.includes("RECORTE") || v.includes("PONTAS")) return Scissors;
  if (v.includes("BARBA")) return UserRound;
  if (v.includes("SOBRANCELHA") || v.includes("BROW") || v.includes("HENNA")) return Eye;
  if (v.includes("ESCOVA") || v.includes("PINTURA") || v.includes("TINTURA") || v.includes("PROGRESSIVA") || v.includes("HIDRATACAO")) return Palette;
  if (v.includes("MANICURE") || v.includes("PEDICURE") || v.includes("UNHAS") || v.includes("NAIL")) return Sparkles;
  if (v.includes("MASSAGEM") || v.includes("DRENAGEM")) return HandHeart;
  if (v.includes("DEPILACAO")) return Flower;
  if (v.includes("PELE") || v.includes("PEELING") || v.includes("BOTOX") || v.includes("MICRO") || v.includes("LIMPEZA")) return BriefcaseMedical;
  return Tag;
}

type Item = { label: string; value: string };

export function ServiceTypeGrid({
  items,
  selected,
  onSelect,
}: {
  items: readonly Item[];
  selected: string;
  onSelect: (item: Item) => void;
}) {
  const { cores } = useTema();
  return (
    <View className="flex-row flex-wrap justify-between mb-2">
      {items.map((it) => {
        const isSel = selected === it.value;
        const Icon = iconFor(it.value);
        return (
          <Pressable
            key={it.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSel }}
            onPress={() => onSelect(it)}
            className={`w-[48.5%] mb-2.5 relative rounded-card p-3 ${
              isSel ? "bg-vupth-greenTint border-2 border-vupth-onGreenTint" : "bg-vupth-surface"
            }`}
          >
            {isSel && (
              <View className="absolute top-1.5 right-1.5">
                <CircleCheck size={16} color={cores.onGreenTint} />
              </View>
            )}
            <View className="flex-row items-center gap-2">
              {/* [marca-vupth] Quadrado nao selecionado no greenTint, e nao no
                  surface: o card ja e bg-vupth-surface e o quadrado sumiria
                  dentro dele. */}
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isSel ? "bg-vupth-selecionado" : "bg-vupth-greenTint"
                }`}
              >
                <Icon size={18} color={isSel ? cores.onSelecionadoBranco : cores.onGreenTint} />
              </View>
              <Text
                numberOfLines={2}
                className={`flex-1 font-body text-sm ${
                  isSel ? "font-bold text-vupth-onGreenTint" : "font-medium text-vupth-textSecondary"
                }`}
              >
                {it.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
