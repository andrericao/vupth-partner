import { View, StatusBar } from "react-native";
import { GluestackUIProvider} from "@gluestack-ui/themed"
import { config } from "@gluestack-ui/config" 

import { Home } from "@screens/Home";
import { Login } from "@screens/Login";
import { SingUp } from "@screens/SingUp";

import {
  useFonts,
  RobotoMono_400Regular,
  RobotoMono_700Bold,
} from "@expo-google-fonts/roboto-mono";

export default function App() {
  const [fontLoaded] = useFonts({ RobotoMono_700Bold, RobotoMono_400Regular });
  return (
    <GluestackUIProvider config={config}>
      
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {fontLoaded ? <SingUp /> : <View />}
    </GluestackUIProvider>
  );
}
