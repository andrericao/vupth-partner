import fs from "fs";
import path from "path";

// GUARDA DO CAMINHO WEB (D8 — distribuir por web E por lojas).
//
// Nenhuma destas quatro pecas quebra typecheck, lint ou teste de componente se
// sumir: o app continua compilando e o build nativo nem percebe. O que quebra e
// o SITE — e so em producao, depois do deploy. Por isso a guarda e aqui.

const ROOT = path.resolve(__dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("caminho web — configuracao de export", () => {
  const appJson = JSON.parse(read("app.json")).expo;

  it("declara `web.output` (sem isso o expo-router escolhe por conta)", () => {
    expect(appJson.web?.output).toBeDefined();
  });

  it("usa `single` — o app e client-side, com rotas atras de login", () => {
    // "static" geraria um HTML por rota, o que so faz sentido com conteudo
    // publico e indexavel. Aqui toda tela util esta atras de autenticacao.
    expect(appJson.web.output).toBe("single");
  });

  it("tem script de build web", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["build:web"]).toContain("expo export");
    expect(pkg.scripts["build:web"]).toContain("--platform web");
  });
});

describe("caminho web — arquivos que o host le", () => {
  // O Expo copia `public/` inteiro para a saida do export. Cloudflare Pages e
  // Netlify leem os dois arquivos abaixo sem configuracao extra.

  it("_headers traz o CSP (mitigacao do token em sessionStorage)", () => {
    const headers = read("public/_headers");
    expect(headers).toContain("Content-Security-Policy");
  });

  it("_redirects manda toda rota para o index (fallback de SPA)", () => {
    // Com `output: single` existe UM index.html. Sem esta regra, abrir
    // /login direto — ou dar F5 dentro do app — devolve 404 do host, nao a
    // tela. E o defeito classico de SPA em host estatico.
    const redirects = read("public/_redirects");
    expect(redirects).toMatch(/\/\*\s+\/index\.html\s+200/);
  });
});

// ⚠️ AQUI HAVIA UMA GUARDA QUE MORREU COM O `deploy-web.yml` (2026-08-27).
//
// Ela exigia que o workflow de deploy DECLARASSE `EXPO_PUBLIC_API_ENV`. O
// workflow foi removido: o projeto do Cloudflare Pages e conectado ao GitHub e
// **builda sozinho**, entao o nosso workflow era um segundo pipeline publicando
// no mesmo projeto — e falhava, porque o wrangler la nao tem os secrets.
//
// O risco que a guarda cobria CONTINUA existindo, mas mudou de lugar: quem
// decide o backend do site agora e a variavel no PAINEL da Cloudflare, por
// ambiente (Production e Preview nao herdam uma da outra). Isso esta fora do
// repositorio e nenhum teste daqui alcanca.
//
// Estado desejado, para quem for conferir no painel:
//   Production (branch `main`)  -> EXPO_PUBLIC_API_ENV = prod     (Railway)
//   Preview    (branch `dev`)   -> EXPO_PUBLIC_API_ENV = staging  (Render)
//
// NAO recriar uma guarda que leia um arquivo inexistente: teste que so pode
// passar e pior que teste nenhum, porque da sensacao de cobertura.

describe("caminho web — a saida do build nao pode contaminar as ferramentas", () => {
  // O `expo/tsconfig.base` nao exclui nada. Sem esta linha, rodar
  // `npm run build:web` fazia o `tsc` entrar no bundle de 5,4 MB do `dist/` e
  // morrer com `RangeError: Maximum call stack size exceeded` — erro que nao
  // cita arquivo nenhum e nao parece ter relacao com o build web.
  it("eslint ignora a saida do export", () => {
    // Mesmo defeito do tsconfig, com outra ferramenta: sem esta linha,
    // `npm run lint` depois de um build web devolvia ~19.500 problemas vindos
    // do bundle — e o `--max-warnings 0` do gate reprovava tudo.
    const eslintrc = read("eslint.config.js");
    expect(eslintrc).toMatch(/ignores:\s*\[[^\]]*'dist\/'/);
  });

  it("tsconfig exclui a saida do export", () => {
    const tsconfig = JSON.parse(
      read("tsconfig.json").replace(/^\s*\/\/.*$/gm, "")
    );
    expect(tsconfig.exclude).toContain("dist");
  });
});
