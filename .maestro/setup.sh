#!/bin/bash
# Prepara a bateria do Maestro (roteiro: .maestro/bateria_completa.yaml).
#
# Uso:  bash .maestro/setup.sh
#
# Precisa de: celular com "Depuracao USB" ligada, conectado no cabo, com o APK
# de PREVIEW instalado (com.vupth.partner.preview — aponta para o staging).
# O Maestro ja esta em ~/.maestro/bin.

export PATH="$PATH:$HOME/Android/Sdk/platform-tools:$HOME/.maestro/bin"
API="https://vupth-backend-ia.onrender.com"

echo "=== VUPTH Partner — bateria Maestro (staging) ==="

# 1. Celular conectado
DEVICE=$(adb devices | grep -w "device" | head -1)
if [ -z "$DEVICE" ]; then
  echo "ERRO: nenhum celular. Ligue a Depuracao USB, conecte o cabo e aceite o aviso no celular."
  exit 1
fi
echo "Celular: $DEVICE"

# 2. APK de preview instalado
if ! adb shell pm list packages | grep -q "com.vupth.partner.preview"; then
  echo "ERRO: o APK de preview (com.vupth.partner.preview) nao esta instalado."
  exit 1
fi
echo "APK de preview: OK"

# 3. Teclado sem corretor (o Maestro digita pelo teclado do aparelho)
adb shell settings put secure spell_checker_enabled 0
adb shell settings put secure show_ime_with_hard_keyboard 1
echo "Corretor desligado: OK"

# 4. Acordar o staging (Render dorme; o primeiro pedido leva ~50 s)
echo -n "Acordando o staging"
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$API/actuator/health/readiness")
  if [ "$CODE" = "200" ]; then echo " — pronto"; break; fi
  echo -n "."
  sleep 3
done
if [ "$CODE" != "200" ]; then
  echo ""
  echo "ERRO: o staging nao respondeu (ultimo codigo: $CODE)."
  exit 1
fi

echo ""
echo "Tudo pronto. Rode:"
echo "  maestro test -e APP_ID=com.vupth.partner.preview -e API=$API -e SENHA=Teste@123 .maestro/bateria_completa.yaml"
