import { useEffect } from "react";
import { usePathname } from "expo-router";
import { useAuthStore } from "@store/auth.store";
import { useProfessionalStore } from "@store/professional.store";
import { useEstablishmentStore } from "@store/establishment.store";
import { marcarContexto } from "@lib/sentry";

// sentry-contexto-e-limpeza (Andre, 22/10): cada evento leva o papel, o id da loja
// e a tela. Nunca nome, e-mail nem telefone. Sem DSN o marcarContexto nao faz nada.
export function useContextoDoSentry(): void {
  const pathname = usePathname();
  const roles = useAuthStore((s) => s.user?.roles);
  const lojaDoProfissional = useProfessionalStore((s) => s.professional?.establishment_id);
  const lojaDoDono = useEstablishmentStore((s) => s.establishment?.id);

  const papel = roles?.includes("OWNER") ? "dono" : roles?.includes("PROFESSIONAL") ? "profissional" : null;
  const lojaId = lojaDoDono ?? lojaDoProfissional ?? null;

  useEffect(() => {
    marcarContexto({ papel, lojaId });
  }, [papel, lojaId]);

  useEffect(() => {
    marcarContexto({ tela: pathname });
  }, [pathname]);
}
