type Updates = {
  runtimeVersion?: string | null;
  channel?: string | null;
  updateId?: string | null;
  createdAt?: Date | null;
};

const quando = (d: Date) => `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

/**
 * A linha da versao na tela Sistema. No aparelho: runtime, canal e o OTA
 * aplicado (id + data/hora de publicacao). Na web o expo-updates nao tem nada
 * disso — vale a versao do app.json e a data/hora do build (Andre, 26/09).
 */
export function linhaDaVersao(a: {
  plataforma: string;
  versaoApp?: string | null;
  updates: Updates;
  /** ISO carimbado pelo build:web (EXPO_PUBLIC_BUILD_TIME). */
  dataDoBuild?: string | null;
}): string {
  if (a.plataforma === "web") {
    const data = a.dataDoBuild ? new Date(a.dataDoBuild) : null;
    const partes = [a.versaoApp, "web", data && !isNaN(data.getTime()) ? quando(data) : null];
    return partes.filter(Boolean).join(" · ");
  }
  const u = a.updates;
  const ota = u.updateId
    ? `OTA ${u.updateId.slice(0, 8)}${u.createdAt ? ` · ${quando(u.createdAt)}` : ""}`
    : "bundle embutido (nenhum OTA aplicado)";
  return [u.runtimeVersion, u.channel, ota].filter(Boolean).join(" · ");
}
