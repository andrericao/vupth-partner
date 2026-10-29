import { render, fireEvent, screen } from "@testing-library/react-native";
import { EnquadrarFoto, recorteDoVisor, toquesAtivos } from "../EnquadrarFoto";

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

describe("recorteDoVisor com zoom (zoom-na-foto, Andre 29/10)", () => {
  it("2x: metade do lado, no canto ou no centro conforme o arraste", () => {
    // 1200x800, visor 320, zoom 2: lado 400; foto no visor mede 960x640
    expect(recorteDoVisor({ width: 1200, height: 800 }, 320, 0, 0, 2)).toEqual({ originX: 0, originY: 0, width: 400, height: 400 });
    expect(recorteDoVisor({ width: 1200, height: 800 }, 320, -320, -160, 2)).toEqual({
      originX: 400,
      originY: 200,
      width: 400,
      height: 400,
    });
  });
  it("arrastada alem da borda com zoom: fica dentro da foto", () => {
    expect(recorteDoVisor({ width: 1200, height: 800 }, 320, -9999, -9999, 2)).toMatchObject({ originX: 800, originY: 400 });
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

describe("EnquadrarFoto: pinca", () => {
  const foto = { uri: "file:///f.jpg", width: 800, height: 800 };
  const toque = (pageX: number, pageY: number) => ({ pageX, pageY });
  const historico = (n: number, t: number) => ({
    numberActiveTouches: n,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: t,
    touchBank: Array.from({ length: n }, () => ({
      touchActive: true,
      startPageX: 0,
      startPageY: 0,
      startTimeStamp: 0,
      currentPageX: 0,
      currentPageY: 0,
      currentTimeStamp: t,
      previousPageX: 0,
      previousPageY: 0,
      previousTimeStamp: 0,
    })),
  });
  const mover = (visor: any, toques: { pageX: number; pageY: number }[], t: number) =>
    fireEvent(visor, "responderMove", {
      nativeEvent: { touches: toques, changedTouches: toques },
      touchHistory: historico(toques.length, t),
    });

  function abrirComPinca() {
    const onUsar = jest.fn();
    render(<EnquadrarFoto foto={foto} onUsar={onUsar} onCancelar={jest.fn()} testID="foto-perfil" />);
    const visor = screen.getByTestId("foto-perfil-visor");
    fireEvent(visor, "responderGrant", { nativeEvent: { touches: [{}], changedTouches: [{}] }, touchHistory: historico(1, 0) });
    return { onUsar, visor };
  }

  it("afastar os dois dedos amplia: o recorte encolhe e fica centralizado", () => {
    const { onUsar, visor } = abrirComPinca();
    mover(visor, [toque(100, 100), toque(200, 100)], 1); // comeca a pinca
    mover(visor, [toque(50, 100), toque(250, 100)], 2); // distancia 100 -> 200: 2x
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenLastCalledWith({ originX: 200, originY: 200, width: 400, height: 400 });
  });

  it("o zoom para em 4x e nao desce de 1x", () => {
    const { onUsar, visor } = abrirComPinca();
    mover(visor, [toque(100, 100), toque(110, 100)], 1);
    mover(visor, [toque(0, 100), toque(900, 100)], 2); // 90x: trava em 4x
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenLastCalledWith(expect.objectContaining({ width: 200, height: 200 }));
    mover(visor, [toque(100, 100), toque(110, 100)], 3); // volta quase a zero: trava em 1x
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenLastCalledWith({ originX: 0, originY: 0, width: 800, height: 800 });
  });

  it("depois de ampliar, um dedo arrasta e escolhe a parte do centro", () => {
    const { onUsar, visor } = abrirComPinca();
    mover(visor, [toque(100, 100), toque(200, 100)], 1);
    mover(visor, [toque(50, 100), toque(250, 100)], 2); // 2x
    mover(visor, [toque(10, 10)], 3); // um dedo: recomeca a base
    fireEvent(visor, "responderMove", {
      nativeEvent: { touches: [toque(10, 10)], changedTouches: [toque(10, 10)] },
      touchHistory: historico(1, 4),
    });
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    expect(onUsar).toHaveBeenLastCalledWith(expect.objectContaining({ width: 400, height: 400 }));
  });
});

describe("toquesAtivos", () => {
  const dedo = (x: number) => ({ pageX: x, pageY: 0 });
  it("usa o nativeEvent.touches quando ha dois", () => {
    expect(toquesAtivos({ nativeEvent: { touches: [dedo(1), dedo(2)] } })).toHaveLength(2);
  });
  it("com um so no nativeEvent, le os ativos do historico do PanResponder", () => {
    const bank = [
      { touchActive: true, currentPageX: 10, currentPageY: 0 },
      { touchActive: true, currentPageX: 50, currentPageY: 0 },
      { touchActive: false, currentPageX: 99, currentPageY: 0 },
    ];
    expect(toquesAtivos({ nativeEvent: { touches: [dedo(10)] }, touchHistory: { touchBank: bank } })).toEqual([dedo(10), dedo(50)]);
  });
  it("sem dois dedos em lugar nenhum: devolve o que tem", () => {
    expect(toquesAtivos({ nativeEvent: { touches: [dedo(1)] } })).toHaveLength(1);
    expect(toquesAtivos({})).toEqual([]);
  });
});

describe("EnquadrarFoto: o zoom nao pula entre quadros", () => {
  const foto = { uri: "file:///f.jpg", width: 800, height: 800 };
  const hist = (n: number, ts = 1) => ({
    numberActiveTouches: n,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: ts,
    touchBank: Array.from({ length: n }, () => ({
      touchActive: true, startPageX: 0, startPageY: 0, startTimeStamp: 0,
      currentPageX: 0, currentPageY: 0, currentTimeStamp: ts, previousPageX: 0, previousPageY: 0, previousTimeStamp: 0,
    })),
  });
  let quadro = 0;
  const mover = (visor: any, abertura: number) => {
    quadro += 1;
    const t = [{ pageX: 200 - abertura / 2, pageY: 100 }, { pageX: 200 + abertura / 2, pageY: 100 }];
    fireEvent(visor, "responderMove", { nativeEvent: { touches: t, changedTouches: t }, touchHistory: hist(2, quadro) });
  };

  it("pinca em varios quadros: o recorte fica centrado no mesmo ponto", () => {
    const onUsar = jest.fn();
    render(<EnquadrarFoto foto={foto} onUsar={onUsar} onCancelar={jest.fn()} testID="f" />);
    const visor = screen.getByTestId("f-visor");
    fireEvent(visor, "responderGrant", { nativeEvent: { touches: [{}], changedTouches: [{}] }, touchHistory: hist(1, 0) });
    mover(visor, 100); // comeca
    mover(visor, 120);
    mover(visor, 150);
    mover(visor, 200); // 2x no total
    fireEvent.press(screen.getByTestId("f-usar"));
    expect(onUsar).toHaveBeenLastCalledWith({ originX: 200, originY: 200, width: 400, height: 400 });
  });
});
