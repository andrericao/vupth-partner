import { useState } from "react";
import { View, Text, Pressable } from "react-native";

import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";
import { sufixoDoToken } from "@lib/diagnosticoVeredito";
import { copiarComAviso } from "@lib/copiar";

// Cartao "Push" do painel dos 7 toques — ESPELHO do PushDiagnostics do client
// (16/09), com as mesmas frases, para os dois apps serem comparados lado a lado
// no A6 ("nenhuma notificacao, nos DOIS apps").
//
// A ordem das linhas e a ordem em que as coisas falham: a primeira que nao
// estiver OK e onde parou.

// Os estados do partner (src/lib/push.ts) traduzidos para as frases do client.
const EXPLICACAO: Record<string, string> = {
  obtido: "token obtido",
  registrado: "token obtido",
  "sem-aparelho": "emulador ou web — push remoto não existe aqui",
  "sem-permissao": "permissão NEGADA no aparelho",
  falhou: "a chamada nativa falhou (ver detalhe)",
};

function Linha({ rotulo, valor, ok }: { rotulo: string; valor: string; ok: boolean | null }) {
  const cor = ok === null ? "text-vupth-textSecondary" : ok ? "text-vupth-forest" : "text-vupth-danger";
  return (
    <View className="flex-row justify-between items-center gap-2">
      <Text className="font-body text-sm text-vupth-textSecondary">{rotulo}</Text>
      <Text className={`font-mono text-sm shrink text-right ${cor}`}>{valor}</Text>
    </View>
  );
}

export function PushDiagnostics() {
  const push = useWsDiagnosticsStore((s) => s.push);
  const token = useWsDiagnosticsStore((s) => s.pushToken);
  const envio = useWsDiagnosticsStore((s) => s.pushEnvio);
  const erroEnvio = useWsDiagnosticsStore((s) => s.pushErroEnvio);
  const [mostrarToken, setMostrarToken] = useState(false);

  const sufixo = sufixoDoToken(token);
  const ok = push?.estado === "obtido" || push?.estado === "registrado";

  return (
    <View className="bg-vupth-surface rounded-lg p-3 mt-3 gap-2" testID="push-diagnostics">
      <Text className="font-heading text-sm text-vupth-forest">Push</Text>

      {push === null ? (
        // Sem tentativa nenhuma o cartao vazio pareceria "tudo certo".
        <Text className="font-body text-sm text-vupth-textSecondary">
          Ainda não tentou registrar — o registro acontece depois do login.
        </Text>
      ) : (
        <>
          <Linha rotulo="token" valor={EXPLICACAO[push.estado] ?? push.estado} ok={ok} />
          {sufixo && (
            <Pressable onPress={() => setMostrarToken((v) => !v)}>
              <Linha
                rotulo="fim do token"
                valor={mostrarToken ? "toque p/ esconder" : `…${sufixo} · toque p/ ver`}
                ok
              />
            </Pressable>
          )}
          {mostrarToken && token && (
            // Token INTEIRO, selecionavel e com o botao de copiar (build 1.4.0,
            // expo-clipboard).
            <View className="bg-white rounded p-2 gap-2">
              <Text selectable className="font-mono text-xs text-vupth-forest">
                {token}
              </Text>
              <Pressable
                onPress={() => copiarComAviso(token, "Token")}
                accessibilityRole="button"
                className="self-start active:opacity-70"
              >
                <Text className="font-body text-xs font-semibold text-vupth-forest">Copiar token</Text>
              </Pressable>
            </View>
          )}
          {push.detalhe && <Linha rotulo="detalhe" valor={push.detalhe} ok={false} />}
          <Linha
            rotulo="backend sabe?"
            valor={
              envio === "ok"
                ? "sim (POST /devices)"
                : envio === "falhou"
                  ? "NÃO — envio falhou"
                  : "não tentado"
            }
            ok={envio === "ok" ? true : envio === "falhou" ? false : null}
          />
          {erroEnvio && <Linha rotulo="erro do envio" valor={erroEnvio} ok={false} />}
        </>
      )}

      <Text className="font-body text-xs text-vupth-textSecondary">
        Tudo OK aqui e ainda assim nada chega = o problema está no envio (backend) ou na
        credencial de push do projeto, que este aparelho não consegue ver.
      </Text>
    </View>
  );
}
