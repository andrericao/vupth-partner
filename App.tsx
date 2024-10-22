import { View, Text, StatusBar } from "react-native";

//import "./global.css";
import { GluestackUIProvider } from "gluestack-ui-provider";

import { Home } from "@screens/Home";

import {
  useFonts,
  RobotoMono_400Regular,
  RobotoMono_700Bold,
} from "@expo-google-fonts/roboto-mono";

export default function App() {
  const [fontLoaded] = useFonts({ RobotoMono_700Bold, RobotoMono_400Regular });
  return (
    <GluestackUIProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      { fontLoaded ?  <Home /> : <View />}
    </GluestackUIProvider>
  );
}
