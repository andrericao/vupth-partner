#!/bin/bash
# Prepara a bateria do Maestro (roteiro: .maestro/bateria_completa.yaml).
#
# Uso:  bash .maestro/setup.sh             # prepara e roda a bateria
#       bash .maestro/setup.sh --so-preparar  # so prepara (imprime o comando)
#
# Um comando so (Andre, 03/10): o setup acha o commit esperado sozinho e roda
# o maestro. Os logs e prints de cada rodada caem em .maestro/logs/<data>
# (no .gitignore), para a equipe ler o erro sem o Andre colar. Rodada verde
# apaga todos; rodada vermelha fica sozinha (as falhas antigas saem).
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

# 4. Sem o preenchimento automatico do Google. Andre, 25/09: o Google ofereceu
#    o login de uma conta ja salva por cima do campo e a bateria se perdeu. O
#    servico de autofill do aparelho e desligado durante o teste; o valor de
#    antes fica guardado e o restaurar.sh o devolve.
ANTES=$(adb shell settings get secure autofill_service | tr -d '\r')
if [ "$ANTES" != "null" ] && [ -n "$ANTES" ]; then
  echo "$ANTES" > "$(dirname "$0")/.autofill_antes"
fi
adb shell settings put secure autofill_service null
echo "Preenchimento automatico desligado: OK (ao terminar: bash .maestro/restaurar.sh)"

# 5. Acordar o staging (Render dorme; o primeiro pedido leva ~50 s)
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
# 6. O commit esperado: a bateria confere o do app antes de comecar (Andre,
#    03/10). O OTA da dev sai do GitHub (eas-update.yml) com o commit do push;
#    push so de .maestro, .md ou docs nao publica OTA (paths-ignore). Vale,
#    entao, qualquer commit da origin/dev desde o ultimo que mudou o app.
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
git -C "$RAIZ" fetch -q origin dev 2>/dev/null || echo "AVISO: sem fetch — usando a origin/dev que a pasta ja conhece."
ULTIMO_OTA=$(git -C "$RAIZ" log -1 --format=%h origin/dev -- . \
  ':(exclude,glob)**/*.md' ':(exclude)src/docs' ':(exclude)design' \
  ':(exclude).maestro' ':(exclude).gitignore' ':(exclude)docs' ':(exclude)LICENSE')
COMMIT=$(git -C "$RAIZ" log --format=%h --abbrev=7 "$ULTIMO_OTA^..origin/dev" | paste -sd,)
echo "Commit esperado no app (OTA da dev): $COMMIT"

CMD=(maestro test -e APP_ID=com.vupth.partner.preview -e "API=$API" -e SENHA=Teste@123 -e "COMMIT=$COMMIT")

if [ "$1" = "--so-preparar" ]; then
  echo "Tudo pronto. Rode:"
  echo ""
  echo "  ${CMD[*]} .maestro/bateria_completa.yaml"
  echo ""
  echo "Ao terminar, devolva o preenchimento automatico:  bash .maestro/restaurar.sh"
  exit 0
fi

# 7. Roda a bateria, com os logs na pasta do projeto (logs-da-bateria-na-pasta)
LOGS="$RAIZ/.maestro/logs"
RODADA="$LOGS/$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$RODADA"
adb logcat -b crash -c 2>/dev/null
echo "Rodando a bateria — logs em .maestro/logs/$(basename "$RODADA")"
echo ""
"${CMD[@]}" --debug-output "$RODADA" --flatten-debug-output --test-output-dir "$RODADA" \
  "$RAIZ/.maestro/bateria_completa.yaml" 2>&1 | tee "$RODADA/saida.txt"
RESULTADO=${PIPESTATUS[0]}

# O travamento do Android (crash buffer), que o Maestro sozinho nao captura
# (orquestrador, 03/10). So fica o arquivo se houve crash na rodada.
adb logcat -d -b crash > "$RODADA/crash.txt" 2>/dev/null
[ -s "$RODADA/crash.txt" ] || rm -f "$RODADA/crash.txt"

bash "$RAIZ/.maestro/restaurar.sh"

# 8. Erro sanado, log apagado: verde limpa tudo; vermelho fica so a rodada atual
if [ "$RESULTADO" = "0" ]; then
  rm -rf "$LOGS"
  echo "Bateria VERDE — logs apagados."
else
  find "$LOGS" -mindepth 1 -maxdepth 1 -type d ! -name "$(basename "$RODADA")" -exec rm -rf {} +
  echo "Bateria VERMELHA — logs em .maestro/logs/$(basename "$RODADA") (saida.txt, prints e crash.txt se o app travou)."
fi
exit "$RESULTADO"
