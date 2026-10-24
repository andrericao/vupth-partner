import { renderHook } from "@testing-library/react-native";
import { useContextoDoSentry } from "../useContextoDoSentry";
import { useAuthStore } from "@store/auth.store";
import { useProfessionalStore } from "@store/professional.store";
import { useEstablishmentStore } from "@store/establishment.store";
import { marcarContexto } from "@lib/sentry";

jest.mock("expo-router", () => ({ usePathname: () => "/(professional)/queue" }));
jest.mock("@lib/sentry", () => ({ marcarContexto: jest.fn() }));

describe("useContextoDoSentry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null } as any);
    useProfessionalStore.setState({ professional: null } as any);
    useEstablishmentStore.setState({ establishment: null } as any);
  });

  it("sem login: papel nulo, sem loja, e a tela", () => {
    renderHook(() => useContextoDoSentry());
    expect(marcarContexto).toHaveBeenCalledWith({ papel: null, lojaId: null });
    expect(marcarContexto).toHaveBeenCalledWith({ tela: "/(professional)/queue" });
  });

  it("dono: papel dono e o id da loja dele", () => {
    useAuthStore.setState({ user: { id: "u", email: "a@b.com", roles: ["OWNER", "PROFESSIONAL"] } } as any);
    useEstablishmentStore.setState({ establishment: { id: "L1" } } as any);
    renderHook(() => useContextoDoSentry());
    expect(marcarContexto).toHaveBeenCalledWith({ papel: "dono", lojaId: "L1" });
  });

  it("profissional: a loja do vinculo; nada de nome nem e-mail no contexto", () => {
    useAuthStore.setState({ user: { id: "u", email: "a@b.com", roles: ["PROFESSIONAL"] } } as any);
    useProfessionalStore.setState({ professional: { establishment_id: "L2", name: "Ana" } } as any);
    renderHook(() => useContextoDoSentry());
    expect(marcarContexto).toHaveBeenCalledWith({ papel: "profissional", lojaId: "L2" });
    expect(JSON.stringify((marcarContexto as jest.Mock).mock.calls)).not.toMatch(/Ana|a@b\.com/);
  });
});
