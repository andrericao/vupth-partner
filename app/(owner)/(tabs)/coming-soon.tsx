import { router, useLocalSearchParams } from "expo-router";
import { ComingSoon } from "@components/comingSoon";

export default function OwnerComingSoonScreen() {
  const { title } = useLocalSearchParams<{ title: string }>();
  return (
    <ComingSoon
      title={title ?? "Em breve"}
      onBack={() => router.navigate("/(owner)/menu" as any)}
    />
  );
}
