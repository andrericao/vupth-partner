import { useEffect, useState } from "react";
import { Text } from "react-native";
import { LinhaComInterruptor } from "@components/LinhaComInterruptor";
import { getApiErrorMessage } from "@lib/api";
import { obterOfertaPixDoDono, salvarOfertaPixDoDono } from "@lib/pix";

type Props = {
  obter?: typeof obterOfertaPixDoDono;
  salvar?: typeof salvarOfertaPixDoDono;
};

/**
 * interruptor-pix-do-dono (DEC-138): "oferecer o Pix do dono". Padrao desligado;
 * so liga quem escolhe. Salva ao tocar e volta ao valor anterior se a API falhar.
 */
export function OferecerPixDoDono({ obter = obterOfertaPixDoDono, salvar = salvarOfertaPixDoDono }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [ligado, setLigado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    obter()
      .then(setLigado)
      .catch(() => setErro("Não foi possível carregar esta opção."))
      .finally(() => setCarregando(false));
  }, [obter]);

  const mudar = async (valor: boolean) => {
    setSalvando(true);
    setErro(null);
    try {
      setLigado(await salvar(valor));
    } catch (e: any) {
      setErro(getApiErrorMessage(e, "Não foi possível salvar. Tente de novo."));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return null;
  return (
    <>
      <LinhaComInterruptor
        testID="oferecer-pix-do-dono"
        rotulo="Oferecer o Pix do dono"
        descricao={
          ligado
            ? "O cliente pode pagar também no Pix do dono do estabelecimento."
            : "O cliente paga só na sua chave Pix."
        }
        ligado={ligado}
        onMudar={mudar}
        desabilitado={salvando}
      />
      {!!erro && <Text className="font-body text-sm text-vupth-danger mt-2">{erro}</Text>}
    </>
  );
}
