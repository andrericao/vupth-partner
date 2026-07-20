import { Tabs } from "expo-router";

// Area do profissional SEM tab bar (design Andre 2026-07-18): a navegacao passa
// pelo menu ☰ no cabecalho (src/components/ProfessionalMenu.tsx) e o rodape fica
// livre para o botao fixo "Iniciar proximo" da fila.
//
// Mantemos o navigator `Tabs` (em vez de trocar por Stack) para NAO mexer no
// roteamento ja existente — as telas seguem sendo rotas irmas e o
// `router.navigate` explicito de cada tela continua valendo. Apenas escondemos
// a barra e removemos os botoes (`href: null` em todas).
const HIDDEN = { href: null } as const;

export default function ProfessionalLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="queue" options={HIDDEN} />
      <Tabs.Screen name="my-services" options={HIDDEN} />
      <Tabs.Screen name="profile" options={HIDDEN} />
      <Tabs.Screen name="onboarding" options={HIDDEN} />
      <Tabs.Screen name="attendances" options={HIDDEN} />
      <Tabs.Screen name="reports" options={HIDDEN} />
      <Tabs.Screen name="settings" options={HIDDEN} />
      <Tabs.Screen name="add-guest" options={HIDDEN} />
      <Tabs.Screen name="find-establishment" options={HIDDEN} />
      <Tabs.Screen name="establishment-detail" options={HIDDEN} />
      <Tabs.Screen name="meals" options={HIDDEN} />
    </Tabs>
  );
}
