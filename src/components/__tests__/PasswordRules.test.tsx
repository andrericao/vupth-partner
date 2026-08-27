import { render } from "@testing-library/react-native";
import { PasswordRules } from "../PasswordRules";
import { getPasswordRules } from "@lib/passwordValidation";

// Componente NativeWind (RN puro + className) — sem GluestackUIProvider.
describe("PasswordRules (checklist ao vivo)", () => {
  it("renderiza uma linha por regra recebida", () => {
    const rules = getPasswordRules("abc");
    const view = render(<PasswordRules rules={rules} />);
    rules.forEach((rule) => expect(view.getByText(rule.label)).toBeTruthy());
  });

  it("mostra as regras cumpridas e as pendentes lado a lado", () => {
    const view = render(
      <PasswordRules
        rules={[
          { label: "Cumprida", passed: true },
          { label: "Pendente", passed: false },
        ]}
      />
    );
    expect(view.getByText("Cumprida")).toBeTruthy();
    expect(view.getByText("Pendente")).toBeTruthy();
  });
});
