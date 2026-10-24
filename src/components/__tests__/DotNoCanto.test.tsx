import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { DotNoCanto } from "@components/DotNoCanto";

// dot-no-canto-do-card (Andre, 24/10): o dot fica no canto superior direito.
describe("DotNoCanto", () => {
  it("card solto: monta sobre a borda, meio para fora, no canto superior direito", () => {
    const r = render(
      <DotNoCanto testID="d">
        <Text>.</Text>
      </DotNoCanto>
    );
    expect(r.getByTestId("d").props.style).toEqual({ position: "absolute", top: -4, right: -4 });
  });

  it("linha dentro de um grupo: rente ao canto, por dentro", () => {
    const r = render(
      <DotNoCanto dentro testID="d">
        <Text>.</Text>
      </DotNoCanto>
    );
    expect(r.getByTestId("d").props.style).toEqual({ position: "absolute", top: 6, right: 8 });
  });
});
