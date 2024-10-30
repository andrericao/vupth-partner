import { Text, View, TextInput } from "react-native";

export function Home(){
	return(
		<View style={{ flex: 1, alignItems:"center", justifyContent: "center" }}>
			<TextInput
				placeholder="Testando"
			/>			
			<Text>Nathalia</Text>
		</View>
	);
}