const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    // `.claude/` guarda worktrees de agente — uma COPIA inteira do repo,
    // parada em outro commit. Sem ignorar, o lint reprova por arquivo que
    // nem existe nesta branch.
    // .maestro/scripts roda no JS do Maestro (globais http, json, output), nao
    // no app — fora do lint.
    ignores: ['coverage/', '.expo/', 'node_modules/', '.claude/', 'dist/', 'web-build/', '.maestro/'],
  },
  {
    // scripts/ roda no Node (catraca da cobertura) e o teste dele no jest. Os
    // globais vao listados aqui — o pacote `globals` so vem por tabela.
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
      },
    },
  },
]);
