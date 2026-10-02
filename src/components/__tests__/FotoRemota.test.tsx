import { View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { carregarExpoImage } from "@lib/modulosNativos";
import { FotoRemota } from "../FotoRemota";

jest.mock("@lib/modulosNativos", () => ({ carregarExpoImage: jest.fn() }));
const carregar = carregarExpoImage as jest.Mock;

const URI = "https://pub.r2.dev/establishment/loja.jpg";

describe("FotoRemota", () => {
  it("com o expo-image no aparelho: cache em disco, cover e transicao curta", () => {
    const ExpoImage = (props: any) => <View {...props} />;
    carregar.mockReturnValue({ Image: ExpoImage });

    render(<FotoRemota uri={URI} style={{ width: 40, height: 40 }} testID="foto" />);

    const foto = screen.getByTestId("foto");
    expect(foto.props.source).toEqual({ uri: URI });
    expect(foto.props.cachePolicy).toBe("memory-disk");
    expect(foto.props.contentFit).toBe("cover");
    expect(foto.props.recyclingKey).toBe(URI);
    expect(foto.props.transition).toBe(150);
  });

  it("binario antigo (sem o modulo): o Image do RN, com cover", () => {
    carregar.mockReturnValue(null);

    render(<FotoRemota uri={URI} style={{ width: 40, height: 40 }} testID="foto" />);

    const foto = screen.getByTestId("foto");
    expect(foto.props.source).toEqual({ uri: URI });
    expect(foto.props.resizeMode).toBe("cover");
    expect(foto.props.cachePolicy).toBeUndefined();
  });
});
