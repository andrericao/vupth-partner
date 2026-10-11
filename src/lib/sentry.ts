/* eslint-disable @typescript-eslint/no-require-imports */
// sentry (Andre, 09/10: "pode instalar o sentry sim"): relatorio de erros e
// crash. O DSN vem do ambiente na hora do build/OTA (EXPO_PUBLIC_SENTRY_DSN),
// nunca do repositorio. Sem DSN, o SDK nem e carregado: fica inerte. Nos
// testes (jest), nunca liga.
//
// Carregado sob demanda, como as outras libs nativas (modulosNativos.ts): um
// binario anterior ao build com o Sentry nao pode derrubar o app num OTA.

type Sentry = typeof import("@sentry/react-native");

export type ConfigDoSentry = {
  dsn?: string | null;
  ambiente: string;
  commit?: string | null;
  /** Rodando no jest: nunca liga. */
  emTeste?: boolean;
  carregar?: () => Sentry | null;
};

/**
 * O binario tem o modulo nativo do Sentry? volta-1-5-0 (Andre, 10/10): o OTA
 * roda no APK 1.5.0, anterior ao Sentry; o require do JS passa la, e a falha so
 * apareceria depois. Pergunta-se ao React Native antes (como o expo-image).
 */
export function temSentryNativo(): boolean {
  // O TurboModuleRegistry.get tambem acha o modulo da arquitetura antiga.
  const { TurboModuleRegistry } = require("react-native");
  return TurboModuleRegistry.get("RNSentry") != null;
}

export function carregarSentry(
  temNativo: () => boolean = temSentryNativo,
  requerer: () => Sentry = () => require("@sentry/react-native")
): Sentry | null {
  try {
    if (!temNativo()) return null;
    return requerer();
  } catch {
    return null;
  }
}

/** Liga o Sentry se houver DSN. Devolve se ligou. */
export function iniciarSentry({ dsn, ambiente, commit, emTeste, carregar = carregarSentry }: ConfigDoSentry): boolean {
  const chave = dsn?.trim();
  if (!chave || emTeste) return false;
  const sentry = carregar();
  if (!sentry) return false;
  try {
    sentry.init({
      dsn: chave,
      environment: ambiente,
      release: commit ?? undefined,
      // So erros e crash: sem rastreio de desempenho nem replay de tela.
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
    return true;
  } catch {
    return false;
  }
}
