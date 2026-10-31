#!/bin/bash
# Prepara a bateria do Maestro (roteiro: .maestro/bateria_completa.yaml).
#
# Uso:  bash .maestro/setup.sh             # pergunta: completa ou so as que nao passaram
#       bash .maestro/setup.sh --completa   # roda todas, sem perguntar
#       bash .maestro/setup.sh --falhas     # so as que nao passaram, sem perguntar
#       bash .maestro/setup.sh --so-preparar  # so prepara (imprime o comando)
#       bash .maestro/setup.sh --publicar-ota  # publica o OTA da dev antes (publicar-ota.sh)
#       bash .maestro/setup.sh --device emulator-5554  # num aparelho escolhido
#                                       (o emulador do PC, comandos.html#emulador)
#
# Um comando so (Andre, 03/10): o setup acha o commit esperado sozinho e roda
# as etapas avulsas, uma a uma, sem parar na primeira falha (relatorio.txt).
# Os logs e prints de cada rodada caem em .maestro/logs/<data> — versionada
# (DEC-29): ao terminar, a bateria commita so a pasta .maestro/logs/ e da push na
# branch da pasta (a dev, DEC-30),
# para a equipe ler o erro de qualquer lugar (PC ou nuvem). Rodada verde
# apaga todos; rodada vermelha fica sozinha (as falhas antigas saem).
#
# Precisa de: celular com "Depuracao USB" ligada, conectado no cabo, com o APK
# de PREVIEW instalado (com.vupth.partner.preview — aponta para o staging).
# O Maestro ja esta em ~/.maestro/bin.

export PATH="$PATH:$HOME/Android/Sdk/platform-tools:$HOME/.maestro/bin"
API="https://vupth-backend-ia.onrender.com"

# Uma bateria por vez (DEC-33): a trava unica (flock -n /tmp/vupth-maestro.lock)
# mora aqui dentro — o setup se reabre sob o flock e segura a trava ate o
# restaurar.sh. So o pgrep do java deixou o Client comecar (11/10 00:41) com o
# Partner ainda no setup, antes do java dele subir.
if [ -z "$VUPTH_TRAVA" ]; then
  VUPTH_TRAVA=1 flock -n -E 75 /tmp/vupth-maestro.lock bash "$0" "$@"
  SAIDA=$?
  [ "$SAIDA" = 75 ] && echo "ERRO: outra bateria segura /tmp/vupth-maestro.lock — espere ela terminar"
  exit "$SAIDA"
fi

echo "=== VUPTH Partner — bateria Maestro (staging) ==="
SO_PREPARAR=0
COMPLETA=""
APARELHO=""
PUBLICAR_OTA=0
while [ $# -gt 0 ]; do
  case "$1" in
    --publicar-ota) PUBLICAR_OTA=1 ;;
    --so-preparar) SO_PREPARAR=1 ;;
    --completa) COMPLETA=1 ;;
    --falhas) COMPLETA=0 ;;
    --device) APARELHO="$2"; shift ;;
  esac
  shift
done
# emulador (Andre, 10/10): com o celular e o emulador no adb, --device escolhe
# um. O ANDROID_SERIAL vale para todo adb deste script; o Maestro recebe o mesmo.
MAESTRO_APARELHO=()
if [ -n "$APARELHO" ]; then
  export ANDROID_SERIAL="$APARELHO"
  MAESTRO_APARELHO=(--device "$APARELHO")
fi

# 0. Uma bateria por vez no aparelho (adb-perde-o-aparelho, 03/10; DEC-17):
#    duas sessoes do Maestro no mesmo celular brigam pelo driver e uma cai com
#    "device not found". Client e Partner usam o mesmo celular — confere antes
#    de mexer em qualquer coisa do aparelho.
OUTRA=$(pgrep -af "^java .*maestro.cli.AppKt test")
if [ -n "$OUTRA" ]; then
  echo "ERRO: ja ha uma bateria do Maestro rodando neste computador — espere ela terminar:"
  echo "$OUTRA" | cut -c1-160
  exit 1
fi

# 1. Celular conectado
DEVICE=$(adb devices | grep -w "device" | grep "^${APARELHO}" | head -1)
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

# 4a. emulador-lento (Andre, 10/10: "o emulador e mais lento, deve haver um
#     preparo para isso"; print emulador-anr-system.png). So no emulador:
#     animacoes em 0, permissoes do app dadas por adb (o pedido de localizacao
#     ficava por baixo do "Process system isn't responding") e o app Google
#     desligado (pesa no Celeron). As esperas dobram la (FATOR, passo 6b).
EMULADOR=0
case "$(adb get-serialno 2>/dev/null | tr -d '\r')" in emulator-*) EMULADOR=1 ;; esac
if [ "$EMULADOR" = "1" ]; then
  for CHAVE in window_animation_scale transition_animation_scale animator_duration_scale; do
    adb shell settings put global "$CHAVE" 0
  done
  for PERM in ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION POST_NOTIFICATIONS CAMERA READ_MEDIA_IMAGES READ_EXTERNAL_STORAGE; do
    adb shell pm grant com.vupth.partner.preview "android.permission.$PERM" >/dev/null 2>&1
  done
  adb shell pm disable-user --user 0 com.google.android.googlequicksearchbox >/dev/null 2>&1
  echo "Emulador: animacoes em 0, permissoes dadas, app Google desligado: OK"
fi

# 4b. A imagem de teste na galeria (foto-pela-bateria, Andre 03/10): as etapas
#     07 e 08 gravam a foto escolhendo-a no seletor. Vai com a data de agora,
#     para ser a mais recente da grade; o media scan a poe na galeria.
# foto-na-frente (log 10/10 15:00, 08.36): um print tirado no celular durante a
# rodada fica na frente da imagem de teste e o seletor o escolhe. Por isso a
# imagem vai de novo antes de cada etapa (rodar), com a data de agora.
foto_na_frente() {
  FOTO=/sdcard/Pictures/vupth_teste_$(date +%H%M%S).png
  adb push "$(dirname "$0")/apoio/foto_teste.png" "$FOTO" >/dev/null
  adb shell touch "$FOTO" >/dev/null 2>&1
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://$FOTO" >/dev/null 2>&1
  adb shell content call --method scan_volume --uri content://media --arg external_primary >/dev/null 2>&1
  # Sem o indice, o seletor mostra primeiro uma foto PESSOAL do aparelho e a bateria
  # a envia ao staging (log 06/10, 07.44). Confere no MediaStore antes de seguir.
  local nome
  nome=$(basename "$FOTO")
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    adb shell content query --uri content://media/external/images/media --projection _display_name 2>/dev/null | grep -q "$nome" && return 0
    sleep 1
  done
  return 1
}
if foto_na_frente; then
  echo "Imagem de teste na galeria: OK ($FOTO)"
else
  echo "⚠️  Imagem de teste NAO entrou na galeria ($FOTO): as etapas 07 e 08 escolheriam outra foto. Parando." >&2
  exit 1
fi

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
# 5b. maestro-publica-o-ota (22/10): com --publicar-ota o script publica o EAS Update
#     da dev (canal preview) e so entao a bateria segue. Se falhar, diz o motivo e
#     para; o Andre publica a mao (comando no topo do publicar-ota.sh).
if [ "$PUBLICAR_OTA" = "1" ]; then
  bash "$(dirname "$0")/publicar-ota.sh" || { echo "ERRO: OTA nao publicado — a bateria parou."; exit 1; }
fi

# 6. O commit esperado: a bateria confere o do app antes de comecar (Andre,
#    03/10). O OTA da dev sai do GitHub (job ota do ci.yml, depois do CI verde) com o commit do push;
#    push so de .maestro, .md ou docs nao publica OTA (paths-ignore). Vale,
#    entao, qualquer commit da origin/dev desde o ultimo que mudou o app.
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
git -C "$RAIZ" fetch -q origin dev 2>/dev/null || echo "AVISO: sem fetch — usando a origin/dev que a pasta ja conhece."
ULTIMO_OTA=$(git -C "$RAIZ" log -1 --format=%h origin/dev -- . \
  ':(exclude,glob)**/*.md' ':(exclude)design' \
  ':(exclude).maestro' ':(exclude).gitignore' ':(exclude)docs' ':(exclude)LICENSE')
COMMIT=$(git -C "$RAIZ" log --format=%h --abbrev=7 "$ULTIMO_OTA^..origin/dev" | paste -sd,)
echo "Commit esperado no app (OTA da dev): $COMMIT"

CMD=(maestro "${MAESTRO_APARELHO[@]}" test -e APP_ID=com.vupth.partner.preview -e "API=$API" -e SENHA=Teste@123 -e "COMMIT=$COMMIT")

if [ "$SO_PREPARAR" = "1" ]; then
  echo "Tudo pronto. Rode:"
  echo ""
  echo "  ${CMD[*]} .maestro/bateria_completa.yaml      # tudo de uma vez (para na 1a falha)"
  echo "  ${CMD[*]} -e TAG=<hhmmss> .maestro/avulsas/05.yaml   # uma etapa sozinha"
  echo ""
  echo "Ao terminar, devolva o preenchimento automatico:  bash .maestro/restaurar.sh"
  exit 0
fi

# 7a. Supervisao (bateria-supervisionada, DEC-15). Sem resposta em 1 min,
#     segue sem supervisao — como antes.
#       0 = sem supervisao: a bateria faz tudo sozinha (o Client e a API).
#       1 = um tipo de usuario: o Andre so acompanha; a bateria diz qual etapa
#           comeca e, na falha, onde esta o print.
#       2 = os dois: onde a bateria faria o papel do cliente pela API, ela
#           mostra o e-mail e a situacao, e o Andre faz no app Client, no
#           segundo celular (senha Teste@123). Espera ate 5 min a acao dele.
SUPERVISAO=0
read -r -t 60 -p "Teste com supervisao? (s/N) " RESP
if [ "$RESP" = "s" ] || [ "$RESP" = "S" ]; then
  SUPERVISAO=1
  read -r -t 60 -p "Um tipo de usuario ou os dois? (1/2) " RESP
  [ "$RESP" = "2" ] && SUPERVISAO=2
fi
echo ""
case "$SUPERVISAO" in
  0) echo "Sem supervisao." ;;
  1) echo "Supervisionada, so o Partner." ;;
  2) echo "Supervisionada, Partner e Client: deixe o Client aberto no segundo celular, na tela de entrada." ;;
esac
CMD+=(-e "SUPERVISAO=$SUPERVISAO")

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
# roda as etapas AVULSAS (.maestro/avulsas), cada uma num maestro test
# proprio, com a mesma TAG. Cada etapa prepara pela API o que as anteriores
# deixariam, entao uma falha nao derruba as seguintes. O relatorio.txt diz,
# etapa a etapa, o que passou e onde parou (NN.MM).
TAG=$(date +%H%M%S)
RELATORIO="$RODADA/relatorio.txt"
echo "Rodada $(basename "$RODADA") · TAG $TAG · commit esperado $COMMIT" > "$RELATORIO"

# Passo NN.MM em que a etapa parou: o PRIMEIRO rotulo que falhou e o mais de
# dentro (o "NN.00 · roda ..." que o chamou falha depois, na linha de baixo).
onde_parou() {
  grep -m1 -E '^ *[0-9]{2}\.[0-9A-Z]{1,2}[0-9a-z]* · .*\.\.\. FAILED$' "$1" \
    | sed -E 's/^ +//; s/\.\.\. FAILED$//'
}

# O print da falha com o nome do passo (print-da-falha, DEC-16), na pasta da
# rodada: FALHA_04.22_espera-45min.png. O Andre manda o print e a equipe acha
# o passo no log. E o print que o Maestro tirou na falha; sem ele, um do
# aparelho agora.
print_da_falha() { # $1 = nome da etapa, $2 = passo (NN.MM · ...)
  local num="${2%% ·*}" texto="${2#* · }" slug destino print
  slug=$(printf '%s' "$texto" | iconv -f utf-8 -t ascii//TRANSLIT 2>/dev/null \
    | tr 'A-Z' 'a-z' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-60)
  destino="$RODADA/FALHA_${num:-$1}${slug:+_$slug}.png"
  print=$(ls -t "$RODADA/$1"/screenshot-❌-*.png 2>/dev/null | head -1)
  if [ -n "$print" ]; then
    cp "$print" "$destino"
  else
    adb -s "$SERIAL" exec-out screencap -p > "$destino" 2>/dev/null
    [ -s "$destino" ] || rm -f "$destino"
  fi
  [ -f "$destino" ] && echo "   print: ${destino#$RAIZ/}"
}

# Com os dois usuarios (SUPERVISAO=2): o que o Andre faz no Client, antes da
# etapa que precisa dele. As contas saem da TAG; a etapa as cria.
papel_do_andre() { # $1 = nome da etapa
  [ "$SUPERVISAO" = "2" ] || return 0
  case "$1" in
    etapa_05)
      echo ""
      echo "👤 ETAPA 05 — o Andre e o 2o cliente da fila. Quando aparecer"
      echo "   \"05.0A · espera o Andre entrar na fila\", no segundo celular:"
      echo "   Client → entrar como client_${TAG}_2@teste.com (senha Teste@123)"
      echo "   → entrar na fila do Prof${TAG}, na Loja M${TAG}. Espero ate 5 min."
      echo "   Depois o profissional te retira da fila: confira o aviso no Client."
      echo "" ;;
  esac
}

# Antes de cada etapa: o celular tem de estar no adb (espera ate 60 s).
celular_ok() {
  timeout 60 adb -s "$SERIAL" wait-for-device 2>/dev/null
}

# Prints para o Andre (print-para-o-andre, 05/10; o mesmo formato do Client):
# a etapa chama apoio/para_o_andre.yaml (NOME, O_QUE). Aqui os prints vao para
# para-o-andre/ e as linhas "PARA-O-ANDRE: NOME — O_QUE" da saida da etapa para
# para-o-andre/para-o-andre.txt. O Maestro grava o print na pasta da etapa ou
# na pasta de onde rodou — procura nas duas.
PARA_O_ANDRE="$RODADA/para-o-andre"
juntar_para_o_andre() { # $1 = nome da etapa
  local achados
  achados=$(find "$RODADA/$1" "$PWD" -maxdepth 2 -name 'para-o-andre_*.png' 2>/dev/null | sort -u)
  grep -q 'PARA-O-ANDRE:' "$RODADA/$1.txt" 2>/dev/null || [ -n "$achados" ] || return 0
  mkdir -p "$PARA_O_ANDRE"
  grep -oP 'PARA-O-ANDRE: \K.*' "$RODADA/$1.txt" >> "$PARA_O_ANDRE/para-o-andre.txt" 2>/dev/null
  [ -n "$achados" ] && echo "$achados" | while IFS= read -r f; do [ -f "$f" ] && mv "$f" "$PARA_O_ANDRE/"; done
  return 0
}

# bateria-pula-aprovados (Andre, 05/10; mesmo formato do Client): a etapa verde
# grava "NN <commit>" em aprovados.txt (no .gitignore); a proxima rodada no
# MESMO commit a pula. O commit e o da origin/dev (o 1o da lista COMMIT): um
# push novo, mesmo so de .maestro, roda tudo de novo. --completa roda tudo e
# recomeca as marcas.
#
# bateria-pergunta (Andre, 10/10: "o teste com partner nao me mostrou a opcao de
# testar so o que falhou"; igual ao bateria.sh do Client, fc8b1293): sem
# --completa/--falhas, pergunta. "So as que nao passaram" pula toda etapa ja
# verde em aprovados.txt, de qualquer commit; sem resposta em 1 min, segue assim.
APROVADOS="$RAIZ/.maestro/aprovados.txt"
MARCA="${COMMIT%%,*}"
if [ -z "$COMPLETA" ]; then
  read -r -t 60 -p "Rodar a bateria completa ou só as que não passaram? (c = completa / F = só as falhas) " RESP
  echo ""
  if [ "$RESP" = "c" ] || [ "$RESP" = "C" ]; then COMPLETA=1; else COMPLETA=0; fi
fi
if [ "$COMPLETA" = "1" ]; then
  rm -f "$APROVADOS"
  echo "Completa: todas as etapas rodam."
else
  echo "Só as que não passaram: as etapas já verdes em aprovados.txt ficam como ⏭."
fi
touch "$APROVADOS"
aprovada() { grep -q "^$1 " "$APROVADOS"; }
aprovar() { grep -vE "^$1 " "$APROVADOS" > "$APROVADOS.tmp"; echo "$1 $MARCA" >> "$APROVADOS.tmp"; mv "$APROVADOS.tmp" "$APROVADOS"; }

rodar() { # $1 = nome no relatorio, $2 = arquivo da etapa
  local saida="$RODADA/$1.txt"
  if ! celular_ok; then
    echo "⚠️  $1 — nao rodou: o celular nao esta no adb (confira o cabo)" | tee -a "$RELATORIO"
    return 2
  fi
  [ "$SUPERVISAO" = "0" ] || echo "▶ $1 comecando"
  papel_do_andre "$1"
  # Cortina aberta por uma etapa que falhou (a 12; log 2026-10-11_155533): fecha
  # antes de cada etapa, pelo adb, para a proxima nao abrir o app por baixo dela.
  adb -s "$SERIAL" shell cmd statusbar collapse >/dev/null 2>&1 || true
  foto_na_frente || echo "⚠️  $1 — a imagem de teste nao entrou de novo na galeria (a foto pode sair errada)"
  # maestro-trava-na-atualizacao (Andre, 28/10): etapa que passa do limite REPROVA
  # (rc 124), em vez de ficar parada sem contar como erro. Quem fecha e o timeout;
  # o pkill tira o Maestro que sobrar, para a proxima etapa nao brigar com ele.
  local limite="${3:-$ETAPA_MAX}"
  timeout -k 30 "$limite" "${CMD[@]}" "${EXTRAS[@]}" -e "TAG=$TAG" --debug-output "$RODADA/$1" --flatten-debug-output \
    --test-output-dir "$RODADA/$1" "$2" 2>&1 | tee "$saida"
  local rc="${PIPESTATUS[0]}"
  if [ "$rc" = "124" ] || [ "$rc" = "137" ]; then
    pkill -f "maestro.cli.AppKt test" 2>/dev/null
    local parado
    parado=$(grep -E '^ *[0-9]{2}\.[0-9A-Z]{1,2}[0-9a-z]* · ' "$saida" | tail -1 | sed -E 's/^ +//; s/\.\.\. .*$//')
    echo "TRAVOU: a etapa passou de ${limite}s e foi encerrada${parado:+ — ultimo passo visto: $parado}" | tee -a "$saida"
  fi
  juntar_para_o_andre "$1"
  if [ "$rc" = "0" ]; then
    echo "✅ $1" >> "$RELATORIO"
    return 0
  fi
  local motivo=""
  grep -q "device '.*' not found" "$saida" && motivo=" — o celular saiu do adb (nao e o app)"
  local passo
  passo=$(onde_parou "$saida")
  if [ "$rc" = "124" ] || [ "$rc" = "137" ]; then
    passo=$(grep -m1 -oP '^TRAVOU: .*ultimo passo visto: \K.*' "$saida")
    motivo=" — TRAVOU: passou de ${limite}s (reprovada pelo limite de tempo)"
  fi
  echo "❌ $1 — parou em ${passo:-?}$motivo" >> "$RELATORIO"
  print_da_falha "$1" "$passo" | tee -a "$RELATORIO"
  return 1
}

# 6b. emulador-lento: no emulador, toda espera (timeout:) dos fluxos vale FATOR
#     vezes (uma variavel so; FATOR=3 bash .maestro/setup.sh ... muda). Os fluxos
#     rodam de uma copia com as esperas ja multiplicadas; o celular usa os
#     originais.
FLUXOS="$RAIZ/.maestro"
if [ "$EMULADOR" = "1" ]; then
  FATOR="${FATOR:-2}"
  FLUXOS=$(mktemp -d)
  cp -r "$RAIZ/.maestro/apoio" "$RAIZ/.maestro/avulsas" "$RAIZ/.maestro/etapas" "$RAIZ/.maestro/conjunta" "$RAIZ/.maestro/scripts" "$FLUXOS/"
  find "$FLUXOS" -name '*.yaml' -exec perl -pi -e "s/(\btimeout:\s*)(\d+)/\$1.(\$2*$FATOR)/e" {} +
  echo "Emulador: esperas x$FATOR ($FLUXOS)"
fi

# Limites de tempo (maestro-trava-na-atualizacao): a 00 (atualizacao) e cada etapa.
# No emulador valem FATOR vezes, como as esperas dos fluxos. Mude por variavel:
# ETAPA_MAX=3600 ATUALIZACAO_MAX=900 bash .maestro/setup.sh ...
MULT=1; [ "$EMULADOR" = "1" ] && MULT="${FATOR:-2}"
ATUALIZACAO_MAX="${ATUALIZACAO_MAX:-$((600 * MULT))}"
ETAPA_MAX="${ETAPA_MAX:-$((2400 * MULT))}"

# maestro-atualizacao-por-commit (Andre, 28/10): o commit ja verificado fica em
# .maestro/.commit_verificado (no .gitignore), junto do aparelho e da hora da
# instalacao do APK (reinstalar o app zera a memoria). Igual ao de agora: a 00 nao
# toca em "Verificar atualizacao" (so confere o commit do rodape). Diferente: atualiza
# e, passando a 00, grava o novo. --completa nao muda isso: o OTA so muda com um push.
MEMORIA="$RAIZ/.maestro/.commit_verificado"
INSTALACAO=$(adb -s "$SERIAL" shell dumpsys package com.vupth.partner.preview 2>/dev/null | grep -m1 lastUpdateTime | tr -d ' \r')
CHAVE_DO_COMMIT="$SERIAL|$INSTALACAO|$MARCA"
EXTRAS=()
if [ -n "$INSTALACAO" ] && [ "$(cat "$MEMORIA" 2>/dev/null)" = "$CHAVE_DO_COMMIT" ]; then
  echo "Commit $MARCA ja verificado neste aparelho: a 00 nao verifica atualizacao de novo."
  EXTRAS=(-e PULAR_ATUALIZACAO=1)
fi

RESULTADO=0
if ! rodar 00_atualizacao "$FLUXOS/avulsas/00_atualizacao.yaml" "$ATUALIZACAO_MAX"; then
  RESULTADO=1
  echo "   (as etapas nao rodaram: com a versao errada o teste nao serve)" >> "$RELATORIO"
  rm -f "$MEMORIA"
else
  [ -n "$INSTALACAO" ] && echo "$CHAVE_DO_COMMIT" > "$MEMORIA"
  EXTRAS=()
  # etapas-curtas (Andre, 11/10): a etapa longa vira partes (07a, 07b...), cada
  # uma com a sua aprovacao; a F repete so a parte que falhou.
  for ARQ in $(ls "$FLUXOS"/avulsas/ | grep -E '^[0-9]{2}[a-z]?\.yaml$' | sort | sed "s#^#$FLUXOS/avulsas/#"); do
    NN=$(basename "$ARQ" .yaml)
    if aprovada "$NN"; then
      echo "⏭  etapa_$NN (já passou no $(grep "^$NN " "$APROVADOS" | cut -d' ' -f2) — a completa roda de novo)" >> "$RELATORIO"
      continue
    fi
    if rodar "etapa_$NN" "$ARQ"; then aprovar "$NN"; else RESULTADO=1; fi
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
if [ -d "$PARA_O_ANDRE" ]; then
  echo ""
  echo "👀 Para o Andre olhar: .maestro/logs/$(basename "$RODADA")/para-o-andre/ (o que olhar em para-o-andre.txt)"
  cat "$PARA_O_ANDRE/para-o-andre.txt" 2>/dev/null
fi
if [ "$RESULTADO" = "0" ]; then
  # Verde apaga os logs, menos os prints que esperam o olho do Andre.
  find "$LOGS" -mindepth 1 -maxdepth 1 -type d ! -name "$(basename "$RODADA")" -exec rm -rf {} +
  find "$RODADA" -mindepth 1 -maxdepth 1 ! -name para-o-andre -exec rm -rf {} +
  if [ -d "$PARA_O_ANDRE" ]; then
    echo "Bateria VERDE — logs apagados; ficam os prints para o Andre."
  else
    rm -rf "$LOGS"
    echo "Bateria VERDE — logs apagados."
  fi
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
# 9. Logs no GitHub (DEC-28/29; DEC-30: a cloud saiu, sobe na branch da pasta).
#    Commit so de .maestro/logs/ (o pathspec deixa de fora o que mais estiver
#    mudado). O push so sai se o que sobe for so os logs — codigo sem push
#    espera o push do Andre. Sem --no-verify: o pre-push roda como sempre.
BRANCH=$(git -C "$RAIZ" branch --show-current)
git -C "$RAIZ" add -A .maestro/logs/
if [ -n "$BRANCH" ] && ! git -C "$RAIZ" diff --cached --quiet -- .maestro/logs/; then
  git -C "$RAIZ" commit -q -m "chore(logs): bateria Maestro $(basename "$RODADA") — $([ "$RESULTADO" = "0" ] && echo verde || echo FALHA)" -- .maestro/logs/
  git -C "$RAIZ" pull -q --rebase --autostash origin "$BRANCH" 2>/dev/null
  if git -C "$RAIZ" diff --name-only "origin/$BRANCH"..HEAD | grep -qv '^.maestro/logs/'; then
    echo "📝 Logs commitados; sobem no proximo push (ha codigo sem push na $BRANCH)."
  elif git -C "$RAIZ" push -q origin "HEAD:$BRANCH"; then
    echo "📤 Logs no GitHub (origin/$BRANCH)."
  else
    echo "⚠️  Push dos logs falhou — sobem no proximo push."
  fi
fi
exit "$RESULTADO"
