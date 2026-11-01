import { TurboModuleRegistry } from "react-native";

const NOMES = ["PlatformLocalStorage", "RNC_AsyncSQLiteDBStorage", "RNCAsyncStorage"];

/** Finge que o binario TEM (ou nao tem) o modulo nativo do async-storage; o resto do RN segue real. */
export function simularNativoDoAsyncStorage(presente: boolean) {
  const original = TurboModuleRegistry.get.bind(TurboModuleRegistry);
  return jest.spyOn(TurboModuleRegistry, "get").mockImplementation(((nome: string) =>
    NOMES.includes(nome) ? (presente ? {} : null) : original(nome)) as never);
}
