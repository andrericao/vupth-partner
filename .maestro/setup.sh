#!/bin/bash
# Prepara a bateria do Maestro (roteiro: .maestro/bateria_completa.yaml).
#
# Uso:  bash .maestro/setup.sh             # prepara e roda a bateria
#       bash .maestro/setup.sh --so-preparar  # so prepara (imprime o comando)
#
# Um comando so (Andre, 03/10): o setup acha o commit esperado sozinho e roda
# as etapas avulsas, uma a uma, sem parar na primeira falha (relatorio.txt).
# Os logs e prints de cada rodada caem em .maestro/logs/<data>
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
  echo "  ${CMD[*]} .maestro/bateria_completa.yaml      # tudo de uma vez (para na 1a falha)"
  echo "  ${CMD[*]} -e TAG=<hhmmss> .maestro/avulsas/05.yaml   # uma etapa sozinha"
  echo ""
  echo "Ao terminar, devolva o preenchimento automatico:  bash .maestro/restaurar.sh"
  exit 0
fi

# 7a. Uma bateria por vez no aparelho (adb-perde-o-aparelho, 03/10): duas
#     sessoes do Maestro no mesmo celular brigam pelo driver e uma cai com
#     "device not found". Client e Partner usam o mesmo celular.
OUTRA=$(pgrep -af "^java .*maestro.cli.AppKt test")
if [ -n "$OUTRA" ]; then
  echo "ERRO: ja ha uma bateria do Maestro rodando neste computador — espere ela terminar:"
  echo "$OUTRA" | cut -c1-160
  bash "$RAIZ/.maestro/restaurar.sh"
  exit 1
fi

# 7. Roda a bateria, com os logs na pasta do projeto (logs-da-bateria-na-pasta)
LOGS="$RAIZ/.maestro/logs"
RODADA="$LOGS/$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$RODADA"
adb logcat -b crash -c 2>/dev/null
echo "Rodando a bateria — logs em .maestro/logs/$(basename "$RODADA")"
echo ""
# Vigia do adb: a cada 2 s confere o aparelho; se sumir, anota a hora e quem
# estava usando o adb/Maestro naquele instante (adb.txt) — para achar a causa.
SERIAL=$(adb get-serialno 2>/dev/null | tr -d '\r')
(
  while sleep 2; do
    if [ "$(adb -s "$SERIAL" get-state 2>/dev/null | tr -d '\r')" != "device" ]; then
      {
        echo "=== $(date +%H:%M:%S) o aparelho $SERIAL saiu do adb ==="
        adb devices -l
        ps -eo pid,lstart,cmd | grep -E "adb|maestro|scrcpy|studio|gradle" | grep -v grep | cut -c1-200
      } >> "$RODADA/adb.txt" 2>&1
    fi
  done
) &
VIGIA=$!

# A bateria que nao para (bateria-nao-para, Andre 03/10): confere a versao e
# roda as oito etapas AVULSAS (.maestro/avulsas), cada uma num maestro test
# proprio, com a mesma TAG. Cada etapa prepara pela API o que as anteriores
# deixariam, entao uma falha nao derruba as seguintes. O relatorio.txt diz,
# etapa a etapa, o que passou e onde parou (NN.MM).
TAG=$(date +%H%M%S)
RELATORIO="$RODADA/relatorio.txt"
echo "Rodada $(basename "$RODADA") · TAG $TAG · commit esperado $COMMIT" > "$RELATORIO"

# Passo NN.MM em que a etapa parou: o ultimo rotulo que o maestro comecou.
onde_parou() {
  grep -oE '[0-9]{2}\.[0-9A-Z][0-9] · [^.]*' "$1" | tail -1
}

# Antes de cada etapa: o celular tem de estar no adb (espera ate 60 s).
celular_ok() {
  timeout 60 adb -s "$SERIAL" wait-for-device 2>/dev/null
}

rodar() { # $1 = nome no relatorio, $2 = arquivo da etapa
  local saida="$RODADA/$1.txt"
  if ! celular_ok; then
    echo "⚠️  $1 — nao rodou: o celular nao esta no adb (confira o cabo)" | tee -a "$RELATORIO"
    return 2
  fi
  "${CMD[@]}" -e "TAG=$TAG" --debug-output "$RODADA/$1" --flatten-debug-output \
    --test-output-dir "$RODADA/$1" "$2" 2>&1 | tee "$saida"
  if [ "${PIPESTATUS[0]}" = "0" ]; then
    echo "✅ $1" >> "$RELATORIO"
    return 0
  fi
  local motivo=""
  grep -q "device '.*' not found" "$saida" && motivo=" — o celular saiu do adb (nao e o app)"
  echo "❌ $1 — parou em $(onde_parou "$saida")$motivo" >> "$RELATORIO"
  return 1
}

RESULTADO=0
if ! rodar 00_versao "$RAIZ/.maestro/avulsas/00_confere_versao.yaml"; then
  RESULTADO=1
  echo "   (as etapas nao rodaram: com a versao errada o teste nao serve)" >> "$RELATORIO"
else
  for ARQ in "$RAIZ"/.maestro/avulsas/0[1-8].yaml; do
    rodar "etapa_$(basename "$ARQ" .yaml)" "$ARQ" || RESULTADO=1
  done
fi
kill "$VIGIA" 2>/dev/null
echo ""
echo "════ Relatorio etapa a etapa ════"
cat "$RELATORIO"

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
  if grep -q "device '.*' not found" "$RODADA"/*.txt; then
    echo ""
    echo "O CELULAR SAIU DO ADB no meio da rodada — nao e defeito do app."
    echo "Confira o cabo e o aviso de depuracao USB no celular. O que o vigia viu:"
    head -20 "$RODADA/adb.txt" 2>/dev/null || echo "(o vigia nao pegou a queda)"
  fi
  echo "Bateria VERMELHA — logs em .maestro/logs/$(basename "$RODADA") (relatorio.txt, a saida de cada etapa, prints e crash.txt se o app travou)."
fi
exit "$RESULTADO"
