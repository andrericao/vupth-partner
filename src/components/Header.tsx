import { useNavigation } from "@react-navigation/native";

import { HStack, Center } from "@gluestack-ui/themed";

import Logo from "../assets/vupth-logo/people-waiting.svg";

import { GoBackButton } from "@components/GoBackButton";

type Props = {
  showBackButton?: boolean;
};

export function Header({ showBackButton = false }: Props) {
  const navigation = useNavigation();

  return (
    <HStack alignItems="center">
      {showBackButton && <GoBackButton onPress={() => navigation.goBack()} />}
      <Center>
        <Logo width={50} height={50} />
      </Center>
    </HStack>
  );
}
