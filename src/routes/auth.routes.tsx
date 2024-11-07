import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import { Login } from "@screens/Login";
import { SingUpStepTwo_Shop } from "@screens/SingUpStepTwo_Shop";
import { SingUpStepTrhee_Admin } from "@screens/SingUpStepThree_Admin";
import { SingUpStepOne_Contacts } from "@screens/SingUpStepOne_Contacts";

type AuthRoutes = {
  SingUpStepOne_Contacts: undefined;
  SingUpStepTwo_Shop: undefined;
  Login: undefined;
  SingUpStepTrhee_Admin: undefined;
};

export type AuthNavigatorRoutesProps = NativeStackNavigationProp<AuthRoutes>;

const { Navigator, Screen } = createNativeStackNavigator<AuthRoutes>();

export function AuthRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="Login" component={Login} />
      <Screen name="SingUpStepTwo_Shop" component={SingUpStepTwo_Shop} />
      <Screen
        name="SingUpStepOne_Contacts"
        component={SingUpStepOne_Contacts}
      />
      <Screen
        name="SingUpStepTrhee_Admin"
        component={SingUpStepTrhee_Admin}
      />
    </Navigator>
  );
}
