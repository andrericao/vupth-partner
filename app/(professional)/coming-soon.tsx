import { router, useLocalSearchParams } from "expo-router";
import { ComingSoon } from "@components/ComingSoon";

export default function ProfessionalComingSoonScreen() {
  const { title } = useLocalSearchParams<{ title: string }>();
  return (
    <ComingSoon
      title={title ?? "Em breve"}
      onBack={() => router.navigate("/(professional)/profile" as any)}
    />
  );
}
