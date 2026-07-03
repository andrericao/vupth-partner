import { HStack, VStack, Text, Pressable, Box } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow } from "@lib/styles";

// [#11] Seletor de "Tipo de servico" em grade de chips com icone (no lugar da
// lista de pilulas de texto). 2 colunas, selecao verde com check. Idioma Verde
// Imersivo (cardShadow, verde da marca, cantos arredondados).

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
    <HStack flexWrap="wrap" justifyContent="space-between" mb="$2">
      {items.map((it) => {
        const isSel = selected === it.value;
        return (
          <Pressable
            key={it.value}
            onPress={() => onSelect(it)}
            w="48.5%"
            mb="$2.5"
            position="relative"
            bg="$white"
            borderRadius="$2xl"
            borderWidth={isSel ? "$2" : "$1"}
            borderColor={isSel ? "$green500" : "$coolGray200"}
            p="$3"
            style={isSel ? undefined : cardShadow}
          >
            {isSel && (
              <Box position="absolute" top="$1.5" right="$1.5">
                <Ionicons name="checkmark-circle" size={16} color="#00B37E" />
              </Box>
            )}
            <HStack space="sm" alignItems="center">
              <VStack
                w="$8"
                h="$8"
                borderRadius="$lg"
                alignItems="center"
                justifyContent="center"
                bg={isSel ? "$green500" : "$coolGray100"}
              >
                <Ionicons name={iconFor(it.value)} size={18} color={isSel ? "#FFFFFF" : "#009E6F"} />
              </VStack>
              <Text
                flex={1}
                fontFamily="$body"
                fontSize="$sm"
                fontWeight={isSel ? "$bold" : "$medium"}
                color={isSel ? "$green700" : "$coolGray800"}
                numberOfLines={2}
              >
                {it.label}
              </Text>
            </HStack>
          </Pressable>
        );
      })}
    </HStack>
  );
}
