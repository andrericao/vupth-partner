import { useAuthStore } from "@store/auth.store";
import { ReativarContaModal } from "@components/ReativarContaModal";

/** O "Reativar / So consultar" ligado ao auth store — um so, na raiz do app. */
export function ReativarContaDoApp() {
  const aviso = useAuthStore((s) => s.avisoDeReativar);
  const reativar = useAuthStore((s) => s.reactivateAccount);
  const soConsultar = useAuthStore((s) => s.soConsultar);

  return <ReativarContaModal aviso={aviso} onReativar={reativar} onSoConsultar={soConsultar} />;
}
