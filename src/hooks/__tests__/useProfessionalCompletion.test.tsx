import { renderHook } from "@testing-library/react-native";

import { useProfessionalCompletion } from "../useProfessionalCompletion";

const mockFetchMyServices = jest.fn().mockResolvedValue(undefined);
jest.mock("@store/professional.store", () => ({
  useProfessionalStore: (sel: (s: unknown) => unknown) =>
    sel({
      professional: { establishment_id: 1, nickname: null, specialty: null },
      myServices: [],
      fetchMyServices: mockFetchMyServices,
    }),
}));

describe("useProfessionalCompletion", () => {
  it("a linha Apelido abre os Dados cadastrais ja no campo do apelido", () => {
    const { result } = renderHook(() => useProfessionalCompletion());
    expect(result.current.routeFor("nickname")).toBe(
      "/(professional)/settings-account?editar=nickname"
    );
  });
});
