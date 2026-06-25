# Anti-quebra & Rollback

Rede de proteção em 3 camadas para o código nunca "subir quebrado" e, se subir,
ter rollback rápido para o último estado funcional.

## 1. Portão antes de subir (não deixa o quebrado sair)

### Local — pre-push hook
`.githooks/pre-push` roda **antes de cada `git push`** e **aborta** se falhar:

1. `typecheck` (tsc --noEmit)
2. `jest` (testes)
3. `expo-doctor` (sanidade de config/nativo)

Ativação: automática via `npm install` (script `prepare` aponta
`core.hooksPath` para `.githooks/`). Para ativar manualmente:

```bash
git config core.hooksPath .githooks
```

Bypass de emergência (pula o portão): `git push --no-verify`

### Servidor — CI + branch protection
`.github/workflows/ci.yml` roda typecheck + jest + cobertura + expo-doctor em
todo push (`dev`/`main`) e PR para `main`.

Ative **branch protection** no `main` (GitHub → Settings → Branches → Add rule):
- Require a pull request before merging
- Require status checks to pass → marcar **CI / lint-and-test**

Assim, código quebrado **não consegue ser mergeado no `main`**.

## 2. Linha de produção protegida (`main`)
`main` só recebe commits **já comprovadamente verdes** (via PR com CI passando).
É o ponto de rollback sempre confiável. O dia a dia acontece em `dev`.

## 3. Rollback (se algo ruim passar)

Tag de fallback de código: `last-ci-green` (mover para frente a cada release verde):
```bash
git tag -f last-ci-green <commit-bom> && git push -f origin last-ci-green
```

Desfazer um commit ruim **mantendo histórico** (preferido em branch compartilhada):
```bash
git revert --no-edit <commit-ruim>
```

Voltar a branch inteira para o último verde (descarta o que veio depois):
```bash
git reset --hard last-ci-green
```

App já publicado (quando EAS Update/OTA estiver ligado): reverte os usuários na hora:
```bash
eas update:rollback
```
