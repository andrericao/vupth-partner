import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow } from "@lib/styles";

// [#11] Seletor de "Tipo de servico" em grade de chips com icone (no lugar da
// lista de pilulas de texto). 2 colunas, selecao verde com check. Idioma Verde
// Imersivo (cardShadow, verde da marca, cantos arredondados).
// Migrado p/ NativeWind (v2).

// Icone por tipo (por palavra-chave no value do ServiceItemType). Ionicons —
// mesmos da tab bar.
function iconFor(value: string): keyof typeof Ionicons.glyphMap {
  const v = value.toUpperCase();
  if (v.includes("CORTE") || v.includes("RECORTE") || v.includes("PONTAS")) return "cut";
  if (v.includes("BARBA")) return "man";
  if (v.includes("SOBRANCELHA") || v.includes("BROW") || v.includes("HENNA")) return "eye";
  if (v.includes("ESCOVA") || v.includes("PINTURA") || v.includes("TINTURA") || v.includes("PROGRESSIVA") || v.includes("HIDRATACAO")) return "color-palette";
  if (v.includes("MANICURE") || v.includes("PEDICURE") || v.includes("UNHAS") || v.includes("NAIL")) return "sparkles";
  if (v.includes("MASSAGEM") || v.includes("DRENAGEM")) return "body";
  if (v.includes("DEPILACAO")) return "flower";
  if (v.includes("PELE") || v.includes("PEELING") || v.includes("BOTOX") || v.includes("MICRO") || v.includes("LIMPEZA")) return "medkit";
  return "pricetag";
}

type Item = { label: string; value: string };

export function ServiceTypeGrid({
  items,
  selected,
  onSelect,
}: {
  items: Item[];
  selected: string;
  onSelect: (item: Item) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-between mb-2">
      {items.map((it) => {
        const isSel = selected === it.value;
        return (
          <Pressable
            key={it.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSel }}
            onPress={() => onSelect(it)}
            className={`w-[48.5%] mb-2.5 relative bg-white rounded-2xl p-3 ${
              isSel ? "border-2 border-vupth-forest" : "border border-gray-200"
            }`}
            style={isSel ? undefined : cardShadow}
          >
            {isSel && (
              <View className="absolute top-1.5 right-1.5">
                <Ionicons name="checkmark-circle" size={16} color="#3b7a3f" />
              </View>
            )}
            <View className="flex-row items-center gap-2">
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isSel ? "bg-vupth-forest" : "bg-gray-100"
                }`}
              >
                <Ionicons name={iconFor(it.value)} size={18} color={isSel ? "#FFFFFF" : "#316635"} />
              </View>
              <Text
                numberOfLines={2}
                className={`flex-1 font-body text-sm ${
                  isSel ? "font-bold text-vupth-forest" : "font-medium text-gray-800"
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
