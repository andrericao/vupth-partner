import { LinhaComInterruptor } from "@components/LinhaComInterruptor";

type Props = {
  expor: boolean;
  onMudar: (expor: boolean) => void;
  ocupado?: boolean;
};

// expor-posicao (decisao de 05/09; contrato do Backend 35d57c0): o cliente ve a
// posicao dele na fila deste profissional. O padrao e mostrar; esconder e a
// escolha ativa. Fica no menu da fila, junto do Funcionamento.
//
// Usa a MESMA linha dos outros interruptores do app (validacao de 17/10, DS7):
// esta tinha o proprio trilho — #C9CBC9, cor que nao existe na paleta, e forest
// quando ligado — e o mesmo gesto tinha duas cores no mesmo menu.
export function ExporPosicao({ expor, onMudar, ocupado = false }: Props) {
  return (
    <LinhaComInterruptor
      testID="expor-posicao"
      rotulo="Mostrar a posição na fila"
      descricao={
        expor
          ? "O cliente vê a posição dele na fila."
          : "O cliente não vê a posição — só a previsão de quando será chamado."
      }
      ligado={expor}
      onMudar={onMudar}
      desabilitado={ocupado}
    />
  );
}
