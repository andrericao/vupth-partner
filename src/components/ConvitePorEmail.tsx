import { useState } from "react";
import { View, Text } from "react-native";
import { NwInput } from "@components/nw/Input";
import { NwButton } from "@components/nw/Button";
import type { EmailInvitation } from "@store/establishment.store";

type Props = {
  pendentes: EmailInvitation[];
  onConvidar: (email: string) => void;
  onCancelar: (convite: EmailInvitation) => void;
  enviando?: boolean;
  cancelandoId?: string | null;
};

/** Conferencia leve antes do POST — quem decide e o backend (422 VALIDATION_ERROR). */
export function emailParece(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// convite-sem-conta (S30, contrato BAK 0774ad2): o profissional que ainda nao
// tem conta nao aparece na busca — o dono convida pelo e-mail. Quando a pessoa
// cria o perfil profissional com esse e-mail, vira o convite comum (PENDING).
export function ConvitePorEmail({ pendentes, onConvidar, onCancelar, enviando = false, cancelandoId = null }: Props) {
  const [email, setEmail] = useState("");
  const valido = emailParece(email);

  const enviar = () => {
    if (!valido || enviando) return;
    onConvidar(email.trim());
    setEmail("");
  };

  return (
    <View className="mt-6 p-4 rounded-card bg-vupth-surface">
      <Text className="font-heading text-sm text-vupth-textPrimary">Não achou? Convide por e-mail</Text>
      <Text className="font-body text-xs text-vupth-textSecondary mt-0.5 mb-3">
        A pessoa recebe um e-mail. Quando criar a conta de profissional, o convite aparece para ela aceitar.
      </Text>
      <NwInput
        testID="convite-email"
        label="E-mail do profissional"
        placeholder="nome@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <NwButton
        testID="convite-email-enviar"
        title="Convidar por e-mail"
        onPress={enviar}
        disabled={!valido || enviando}
        isLoading={enviando}
      />

      {pendentes.length > 0 && (
        <View className="mt-4 gap-2">
          <Text className="font-heading text-xs text-vupth-textSecondary">Esperando criar a conta</Text>
          {pendentes.map((c) => (
            <View key={c.id} className="flex-row items-center justify-between">
              <Text className="font-body text-sm text-vupth-textPrimary flex-1" numberOfLines={1}>
                {c.email}
              </Text>
              <NwButton
                testID={`convite-email-cancelar-${c.id}`}
                title="Cancelar"
                variant="vupthGhost"
                onPress={() => onCancelar(c)}
                isLoading={cancelandoId === c.id}
                className="mt-0"
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
