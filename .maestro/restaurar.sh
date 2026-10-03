#!/bin/bash
# Devolve ao celular o que o setup.sh desligou para a bateria do Maestro:
# o preenchimento automatico (Google) e o corretor do teclado.
export PATH="$PATH:$HOME/Android/Sdk/platform-tools"
ARQ="$(dirname "$0")/.autofill_antes"
if [ -f "$ARQ" ]; then
  adb shell settings put secure autofill_service "$(cat "$ARQ")"
  rm -f "$ARQ"
  echo "Preenchimento automatico restaurado."
else
  echo "Nada guardado do preenchimento automatico — ligue em Configuracoes > Senhas, se quiser."
fi
adb shell settings put secure spell_checker_enabled 1
echo "Corretor religado."
# A imagem de teste que o setup.sh pos na galeria (foto-pela-bateria)
adb shell 'rm -f /sdcard/Pictures/vupth_teste_*.png' 2>/dev/null
adb shell content call --method scan_volume --uri content://media --arg external_primary >/dev/null 2>&1
echo "Imagem de teste removida da galeria."
