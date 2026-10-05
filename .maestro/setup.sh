#!/bin/bash
# Prepara a bateria do Maestro (roteiro: .maestro/bateria_completa.yaml).
#
# Uso:  bash .maestro/setup.sh             # pula as etapas ja aprovadas neste commit
#       bash .maestro/setup.sh --completa   # roda todas
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
SO_PREPARAR=0
COMPLETA=0
for ARG in "$@"; do
  case "$ARG" in
    --so-preparar) SO_PREPARAR=1 ;;
    --completa) COMPLETA=1 ;;
  esac
done

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

# 4b. A imagem de teste na galeria (foto-pela-bateria, Andre 03/10): as etapas
#     07 e 08 gravam a foto escolhendo-a no seletor. Vai com a data de agora,
#     para ser a mais recente da grade; o media scan a poe na galeria.
FOTO=/sdcard/Pictures/vupth_teste_$(date +%H%M%S).png
adb push "$(dirname "$0")/apoio/foto_teste.png" "$FOTO" >/dev/null
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://$FOTO" >/dev/null 2>&1
adb shell content call --method scan_volume --uri content://media --arg external_primary >/dev/null 2>&1
echo "Imagem de teste na galeria: OK ($FOTO)"

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
APROVADOS="$RAIZ/.maestro/aprovados.txt"
MARCA="${COMMIT%%,*}"
if [ "$COMPLETA" = "1" ]; then
  rm -f "$APROVADOS"
  echo "Completa: todas as etapas rodam."
fi
touch "$APROVADOS"
aprovada() { grep -qxF "$1 $MARCA" "$APROVADOS"; }
aprovar() { grep -vE "^$1 " "$APROVADOS" > "$APROVADOS.tmp"; echo "$1 $MARCA" >> "$APROVADOS.tmp"; mv "$APROVADOS.tmp" "$APROVADOS"; }

rodar() { # $1 = nome no relatorio, $2 = arquivo da etapa
  local saida="$RODADA/$1.txt"
  if ! celular_ok; then
    echo "⚠️  $1 — nao rodou: o celular nao esta no adb (confira o cabo)" | tee -a "$RELATORIO"
    return 2
  fi
  [ "$SUPERVISAO" = "0" ] || echo "▶ $1 comecando"
  papel_do_andre "$1"
  "${CMD[@]}" -e "TAG=$TAG" --debug-output "$RODADA/$1" --flatten-debug-output \
    --test-output-dir "$RODADA/$1" "$2" 2>&1 | tee "$saida"
  local rc="${PIPESTATUS[0]}"
  juntar_para_o_andre "$1"
  if [ "$rc" = "0" ]; then
    echo "✅ $1" >> "$RELATORIO"
    return 0
  fi
  local motivo=""
  grep -q "device '.*' not found" "$saida" && motivo=" — o celular saiu do adb (nao e o app)"
  local passo
  passo=$(onde_parou "$saida")
  echo "❌ $1 — parou em ${passo:-?}$motivo" >> "$RELATORIO"
  print_da_falha "$1" "$passo" | tee -a "$RELATORIO"
  return 1
}

RESULTADO=0
if ! rodar 00_atualizacao "$RAIZ/.maestro/avulsas/00_atualizacao.yaml"; then
  RESULTADO=1
  echo "   (as etapas nao rodaram: com a versao errada o teste nao serve)" >> "$RELATORIO"
else
  for ARQ in "$RAIZ"/.maestro/avulsas/[0-9][0-9].yaml; do
    NN=$(basename "$ARQ" .yaml)
    if aprovada "$NN"; then
      echo "⏭  etapa_$NN (aprovada no $MARCA — --completa roda de novo)" >> "$RELATORIO"
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
exit "$RESULTADO"
