import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import { getApiErrorMessage } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import {
  TIPOS_DE_CHAVE,
  apagarChavePix,
  chaveParaMostrar,
  erroDaChave,
  obterChavePix,
  salvarChavePix,
  titularDoPix,
  type ChavePix as Chave,
  type TipoDeChave,
} from "@lib/pix";

type Props = {
  /** O nome da conta, que vai como titular sem perguntar (pix-sem-nome). */
  nomeDaConta?: string | null;
  obter?: typeof obterChavePix;
  salvar?: typeof salvarChavePix;
  apagar?: typeof apagarChavePix;
  confirmarImpl?: typeof confirmar;
};

const TECLADO: Record<TipoDeChave, "default" | "email-address" | "phone-pad" | "number-pad"> = {
  RANDOM: "default",
  PHONE: "phone-pad",
  EMAIL: "email-address",
  CNPJ: "number-pad",
  CPF: "number-pad",
};

/**
 * pagamento-pix (contrato do Backend 2a2b0ec): a chave Pix do profissional. O
 * cliente ve a chave e o titular ao pagar (Pix copia-e-cola e QR). A aleatoria
 * vem primeiro e recomendada; o CPF por ultimo, com aviso (Andre, 10/10).
 * pix-sem-nome (PAR-6, 15/10): so a chave; o titular vai sozinho.
 */
export function ChavePix({
  nomeDaConta,
  obter = obterChavePix,
  salvar = salvarChavePix,
  apagar = apagarChavePix,
  confirmarImpl = confirmar,
}: Props) {
  const [carregando, setCarregando] = useState(true);
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(false);
  const [chave, setChave] = useState<Chave | null>(null);
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<TipoDeChave>("RANDOM");
  const [texto, setTexto] = useState("");
  const [erros, setErros] = useState<{ chave?: string | null; api?: string }>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obter()
      .then((c) => setChave(c))
      .catch(() => setFalhaAoCarregar(true))
      .finally(() => setCarregando(false));
  }, [obter]);

  if (carregando) return null;
  if (falhaAoCarregar)
    return (
      <Text className="font-body text-sm text-vupth-danger">
        Não foi possível carregar a chave Pix. Volte e tente de novo.
      </Text>
    );

  async function aoSalvar() {
    const e = { chave: erroDaChave(tipo, texto) };
    setErros(e);
    if (e.chave) return;
    setSalvando(true);
    try {
      const nova = await salvar({ tipo, chave: texto, titular: titularDoPix(chave?.holder_name || nomeDaConta) });
      setChave(nova);
      setEditando(false);
    } catch (err) {
      setErros({ api: getApiErrorMessage(err, "Não foi possível salvar a chave Pix.") });
    } finally {
      setSalvando(false);
    }
  }

  async function aoRemover() {
    const ok = await confirmarImpl({
      titulo: "Remover a chave Pix?",
      mensagem: "Sem chave, o cliente vê só o valor e paga direto a você.",
      confirmar: "Remover",
      destrutivo: true,
    });
    if (!ok) return;
    try {
      await apagar();
      setChave(null);
    } catch (err) {
      setErros({ api: getApiErrorMessage(err, "Não foi possível remover a chave Pix.") });
    }
  }

  function aoTrocar() {
    setTipo(chave?.key_type ?? "RANDOM");
    setTexto("");
    setErros({});
    setEditando(true);
  }

  if (chave && !editando)
    return (
      <View className="gap-4">
        <View className="bg-vupth-surface rounded-card p-4 gap-1">
          <Text className="font-body text-xs text-vupth-textSecondary">Sua chave</Text>
          <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{chaveParaMostrar(chave)}</Text>
        </View>
        {erros.api && <Text className="font-body text-sm text-vupth-danger">{erros.api}</Text>}
        <NwButton title="Trocar chave" variant="vupthOutline" onPress={aoTrocar} testID="pix-trocar" />
        <NwButton title="Remover chave" variant="vupthGhost" onPress={aoRemover} testID="pix-remover" />
      </View>
    );

  const aviso = TIPOS_DE_CHAVE.find((t) => t.tipo === tipo)?.aviso;
  return (
    <View className="gap-4">
      <Text className="font-body text-sm text-vupth-textSecondary">
        O cliente paga direto a você, com esta chave. Recomendamos a chave aleatória, o telefone ou o e-mail.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {TIPOS_DE_CHAVE.map((t) => {
          const ativo = t.tipo === tipo;
          return (
            <Pressable
              key={t.tipo}
              testID={`pix-tipo-${t.tipo}`}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              onPress={() => {
                setTipo(t.tipo);
                setErros({});
              }}
              className={`flex-row items-center gap-1.5 rounded-full border-2 px-3.5 py-2 ${
                ativo ? "bg-vupth-greenTint border-vupth-forest" : "bg-white border-vupth-border"
              }`}
            >
              <Text className="font-body text-sm text-vupth-forest">{t.rotulo}</Text>
              {t.recomendada && <Text className="font-body text-xs text-vupth-textSecondary">recomendada</Text>}
            </Pressable>
          );
        })}
      </View>
      {aviso && <Text className="font-body text-sm text-vupth-danger">{aviso}</Text>}
      <NwInput
        label="Chave Pix"
        value={texto}
        onChangeText={setTexto}
        autoCapitalize="none"
        keyboardType={TECLADO[tipo]}
        error={erros.chave ?? undefined}
        testID="pix-chave"
      />
      {erros.api && <Text className="font-body text-sm text-vupth-danger">{erros.api}</Text>}
      <NwButton title="Salvar chave" onPress={aoSalvar} isLoading={salvando} testID="pix-salvar" />
      {chave && (
        <NwButton title="Cancelar" variant="vupthGhost" onPress={() => setEditando(false)} testID="pix-cancelar" />
      )}
    </View>
  );
}
