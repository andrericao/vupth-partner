import { subtituloDasConfiguracoes } from "@lib/subtituloDasConfiguracoes";

// Andre, 25/09: nas Configuracoes do profissional vinculado aparecia
// "NAIL_TECH · Nome da loja" — o codigo da especialidade, cru. A especialidade
// sai do subtitulo; fica so a loja.
describe("subtituloDasConfiguracoes", () => {
  it("vinculado: so o nome da loja, sem a especialidade", () => {
    expect(
      subtituloDasConfiguracoes({ specialty: "NAIL_TECH", establishment_name: "Studio Ana" })
    ).toBe("Studio Ana");
  });

  it("sem loja: o convite para completar o cadastro", () => {
    expect(subtituloDasConfiguracoes({ specialty: "BARBER", establishment_name: null })).toBe(
      "Complete seu cadastro para atender"
    );
    expect(subtituloDasConfiguracoes(null)).toBe("Complete seu cadastro para atender");
  });
});
