import fs from "fs";
import path from "path";

// REMOVED × CANCELLED (backend, 18/09): os dois históricos — o do dono e o do
// profissional — tratam o valor novo e deixam filtrar os retirados.
const RAIZ = path.resolve(__dirname, "../../..");
const TELAS = ["app/(owner)/(tabs)/attendances.tsx", "app/(professional)/my-day.tsx"];

describe("os históricos tratam o REMOVED", () => {
  it.each(TELAS)("%s usa o rótulo compartilhado e filtra 'Retirados'", (arquivo) => {
    const src = fs.readFileSync(path.join(RAIZ, arquivo), "utf8");
    expect(src).toContain("seloDoStatus(");
    expect(src).toMatch(/key: "REMOVED", label: "Retirados"/);
  });

  it("o tipo do status conhece o valor novo", () => {
    const tipos = fs.readFileSync(path.join(RAIZ, "src/lib/types.ts"), "utf8");
    expect(tipos).toMatch(/\| "REMOVED"/);
  });
});
