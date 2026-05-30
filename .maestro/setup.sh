#!/bin/bash
# Setup para testes E2E com Maestro
# Uso: bash .maestro/setup.sh

export PATH="$PATH:$HOME/Android/Sdk/platform-tools"

echo "=== VUPTH Partner — Maestro E2E Setup ==="

# 1. Verificar celular conectado
DEVICE=$(adb devices | grep -v "List" | grep "device" | head -1)
if [ -z "$DEVICE" ]; then
  echo "ERRO: Nenhum dispositivo conectado. Plugue o cabo USB e habilite depuração USB."
  exit 1
fi
echo "Dispositivo: $DEVICE"

# 2. Redirecionar porta do backend
adb reverse tcp:8080 tcp:8080
echo "adb reverse tcp:8080 tcp:8080 — OK"

# 3. Desabilitar autocorrect/spell checker do Android (Maestro inputText usa o IME)
adb shell settings put secure spell_checker_enabled 0
adb shell settings put secure show_ime_with_hard_keyboard 1
echo "Spell checker desabilitado — OK"

# 4. Verificar backend
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null || echo "000")
if [ "$BACKEND" != "200" ]; then
  echo "AVISO: Backend não respondeu em localhost:8080 (code=$BACKEND). Certifique-se que está rodando."
else
  echo "Backend respondendo — OK"
fi

# 5. Verificar Maestro
if ! command -v maestro &> /dev/null; then
  echo "ERRO: Maestro não encontrado. Instale: curl -Ls 'https://get.maestro.mobile.dev' | bash"
  exit 1
fi
echo "Maestro $(maestro --version) — OK"

echo ""
echo "=== Setup completo! ==="
echo "Certifique-se que o Expo Go está aberto no celular com o app partner carregado."
echo ""
echo "Para rodar todos os testes:"
echo "  maestro test .maestro/flows/"
echo ""
echo "Para rodar um teste específico:"
echo "  maestro test .maestro/flows/01_register_owner.yaml"
