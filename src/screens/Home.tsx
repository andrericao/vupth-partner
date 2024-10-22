import { Text, View, TextInput } from "react-native";

export function Home(){
	return(
		<View style={{ flex: 1, alignItems:"center", justifyContent: "center" }}>
			<TextInput
				placeholderClassName="testando"
				style={{ height: 24, margin: 12, borderWidth: 1 }}
			/>			
			<Text>Oi</Text>
		</View>
	);
}