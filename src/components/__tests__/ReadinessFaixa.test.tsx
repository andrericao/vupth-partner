import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ReadinessFaixa } from "../ReadinessFaixa";
import { ownerCompletion } from "@lib/completion";
import { useUiStore } from "@store/ui.store";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const base = {
  hasName: false,
  hasServiceType: false,
  hasAddress: false,
  hasHours: false,
  hasProfessionalWithService: false,
  hasPhone: false,
  hasInstagram: false,
};
const pending = ownerCompletion(base); // 5 pendencias basicas
const onePending = ownerCompletion({
  ...base,
  hasName: true,
  hasServiceType: true,
  hasAddress: true,
  hasHours: true,
}); // falta 1
const done = ownerCompletion({
  hasName: true,
  hasServiceType: true,
  hasAddress: true,
  hasHours: true,
  hasProfessionalWithService: true,
  hasPhone: true,
  hasInstagram: true,
}); // basico 100%

describe("ReadinessFaixa", () => {
  beforeEach(() => {
    useUiStore.getState().resetFaixa();
    jest.clearAllMocks();
  });

  it("renderiza quando ha pendência basica e não foi dispensada", () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <ReadinessFaixa completion={pending} targetRoute="/x" goalNoun="aparecer aos clientes" />
    );
    // Pelo rotulo de acessibilidade, nao pelo titulo: o titulo mudou com o
    // redesenho ("Faltam N passos para abrir") e voltaria a quebrar o teste na
    // proxima troca de copy. O que importa e que a faixa APARECE.
    expect(getByLabelText("Completar cadastro")).toBeTruthy();
    expect(getByText(/5 passos para aparecer aos clientes/)).toBeTruthy();
  });

  it("usa singular '1 passo' quando falta só um", () => {
    const { getByText } = renderWithProvider(
      <ReadinessFaixa completion={onePending} targetRoute="/x" goalNoun="atender clientes" />
    );
    expect(getByText(/1 passo para atender clientes/)).toBeTruthy();
  });

  it("não renderiza quando o básico esta 100%", () => {
    const { queryByLabelText } = renderWithProvider(
      <ReadinessFaixa completion={done} targetRoute="/x" goalNoun="x" />
    );
    expect(queryByLabelText("Completar cadastro")).toBeNull();
  });

  it("não renderiza quando já foi dispensada", () => {
    useUiStore.getState().dismissFaixa();
    const { queryByLabelText } = renderWithProvider(
      <ReadinessFaixa completion={pending} targetRoute="/x" goalNoun="x" />
    );
    expect(queryByLabelText("Completar cadastro")).toBeNull();
  });

  it("tocar na faixa navega para o targetRoute", () => {
    const { getByLabelText } = renderWithProvider(
      <ReadinessFaixa completion={pending} targetRoute="/(owner)/establishment-data" goalNoun="x" />
    );
    fireEvent.press(getByLabelText("Completar cadastro"));
    expect(router.push).toHaveBeenCalledWith("/(owner)/establishment-data");
  });

  it("tocar no X dispensa a faixa", () => {
    const { getByLabelText } = renderWithProvider(
      <ReadinessFaixa completion={pending} targetRoute="/x" goalNoun="x" />
    );
    fireEvent.press(getByLabelText("Fechar aviso"));
    expect(useUiStore.getState().faixaDismissed).toBe(true);
  });
});
