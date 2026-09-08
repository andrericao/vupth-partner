type RoleIntent = "owner" | "professional" | undefined;

/**
 * Para onde o cartao de papel da tela de entrada leva.
 *
 * Papel neste sistema nao tem endpoint proprio: ele nasce como efeito de
 * CRIAR a entidade (loja -> OWNER, perfil profissional -> PROFESSIONAL) e
 * aparece no token no `refreshToken()` seguinte. Logo, quem ja tem conta nao
 * precisa passar pelo cadastro — precisa ir direto criar a entidade.
 *
 * Era esse desvio que faltava, e a falta dele fechava um ciclo: quem tinha
 * conta so de CLIENT tocava "Ja tem conta? Entrar", logava, e o
 * `getPostLoginRoute` abaixo — sem papel de parceiro e sem intencao —
 * devolvia `/(auth)`, a mesma tela de onde a pessoa veio.
 */
export function getRoleCardRoute(
  isAuthenticated: boolean,
  role: "owner" | "professional"
): string {
  if (!isAuthenticated) return `/(auth)/register?role=${role}`;
  return role === "owner"
    ? "/(owner)/onboarding/establishment"
    : "/(professional)/onboarding";
}

export function getPostLoginRoute(
  roles: string[],
  intent?: RoleIntent
): string {
  const hasOwner = roles.includes("OWNER");
  const hasProfessional = roles.includes("PROFESSIONAL");

  if (hasOwner && hasProfessional) {
    if (intent === "professional") return "/(professional)/queue";
    return "/(owner)/dashboard";
  }

  if (hasOwner) return "/(owner)/dashboard";
  if (hasProfessional) return "/(professional)/queue";

  if (intent === "owner") return "/(owner)/onboarding/establishment";
  if (intent === "professional") return "/(professional)/onboarding";

  // Logado, mas sem papel de parceiro e sem intencao declarada: a tela de
  // entrada e o lugar certo pra perguntar O QUE criar. Ela reconhece a sessao
  // (ver `getRoleCardRoute`) e manda pro onboarding, nao pro cadastro — sem
  // isso, isto aqui era um ciclo.
  return "/(auth)";
}

/**
 * O PRIMEIRO card da tela "Profissionais" (dono) — o slot que muda de papel.
 *
 * Ele tinha so o ramo falso: vivia atras de `!isProfessional` e SUMIA quando o
 * dono acumulava o perfil profissional. Quem ja atendia entrava na tela e via
 * apenas "Convidar" e "Ver solicitacoes" — as duas opcoes que dependem de
 * OUTRA pessoa —, sem porta para o proprio servico. E servico e justamente o
 * que falta para a loja abrir (teste de device, 06/09).
 *
 * Isto NAO contraria a decisao de que servico e do profissional: a porta so
 * aparece sob `isProfessional`, que e exatamente a condicao da decisao.
 *
 * `rota` ausente significa acao LOCAL: a escolha abre o formulario na propria
 * tela, sem navegar.
 */
export type CaminhoDoDono = {
  testID: string;
  title: string;
  hint: string;
  rota?: string;
  /**
   * Mostrado ANTES de navegar. Sair da area do dono para a do profissional e
   * uma troca de contexto, nao uma tela a mais: a barra muda, o menu muda, e
   * quem nao percebeu isso acha que "o app pulou para outro lugar". O aviso diz
   * o que vai acontecer e, principalmente, POR ONDE VOLTAR — os dois botoes de
   * troca sao "Área do dono" (Configuracoes do profissional) e "Atender como
   * profissional" (Menu do dono).
   */
  aviso?: { titulo: string; mensagem: string };
};

export function getPrimeiroCaminhoDoDono(isProfessional: boolean): CaminhoDoDono {
  if (isProfessional) {
    return {
      testID: "path-my-services",
      title: "Adicionar serviço",
      hint: "cadastre o que VOCÊ faz — sem serviço a loja não abre",
      rota: "/(professional)/my-services?from=settings",
      aviso: {
        titulo: "Você vai para a sua área de profissional",
        mensagem:
          "O serviço é SEU, não da loja — por isso o cadastro acontece lá. " +
          "Para voltar, use “Área do dono” em Configurações; para vir de novo " +
          "para cá, “Atender como profissional” no Menu.",
      },
    };
  }

  return {
    testID: "path-me",
    title: "Eu também vou atender",
    hint: "cria o SEU perfil profissional — você passa a ter fila própria",
  };
}

/**
 * A tela "Dados cadastrais" (e-mail, senha, nome, apelido) nasceu dentro da
 * area do PROFISSIONAL, e o menu do dono mandava "Dados pessoais" para uma tela
 * de "Em breve" — sendo que e-mail e senha sao do USUARIO, nao do papel, e
 * sempre existiram (teste de device, 08/09: "isso ja deveria ter sido
 * implementado").
 *
 * A mesma tela passa a servir os dois. Isto diz de onde a pessoa veio, para o
 * botao voltar nao jogar um dono na area do profissional.
 */
export function rotaDeVoltaDosDados(origem?: string | null): string {
  return origem === "owner" ? "/(owner)/menu" : "/(professional)/settings";
}
