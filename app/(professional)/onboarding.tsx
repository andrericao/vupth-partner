import { useState } from "react";
import { VStack, FormControl, Heading, ScrollView } from "@gluestack-ui/themed";
import { Header } from "@components/Header";
import { Input } from "@components/Input";
import { Button } from "@components/Button";

export default function ProfessionalOnboardingScreen() {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !specialty.trim()) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    // TODO: POST /professional/register + redirect
  };

  return (
    <ScrollView
      w="$full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack
        flex={1}
        py="$12"
        px="$6"
        alignItems="center"
        justifyContent="center"
      >
        <Header showBackButton />

        <FormControl flex={1} mt="$48" isInvalid={isInvalid}>
          <Heading mb="$12" size="3xl" fontFamily="$heading">
            Cadastro Profissional
          </Heading>

          <Input
            textLabel="Nome"
            placeholder="João Silva"
            messageError="Nome obrigatório"
            value={name}
            onChangeText={setName}
          />

          <Input
            textLabel="Especialidade"
            placeholder="BARBER"
            messageError="Especialidade obrigatória"
            value={specialty}
            onChangeText={setSpecialty}
          />

          <Button title="Cadastrar" onPress={handleSubmit} />
        </FormControl>
      </VStack>
    </ScrollView>
  );
}
