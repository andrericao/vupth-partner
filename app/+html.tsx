import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Documento HTML da versao WEB (Expo Router). E o unico lugar onde dá para
// escrever o <head> — o `app.json` só alcança o `lang`.
//
// 🔴 POR QUE ELE EXISTE (Andre, 18–19/09): o navegador estava TRADUZINDO a
// página, que já é em português. O `lang: "pt-BR"` tirou o motivo do convite,
// mas o Chrome guarda "traduzir sempre este site" POR DOMÍNIO: quem aceitou uma
// vez continua com a página traduzida, e os prints de 18/09 mostraram
// "Politica de preco (preview)" virando "Política de pré-visualização" DEPOIS
// da correção.
//
// E o estrago não é só texto: a tradução reescreve o DOM por baixo do React e
// quebra o campo controlado. No cadastro de serviço, R$ 60,00 chegava ao
// cálculo como R$ 0,06 e R$ 1.000,00 como R$ 0,01 — só o primeiro dígito
// sobrevivia. O preço e a máscara estão certos (`unmaskMoney("R$ 60,00")` = 60);
// o campo é que parava de receber as teclas seguintes.
//
// `notranslate` é o pedido explícito de não traduzir, nas três formas que os
// navegadores leem: a meta do Google, o atributo `translate` e a classe no
// <body>. ⚠️ Quem JÁ marcou "traduzir sempre" no aparelho precisa desmarcar uma
// vez nas configurações do site — a preferência é do navegador, e nenhuma
// página a apaga sozinha.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR" translate="no">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="google" content="notranslate" />

        {/* Sem isto o body nao rola na web (padrao do Expo Router). */}
        <ScrollViewStyleReset />
      </head>
      <body className="notranslate">{children}</body>
    </html>
  );
}
