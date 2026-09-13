/**
 * Qual backend este bundle fala.
 *
 * Render = ambiente de TESTE; Railway = PRODUCAO. O Render e o que se testa —
 * via Expo (app) e pelo link web que comeca com `dev` (Andre 2026-09-06).
 *
 * ⚠️ POR QUE ISTO NAO E SO UM `process.env`
 *
 * `EXPO_PUBLIC_API_ENV` e embutido no bundle NA HORA DE PUBLICAR, a partir do
 * `.env` da maquina de quem publicou. Quem estivesse com `local` no `.env`
 * (o normal pra rodar no computador) publicaria um app apontando pra
 * `http://localhost:8080` — morto em qualquer aparelho, e sem nenhum erro que
 * diga isso. Chegamos a um comando de distancia disso em 22/08.
 *
 * O CANAL, nao. Ele e carimbado pelo EAS no proprio update e nao depende do
 * ambiente de quem rodou o comando. Entao: havendo canal (bundle publicado),
 * quem decide e o canal; sem canal (rodando local), vale o `.env`.
 *
 * Consequencia pratica: publicar de qualquer maquina, com qualquer `.env`,
 * cai no backend certo. Nao ha mais o que lembrar antes de publicar.
 */
export type ApiEnv = "local" | "dev" | "staging" | "prod";

/**
 * Canal do EAS -> ambiente. Mesma tabela do `eas.json` dos dois apps.
 *
 * `preview` aponta pro RENDER (branch `dev` do backend) desde 2026-09-06, por
 * decisao do Andre: **prod e o Railway, staging e o Render**, e o Render e o
 * que se testa — via Expo no app e pelo link `dev.vupth-partner.pages.dev` na
 * web. `preview` e o canal do APK de distribuicao interna, ou seja, o canal do
 * TESTE: ele passa a bater no mesmo backend que o link de teste.
 *
 * Ate 2026-08-22 ele apontava pro Railway, com a consequencia assumida de que
 * teste em device gravava no banco de PRODUCAO. Foi exatamente isso que mudou:
 * agora o QA (contas `prop_10@teste.com` e afins) vive no Render, e a
 * producao so recebe o canal `production`.
 *
 * ⚠️ Consequencia nova: o Render Free hiberna, entao o APK de `preview` passa
 * a ver o portao de warmup (`readiness.ts`) no primeiro acesso — ~50s. Isso e
 * esperado, nao e bug.
 */
export const CANAL_PARA_ENV: Record<string, ApiEnv> = {
  development: "staging",
  preview: "staging",
  production: "prod",
};

export function resolveApiEnv(
  canal: string | null | undefined,
  envDoBundle: string | null | undefined,
): ApiEnv {
  // So canal DECLARADO manda. Um canal fora da tabela nao diz nada sobre
  // backend — pode ser um canal avulso, ou o `"mock"` que o jest-expo devolve
  // quando nao ha OTA nenhum. Confiar nele as cegas ligava o portao de
  // readiness no meio dos testes, que rodam apontando pro `local`.
  const doCanal = canal ? CANAL_PARA_ENV[canal] : undefined;
  if (doCanal) return doCanal;

  const doEnv = envDoBundle as ApiEnv | undefined;
  return doEnv && ["local", "dev", "staging", "prod"].includes(doEnv) ? doEnv : "local";
}
