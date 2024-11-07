import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;

  //Place: { placeId: number };

  Login: undefined;

  SingUpStepOne_Contacts: undefined;

  SingUpStepTwo_Shop: undefined;

  SingUpStepTrhee_Admin: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Home"
>;

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;

export type SingUpStepOne_ContactsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingUpStepOne_Contacts"
>;

export type SingUpStepTwo_ShopScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingUpStepTwo_Shop"
>;

export type SingUpStepTrhee_AdminScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingUpStepTrhee_Admin"
>;