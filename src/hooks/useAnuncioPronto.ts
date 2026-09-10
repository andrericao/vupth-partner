import { useEffect, useRef } from "react";

import { avisar } from "@lib/confirmar";
import { deveAnunciar, jaAnunciou, marcarAnunciado } from "@lib/anuncioPronto";

/**
 * Anuncia UMA vez que o cadastro fechou — em modal, não em faixa.
 *
 * 🔴 Pedido dele (10/09). A faixa verde ficava na tela enquanto o "Perfil
 * completo" não fechasse; o modal aparece no momento do fato e some.
 *
 * O `avisar()` já é a costura única de diálogo do app, então a caixa é a da
 * marca nas duas plataformas — sem escrever modal nenhum aqui.
 */
export function useAnuncioPronto(
  perfil: "dono" | "profissional",
  percentBasico: number,
  mensagem: string
) {
  // Trava de sessão: o storage é assíncrono, e sem isto duas renderizações
  // seguidas disparariam dois modais antes de a primeira gravação terminar.
  const disparado = useRef(false);

  useEffect(() => {
    if (disparado.current || percentBasico !== 100) return;
    let cancelado = false;

    (async () => {
      const ja = await jaAnunciou(perfil);
      if (cancelado || !deveAnunciar(percentBasico, ja)) return;
      disparado.current = true;
      await marcarAnunciado(perfil);
      await avisar({ titulo: "Cadastro completo", mensagem });
    })();

    return () => {
      cancelado = true;
    };
  }, [perfil, percentBasico, mensagem]);
}
