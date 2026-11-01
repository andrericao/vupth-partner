import fs from "fs";
import path from "path";

// 01/11 (partner-fecha-ao-abrir): o OTA 2e0295d importava o async-storage no topo
// do bundle; no build SEM o modulo nativo o import lanca e o app fecha ao abrir.
// Modulo nativo que o build antigo pode nao ter so entra por `require` dentro de
// try/catch (ver ultimaFila.ts, EnquadrarFoto.tsx, pushBackground.ts).
// Ao publicar um OTA, conferir as dependencias nativas novas desde o build e, se
// houver, NAO publicar OTA: so build novo. Para liberar o import estatico de um
// modulo, ele precisa estar no build instalado: tire-o desta lista so depois.
const SOB_DEMANDA = [
  "@react-native-async-storage/async-storage",
  "react-native-gesture-handler",
  "expo-task-manager",
];

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === "__tests__" ? [] : arquivos(p);
    return /\.(ts|tsx|js)$/.test(d.name) ? [p] : [];
  });
}

describe("modulos nativos sob demanda", () => {
  const raiz = path.resolve(__dirname, "../../..");
  const todos = [...arquivos(path.join(raiz, "src")), ...arquivos(path.join(raiz, "app"))];

  // (d) o async-storage so pode ser tocado por armazenamentoOpcional.ts: nenhum outro
  // arquivo cita o pacote nem usa AsyncStorage direto (chamada fora do modulo reprova).
  it("o async-storage so e citado em armazenamentoOpcional.ts", () => {
    const fora = todos
      .filter((f) => !f.endsWith(path.join("lib", "armazenamentoOpcional.ts")))
      .filter((f) => !f.includes(`${path.sep}test-utils${path.sep}`)) // apoio de teste, nao entra no app
      .filter((f) => /async-storage|AsyncStorage/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(fora).toEqual([]);
  });

  it.each(SOB_DEMANDA)("%s nunca e importado de forma estatica", (modulo) => {
    const estatico = new RegExp(
      `^\\s*(import|export)\\s+(?!type\\b)[^;]*?from\\s+["']${modulo}["']|^\\s*import\\s+["']${modulo}["']`,
      "m"
    );
    const culpados = todos
      .filter((f) => estatico.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(culpados).toEqual([]);
  });
});
