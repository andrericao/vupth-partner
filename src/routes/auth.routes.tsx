import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import { Login } from "@screens/Login";
import { SingUp } from "@screens/SingUp";

type AuthRoutes = {
  SingUp: undefined;
  Login: undefined;
};

export type AuthNavigatorRoutesProps = NativeStackNavigationProp<AuthRoutes>;

const { Navigator, Screen } = createNativeStackNavigator<AuthRoutes>();

export function AuthRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
			<Screen name="Login" component={Login} />
      <Screen name="SingUp" component={SingUp} />      
    </Navigator>
  );
}
