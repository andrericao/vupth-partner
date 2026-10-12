import { render, fireEvent } from "@testing-library/react-native";
import { Linking } from "react-native";
import { FaixaBaixarApp } from "@components/FaixaBaixarApp";

const ANDROID = "Mozilla/5.0 (Linux; Android 14)";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";

describe("FaixaBaixarApp", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it("no navegador Android, oferece baixar ou continuar na web", () => {
    const { getByTestId, getByText } = render(
      <FaixaBaixarApp web userAgent={ANDROID} apkNoAr raiz="https://vupth-partner.pages.dev" />
    );
    expect(getByTestId("faixa-baixar-app")).toBeTruthy();
    expect(getByText("Baixar o app")).toBeTruthy();
    expect(getByText("Continuar na web")).toBeTruthy();
  });

  it("Baixar o app abre o /baixar do Partner", () => {
    const { getByTestId } = render(
      <FaixaBaixarApp web userAgent={ANDROID} apkNoAr raiz="https://vupth-partner.pages.dev" />
    );
    fireEvent.press(getByTestId("baixar-o-app"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://vupth-partner.pages.dev/baixar");
  });

  it("Continuar na web fecha a faixa", () => {
    const { getByTestId, queryByTestId } = render(
      <FaixaBaixarApp web userAgent={ANDROID} apkNoAr raiz="https://vupth-partner.pages.dev" />
    );
    fireEvent.press(getByTestId("continuar-na-web"));
    expect(queryByTestId("faixa-baixar-app")).toBeNull();
  });

  it("no iPhone nao aparece (nao ha app para iOS)", () => {
    const { queryByTestId } = render(
      <FaixaBaixarApp web userAgent={IPHONE} apkNoAr raiz="https://vupth-partner.pages.dev" />
    );
    expect(queryByTestId("faixa-baixar-app")).toBeNull();
  });

  it("dentro do app (fora do navegador) nunca aparece", () => {
    const { queryByTestId } = render(
      <FaixaBaixarApp web={false} userAgent={ANDROID} apkNoAr raiz="https://vupth-partner.pages.dev" />
    );
    expect(queryByTestId("faixa-baixar-app")).toBeNull();
  });

  it("sem o APK no ar, nao aparece", () => {
    const { queryByTestId } = render(
      <FaixaBaixarApp web userAgent={ANDROID} apkNoAr={false} raiz="https://vupth-partner.pages.dev" />
    );
    expect(queryByTestId("faixa-baixar-app")).toBeNull();
  });
});
