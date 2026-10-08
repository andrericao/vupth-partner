# vupth-partner — Front-Partner

Ler `../vupth-docs/regras/CLAUDE-equipes.md` (regras das equipes VUPTH, DEC-28).

O `vupth-docs` fica sempre ao lado deste repositório, no PC e na nuvem. No `--cloud`,
clonar `https://github.com/andrericao/vupth-docs` em `../vupth-docs` antes de começar:
os hooks de `.claude/settings.json` e as regras moram lá.

## Regras próprias deste repositório

- Branch de trabalho: `cloud`; o Andre leva para a `dev` (PR) e para a `main`.
- Node certo: `.githooks/node-certo.sh`. Lint (`npm run lint`) e typecheck (`npm run typecheck`) limpos antes de pedir push; o pre-push roda o jest com cobertura.
- Bateria Maestro: `bash .maestro/setup.sh` (celular do Andre no adb). Os logs caem em `logs/maestro/<rodada>/` e sobem para a `cloud` sozinhos.
- Documentação vive no vupth-docs (aba Partner), não em `.md` deste repositório.
