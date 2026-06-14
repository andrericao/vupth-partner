import { VStack, Text } from "@gluestack-ui/themed";

type Props = {
  label: string;
  value: string;
  bg?: string;
  borderColor?: string;
  labelColor?: string;
  valueColor?: string;
};

export function SummaryCard({
  label,
  value,
  bg = "$white",
  borderColor = "$coolGray200",
  labelColor = "$coolGray500",
  valueColor = "$coolGray900",
}: Props) {
  return (
    <VStack
      flex={1}
      bg={bg}
      p="$3"
      borderRadius="$lg"
      borderWidth="$1"
      borderColor={borderColor}
    >
      <Text fontFamily="$body" fontSize="$xs" color={labelColor}>
        {label}
      </Text>
      <Text fontFamily="$heading" fontWeight="$bold" fontSize="$2xl" color={valueColor}>
        {value}
      </Text>
    </VStack>
  );
}
