#!/bin/bash
# O APK mais novo do PARCEIRO no endereco fixo (baixar-do-parceiro, Andre 11/10;
# o mesmo script do Client, com o nome do arquivo do parceiro).
#
#   bash tools/apk-para-o-r2.sh
#
# Pega o ultimo build `prod-apk` terminado no EAS, baixa e sobe no bucket R2
# de PRODUCAO do Backend (o das fotos), em `apk/vupth-parceiro.apk` (nome fixo). O site
# redireciona `/baixar` para ele
# (public/_redirects), entao o link que circula nunca muda. Rodar depois de
# cada `eas build --profile prod-apk` do Partner. Depois do primeiro envio, ligar
# APK_NO_AR em src/lib/baixarApp.ts (a faixa "Baixar o app" aparece no site).
#
# Precisa: login no EAS (`eas whoami`), jq, curl 7.75+ (assina o S3 sozinho) e
# as mesmas chaves S3 do Backend, as de PRODUCAO, no ambiente:
#   R2_ACCOUNT_ID  R2_ACCESS_KEY_ID  R2_SECRET_ACCESS_KEY  R2_BUCKET
set -euo pipefail

: "${R2_ACCOUNT_ID:?defina R2_ACCOUNT_ID}"
: "${R2_ACCESS_KEY_ID:?defina R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?defina R2_SECRET_ACCESS_KEY}"
: "${R2_BUCKET:?defina R2_BUCKET (o de producao)}"

BUILD=$(npx --yes eas-cli build:list --platform android --build-profile prod-apk \
  --status finished --limit 1 --json --non-interactive)
URL=$(echo "$BUILD" | jq -r '.[0].artifacts.buildUrl // empty')
VERSAO=$(echo "$BUILD" | jq -r '.[0].appVersion // "?"')
if [ -z "$URL" ]; then
  echo "ERRO: nenhum build prod-apk terminado no EAS."
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "Baixando o APK $VERSAO: $URL"
curl -fL --retry 3 -o "$TMP/vupth-parceiro.apk" "$URL"

echo "Subindo para r2://$R2_BUCKET/apk/vupth-parceiro.apk"
curl -fsS --aws-sigv4 "aws:amz:auto:s3" \
  --user "$R2_ACCESS_KEY_ID:$R2_SECRET_ACCESS_KEY" \
  -H "Content-Type: application/vnd.android.package-archive" \
  -H "Cache-Control: no-cache" \
  -T "$TMP/vupth-parceiro.apk" \
  "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/$R2_BUCKET/apk/vupth-parceiro.apk"

echo "Pronto: /baixar entrega o $VERSAO."
