# Montar um PC do zero — vupth-partner

DEC-28 (pc-descartavel): nenhum PC é necessário. Tudo o que a bateria e os testes
usam está no GitHub; se o computador sumir, basta seguir este roteiro.

## 1. Repositórios lado a lado

```bash
mkdir -p ~/Documentos/programacao && cd ~/Documentos/programacao
git clone https://github.com/andrericao/vupth-partner.git
git clone https://github.com/andrericao/vupth-docs.git   # regras e hooks (obrigatório ao lado)
git clone https://github.com/andrericao/vupth.git        # Client (bateria conjunta)
cd vupth-partner && git checkout cloud
```

## 2. Ferramentas

| O quê | Versão | Para quê |
|---|---|---|
| Node (via nvm) | >= 20.19.4 (uso o 22) | app, jest, lint, typecheck. O pre-push acha o Node certo sozinho (`.githooks/node-certo.sh`) |
| adb (Android platform-tools) | qualquer recente | falar com o celular |
| Java (11 ou mais) | — | o Maestro roda na JVM |
| Maestro CLI | `curl -Ls "https://get.maestro.mobile.dev" \| bash` | a bateria |
| eas-cli (opcional) | `npm i -g eas-cli` | build e OTA à mão (o CI já publica o OTA) |

```bash
npm ci            # instala as dependências e liga os hooks do git (.githooks)
cp .env.example .env
```

## 3. Testes de máquina

```bash
npm run lint && npm run typecheck
npx jest --ci --coverage      # o pre-push roda isto; cobertura mínima no package.json
```

## 4. Bateria Maestro (celular do Andre)

1. Celular com "Depuração USB" ligada, no cabo, com o APK de **preview** instalado
   (`com.vupth.partner.preview`, aponta para o staging). O APK sai do EAS (`eas build -p android --profile preview`).
2. `adb devices` mostra o aparelho → aceitar a chave no celular.
3. `bash .maestro/setup.sh` (ou `--completa` para não pular as etapas aprovadas).

A bateria empurra a imagem de teste (`.maestro/apoio/foto_teste.png`, versionada)
para a galeria e, ao terminar na branch `cloud`, commita `.maestro/` (com os logs em `.maestro/logs/`) e
dá push. A senha das contas de QA está no próprio `setup.sh` (contas `@teste.com`
do staging — não é segredo de produção).

## 5. Segredos — nenhum mora no PC

| Segredo | Onde vive |
|---|---|
| `EXPO_TOKEN` | GitHub → Settings → Secrets (CI e OTA) |
| Keystore Android (assinatura) | EAS (credenciais gerenciadas pelo Expo) |
| Chave FCM V1 (push) | EAS (credenciais dos pacotes preview e produção) |
| `google-services.json` | no repositório (não é segredo: identifica o app no Firebase) |
| `.env` | só `EXPO_PUBLIC_API_ENV` e o IP local: copia do `.env.example` |
| `~/.android/adbkey` | gerada de novo no PC novo; o celular pede para aceitar |

Login no EAS num PC novo: `eas login` (conta do Andre).
