import { render, fireEvent, screen } from "@testing-library/react-native";
import { EnquadrarFoto, recorteDoVisor } from "../EnquadrarFoto";

jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

// foto-ux (Andre, 15/10): o recorte e nosso — a foto no circulo, arrastar para
// enquadrar e dois botoes com texto (Cancelar e Usar foto).
describe("recorteDoVisor", () => {
  it("no centro de uma foto deitada: o quadrado do meio", () => {
    // 1200x800 num visor de 320: escala 0.4, largura 480, centro dx = -80
    expect(recorteDoVisor({ width: 1200, height: 800 }, 320, -80, 0)).toEqual({
      originX: 200,
      originY: 0,
      width: 800,
      height: 800,
    });
  });

  it("arrastada alem da borda: fica dentro da foto", () => {
    expect(recorteDoVisor({ width: 800, height: 1200 }, 320, 0, -999).originY).toBe(400);
    expect(recorteDoVisor({ width: 800, height: 1200 }, 320, 50, 50)).toMatchObject({ originX: 0, originY: 0 });
  });
});

describe("EnquadrarFoto", () => {
  const foto = { uri: "file:///f.jpg", width: 1200, height: 800 };

  it("sem foto: nada na tela", () => {
    render(<EnquadrarFoto foto={null} onUsar={jest.fn()} onCancelar={jest.fn()} />);
    expect(screen.queryByText("Ajuste a foto")).toBeNull();
  });

  it("mostra o titulo, a dica e os dois botoes com texto", () => {
    render(<EnquadrarFoto foto={foto} onUsar={jest.fn()} onCancelar={jest.fn()} />);
    expect(screen.getByText("Ajuste a foto")).toBeTruthy();
    expect(screen.getByText("Arraste para enquadrar no círculo")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Usar foto")).toBeTruthy();
  });

  it("Usar foto sem arrastar: o quadrado do meio", () => {
    const onUsar = jest.fn();
    render(<EnquadrarFoto foto={foto} onUsar={onUsar} onCancelar={jest.fn()} testID="foto-perfil" />);
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenCalledWith({ originX: 200, originY: 0, width: 800, height: 800 });
  });

  it("arrastar para a direita mostra a esquerda da foto (e para na borda)", () => {
    const onUsar = jest.fn();
    render(<EnquadrarFoto foto={foto} onUsar={onUsar} onCancelar={jest.fn()} testID="foto-perfil" />);
    const visor = screen.getByTestId("foto-perfil-visor");
    const historico = (x: number, t: number) => ({
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: t,
      touchBank: [
        {
          touchActive: true,
          startPageX: 0,
          startPageY: 0,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: 0,
          currentTimeStamp: t,
          previousPageX: 0,
          previousPageY: 0,
          previousTimeStamp: 0,
        },
      ],
    });
    const evento = { nativeEvent: { touches: [{}], changedTouches: [{}] } };
    expect(visor.props.onStartShouldSetResponder({ ...evento, touchHistory: historico(0, 0) })).toBe(true);
    expect(visor.props.onMoveShouldSetResponder({ ...evento, touchHistory: historico(0, 0) })).toBe(true);
    fireEvent(visor, "responderGrant", { ...evento, touchHistory: historico(0, 0) });
    fireEvent(visor, "responderMove", { ...evento, touchHistory: historico(40, 1) });
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    // centro dx = -80; +40 = -40 -> originX 100 (escala 0.4)
    expect(onUsar).toHaveBeenLastCalledWith({ originX: 100, originY: 0, width: 800, height: 800 });
    fireEvent(visor, "responderMove", { ...evento, touchHistory: historico(500, 2) });
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenLastCalledWith({ originX: 0, originY: 0, width: 800, height: 800 });
  });

  it("sem o tamanho da foto: Usar foto sem recorte", () => {
    const onUsar = jest.fn();
    render(<EnquadrarFoto foto={{ uri: "blob:x" }} onUsar={onUsar} onCancelar={jest.fn()} />);
    fireEvent.press(screen.getByText("Usar foto"));
    expect(onUsar).toHaveBeenCalledWith(undefined);
  });

  it("Cancelar avisa e uma foto nova volta ao centro", () => {
    const onCancelar = jest.fn();
    const onUsar = jest.fn();
    const { rerender } = render(<EnquadrarFoto foto={foto} onUsar={onUsar} onCancelar={onCancelar} />);
    fireEvent.press(screen.getByText("Cancelar"));
    expect(onCancelar).toHaveBeenCalled();
    rerender(<EnquadrarFoto foto={{ uri: "file:///g.jpg", width: 800, height: 1200 }} onUsar={onUsar} onCancelar={onCancelar} />);
    fireEvent.press(screen.getByText("Usar foto"));
    expect(onUsar).toHaveBeenCalledWith({ originX: 0, originY: 200, width: 800, height: 800 });
  });
});
