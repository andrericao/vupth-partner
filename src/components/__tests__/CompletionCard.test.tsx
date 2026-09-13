import { render } from "@testing-library/react-native";

import { CompletionCard } from "../CompletionCard";
import { ownerCompletion } from "@lib/completion";

// 🔴 "Quero o dot também no card que contém a barra, pois alguns usuários não
// entenderam que o card é clicável" (Andre, 11/09).
//
// As linhas SEMPRE navegaram — cada pendência tem rota desde que o card existe.
// O que faltava não era navegação, era AFFORDANCE: o card parecia um resumo, e
// resumo ninguém toca. O dot é o mesmo das Configurações de propósito: quem
// aprendeu o significado num lugar não reaprende no outro.
const nada = {
  hasName: false, hasServiceType: false, hasAddress: false, hasHours: false,
  hasProfessionalWithService: false, hasPhone: false, hasInstagram: false,
};
const tudo = {
  hasName: true, hasServiceType: true, hasAddress: true, hasHours: true,
  hasProfessionalWithService: true, hasPhone: true, hasInstagram: true,
};

describe("CompletionCard", () => {
  it("com pendência, mostra o dot no bloco da barra", () => {
    const { getAllByLabelText } = render(
      <CompletionCard completion={ownerCompletion(nada)} routeFor={() => "/x"} />
    );

    expect(getAllByLabelText("Pendencias no cadastro").length).toBeGreaterThan(0);
  });

  it("o texto CONVIDA ao toque — sem isso o card parece um resumo", () => {
    const { getByText } = render(
      <CompletionCard completion={ownerCompletion(nada)} routeFor={() => "/x"} />
    );

    expect(getByText(/Toque/)).toBeTruthy();
  });

  it("tudo completo: o card inteiro some, e com ele o dot", () => {
    const { toJSON } = render(
      <CompletionCard completion={ownerCompletion(tudo)} routeFor={() => "/x"} />
    );

    expect(toJSON()).toBeNull();
  });

  it("básico pronto e perfil pendente: o dot fica no PERFIL, não na barra", () => {
    const so_perfil = { ...tudo, hasPhone: false, hasInstagram: false };
    const { getAllByLabelText, queryByText } = render(
      <CompletionCard completion={ownerCompletion(so_perfil)} routeFor={() => "/x"} />
    );

    // A barra "Pronto para atender" nao aparece mais (basico em 100%).
    expect(queryByText("Pronto para atender")).toBeNull();
    expect(getAllByLabelText("Pendencias no cadastro").length).toBe(1);
  });
});
