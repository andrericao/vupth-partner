import { useState, useEffect, useCallback } from "react";
import { LinksLegais } from "@components/LinksLegais";
import { BarraDeStatusClara } from "@components/BarraDeStatus";
import { SkeletonTexto } from "@components/Skeleton";
import { Avatar } from "@components/Avatar";
import { ratingLabel } from "@lib/rating";
import { useMinhaFoto } from "@hooks/useMinhaFoto";
import { compartilharComAviso } from "@lib/compartilharComAviso";
import { linkDoProfissional, mensagemDeDivulgacao } from "@lib/linkPublico";
import { API_ENV } from "@lib/api";
import { subtituloDasConfiguracoes } from "@lib/subtituloDasConfiguracoes";
import { useVoltarAoTopo, usePilulaTopo } from "@hooks/useVoltarAoTopo";
import { PilulaVoltarAoTopo } from "@components/PilulaVoltarAoTopo";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Scissors,
  Utensils,
  User,
  Link as LinkIcon,
  ChevronRight,
  ArrowLeftRight,
  Info, Share2, Star, Palette, Store, CalendarDays, QrCode, LifeBuoy, Ticket, Bug } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { CompletionCard } from "@components/CompletionCard";
import { useAnuncioPronto } from "@hooks/useAnuncioPronto";
import { useProfessionalCompletion } from "@hooks/useProfessionalCompletion";
import { NotificationBadge } from "@components/NotificationBadge";
import { confirmar } from "@lib/confirmar";
import { abrirSuporte } from "@lib/suporte";
import { sentryLigado } from "@lib/sentry";
import { ReportarProblema } from "@components/ReportarProblema";
import { CUPOM_NO_AR } from "@lib/campanhas";
import { useTema } from "@hooks/useTema";

// Nav v2 etapa 3 (Andre 2026-07-23): "as configuracoes do profissional deve ser
// melhor dividida — dados cadastrais, servicos, refeicoes". Esta tela virou um
// MENU de cards; o conteudo mora nas sub-telas (settings-account, my-services,
// meals, settings-vinculo). Area do dono (dupla role) e Sair vivem aqui — fora
// das Opcoes da fila, que so tem acoes do dia.
//
// [marca-vupth] Redesenhada p/ bater com o Pencil (PROF · 04 Perfil): cabecalho
// proprio (forest + avatar + nome), sem o Header padrao (o .pen nao tem a barra
// VUPTH/icone de papel nesta tela — o avatar+nome ja cumpre esse papel), e o
// menu ganhou icone + agrupamento (ATENDIMENTO / CONTA) no lugar da lista lisa
// com "›" de texto.
type CardProps = {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  hint: string;
  badge?: number;
  dot?: boolean;
  last?: boolean;
  onPress: () => void;
};


// Escopo de MODULO (licao do segfault do tsc: componente definido dentro do
// componente estourava a inferencia e remonta a subarvore a cada render).
function MenuCard({ icon: Icon, title, hint, badge, dot, last = false, onPress }: CardProps) {
  const { cores } = useTema();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-vupth-surface"
      >
        <Icon size={20} color={cores.textPrimary} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="font-body text-sm font-semibold text-vupth-textPrimary">{title}</Text>
            {/* Dot POR CARD: sem ele o dot da aba dizia "ha pendência" mas nao
                ONDE (feedback Andre 2026-07-24). Agora acende no card exato, ao lado do
                titulo (dot-ao-lado-do-nome-em-menu-empilhado, Andre 24/10). */}
            {dot && (
              <View
                testID={`settings-dot-${title.toLowerCase().replace(/\s+/g, "-")}`}
                className="w-2 h-2 rounded-full bg-vupth-danger"
              />
            )}
          </View>
          <Text className="font-body text-xs text-vupth-textSecondary mt-0.5">{hint}</Text>
        </View>
        {badge != null && badge > 0 && (
          <NotificationBadge count={badge} testID="settings-badge-invites" />
        )}
        <ChevronRight size={16} color={cores.textPrimary} />
      </Pressable>
      {!last && <View className="h-px bg-vupth-border" />}
    </>
  );
}

/** Bloco de cards sob um rotulo — mesmo padrao do menu do dono (menu.tsx). */
function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-body text-xs font-bold tracking-wider text-vupth-textSecondary">
        {label.toUpperCase()}
      </Text>
      <View className="bg-vupth-surface rounded-card overflow-hidden">{children}</View>
    </View>
  );
}

export default function ProfessionalSettingsScreen() {
  // Tocar na aba JA ATIVA volta ao topo (Andre, 18/09).
  const rolagemRef = useVoltarAoTopo();
  const pilula = usePilulaTopo(rolagemRef);
  const [reportando, setReportando] = useState(false);

  const insets = useSafeAreaInsets();
  const { cores } = useTema();
  const professional = useProfessionalStore((s) => s.professional);
  const minhaFoto = useMinhaFoto();
  const fetchMyAffiliations = useProfessionalStore((s) => s.fetchMyAffiliations);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { completion, routeFor } = useProfessionalCompletion();
  // O anuncio de "ja pode atender" e MODAL, uma vez — a faixa eterna saiu.
  useAnuncioPronto(
    "profissional",
    completion.basic.percent,
    "Você já pode atender: seu cadastro está completo e você aparece para os clientes."
  );

  const isOwner = user?.roles?.includes("OWNER");

  // Mapeia as pendencias do checklist para o CARD exato (feedback Andre
  // 2026-07-24: a aba tinha dot, mas dentro nao dava pra saber O QUE faltava).
  const pendingKeys = new Set(
    [...completion.basic.items, ...completion.profile.items]
      .filter((i) => !i.done)
      .map((i) => i.key)
  );
  const dadosDot = pendingKeys.has("nickname") || pendingKeys.has("specialty");
  const servicosDot = pendingKeys.has("service");
  const vinculoDot = pendingKeys.has("affiliated");

  // Contagem de convites pendentes: o conteudo mora em settings-vinculo, mas o
  // badge aqui evita que um convite do owner fique enterrado um nivel abaixo.
  const [pendingInvites, setPendingInvites] = useState(0);

  const loadInvites = useCallback(async () => {
    try {
      const all = await fetchMyAffiliations();
      setPendingInvites(
        (all ?? []).filter((a: any) => a.status === "PENDING" && a.type === "INVITATION").length
      );
    } catch {}
  }, [fetchMyAffiliations]);

  useEffect(() => {
    // carrega a contagem on-mount; setPendingInvites e o efeito desejado do fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvites();
  }, [loadInvites]);

  const handleLogout = () => {
    confirmar({
      titulo: "Sair da conta",
      mensagem: "",
      confirmar: "Sair",
      destrutivo: true,
    }).then(async (ok) => {
      if (!ok) return;
      await logout();
      router.replace("/(auth)" as any);
    });
  };

  const subtitle = subtituloDasConfiguracoes(professional);

  return (
    <View style={{ flex: 1 }}>
      {/* O cabecalho forest fica sob a barra de status: icones claros (PAR-3). */}
      <BarraDeStatusClara />
      <ScrollView
          ref={rolagemRef}
          onScroll={pilula.onScroll}
          scrollEventThrottle={64} className="w-full" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* [marca-vupth] Cabecalho proprio (Pencil PROF · 04): forest + avatar
            com iniciais + nome. Substitui o Header padrao nesta tela — o .pen
            não repete a barra VUPTH/icone de papel aqui, o avatar já identifica
            quem esta logado. O fundo `forest` e o mesmo hex nos dois temas, entao
            o que ha sobre ele (branco, green) tambem vale nos dois. */}
        <View
          className="bg-vupth-forest items-center px-4 pb-7"
          style={{ paddingTop: insets.top + 24 }}
        >
          {/* A foto se edita em Dados cadastrais (Andre, 26/09); aqui so aparece.
              O icone de compartilhar fica no canto do cabecalho. */}
          <Avatar nome={professional?.name} uri={minhaFoto.uri} testID="avatar-perfil" />
          {/* Compartilhar o link publico: um icone no canto do Perfil (Andre, 26/09).
              So com vinculo — sem loja nao ha pagina. */}
          {professional?.establishment_id && (
            <Pressable
              onPress={() =>
                compartilharComAviso(
                  linkDoProfissional(API_ENV, professional.establishment_id!, professional.id),
                  {
                    titulo: professional.establishment_name ?? "Minha fila",
                    mensagem: mensagemDeDivulgacao(
                      professional.establishment_name,
                      professional.nickname || professional.name
                    ),
                  }
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Compartilhar meu perfil"
              testID="compartilhar-perfil-topo"
              hitSlop={10}
              className="absolute right-4 active:opacity-70"
              style={{ top: insets.top + 16 }}
            >
              <Share2 size={22} color={cores.green} />
            </Pressable>
          )}
          {/* Sem o perfil ainda: skeleton, nunca "Profissional" — com conta ja
              criada o texto generico parecia erro (Andre, 02/10). */}
          {professional ? (
            <>
              {/* tema-fixo: branco sobre o forest do cabecalho, igual nos dois temas */}
              <Text className="font-display text-xl text-white mt-3">{professional.name}</Text>
              <Text className="font-body text-sm text-vupth-green mt-0.5">{subtitle}</Text>
              {/* avaliacao-no-resumo: a nota geral. A nota POR TIPO DE CORTE vem
                  depois (so o lugar fica pensado: esta linha). */}
              {ratingLabel(professional.rating_average, professional.rating_count) && (
                <View className="flex-row items-center gap-1.5 mt-1" testID="perfil-avaliacao">
                  <Star size={13} color={cores.green} fill={cores.green} />
                  {/* tema-fixo: idem */}
                  <Text className="font-body text-sm text-white">
                    {ratingLabel(professional.rating_average, professional.rating_count)} · sua avaliação
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="items-center mt-3 gap-2">
              <SkeletonTexto largura={160} altura={22} escuro testID="perfil-nome-carregando" />
              <SkeletonTexto largura={120} altura={14} escuro />
            </View>
          )}
        </View>
  
        <View className="flex-1 py-6 px-4 gap-5">
          {/* Checklist de prontidao (2 completes) mora aqui — a Home so mostra a
              faixa. Encaminha para buscar estabelecimento / adicionar serviço. */}
          <CompletionCard
            completion={completion}
            routeFor={routeFor}
          />
  
          {/* Quem acumula os dois papeis troca de area por aqui — mesmo padrao
              do menu do dono (menu.tsx "Atender como profissional"). Fica FORA
              dos grupos porque não e configuracao, e mudar de contexto. */}
          {isOwner && (
            <Pressable
              onPress={() => router.replace("/(owner)/dashboard" as any)}
              className="flex-row items-center gap-3 bg-vupth-greenTint rounded-card px-4 py-3.5"
            >
              <ArrowLeftRight size={20} color={cores.onGreenTint} />
              <Text className="flex-1 font-body text-sm font-semibold text-vupth-onGreenTint">
                Área do dono
              </Text>
              <ChevronRight size={16} color={cores.onGreenTint} />
            </Pressable>
          )}
  
          <Grupo label="Atendimento">
            <MenuCard
              icon={Scissors}
              title="Meus serviços"
              hint="preços e duração do que você oferece"
              dot={servicosDot}
              onPress={() => router.push("/(professional)/my-services?from=settings" as any)}
            />
            <MenuCard
              icon={Utensils}
              title="Refeições"
              hint="horários + aviso na hora (ligar/desligar)"
              onPress={() => router.push("/(professional)/meals?from=settings" as any)}
            />
            <MenuCard
              icon={CalendarDays}
              title="Minha agenda"
              hint="dias e horários em que você atende"
              onPress={() => router.push("/(professional)/agenda" as any)}
            />
            <MenuCard
              icon={CalendarDays}
              title="Agendamentos"
              hint="os clientes marcados nos próximos dias"
              onPress={() => router.push("/(professional)/agendados" as any)}
            />
            {/* pagamento-pix (contrato BAK 2a2b0ec): a chave com que o cliente paga. */}
            <MenuCard
              icon={QrCode}
              title="Chave Pix"
              hint="para o cliente pagar direto a você"
              last
              onPress={() => router.push("/(professional)/pix" as any)}
            />
          </Grupo>
  
          <Grupo label="Conta">
            <MenuCard
              icon={User}
              title="Dados cadastrais"
              hint="nome, apelido, e-mail, senha"
              dot={dadosDot}
              onPress={() => router.push("/(professional)/settings-account" as any)}
            />
            <MenuCard
              icon={LinkIcon}
              title="Vínculo"
              hint={professional?.establishment_name ?? "não vinculado — buscar estabelecimento"}
              badge={pendingInvites}
              dot={vinculoDot}
              last={!!isOwner}
              onPress={() => router.push("/(professional)/settings-vinculo" as any)}
            />
            {/* cupom-no-app (DEC-61): liga quando o Backend das campanhas subir. */}
            {CUPOM_NO_AR && (
              <MenuCard
                icon={Ticket}
                title="Promoções"
                hint="usar um cupom"
                onPress={() => router.push("/(professional)/promocoes" as any)}
              />
            )}
            {/* S23 (PAR-7): a porta do profissional que abre a propria loja.
                Quem ja e dono troca de area pelo "Área do dono", acima. */}
            {!isOwner && (
              <MenuCard
                icon={Store}
                title="Abrir meu estabelecimento"
                hint="cadastre a sua loja — você vira dono também"
                last
                onPress={() => router.push("/(owner)/onboarding/establishment?from=professional" as any)}
              />
            )}
          </Grupo>
  
          {/* Sair da conta fica solto e em vermelho, fora dos grupos: e a unica
              ação aqui que tira a pessoa do app (Pencil PROF · 04, mesmo padrao
              do menu do dono). */}
          {/* Versao, atualizacao e diagnostico viraram DESTINO (pedido dele,
              09/09). E este grupo e um item da LISTA, nao rodape: ele estava
              abaixo do "Sair da conta", que e o fim da tela — la nao se procura
              configuracao, se procura a saida (correcao dele, 11/09). */}
          <Grupo label="Sistema">
            <MenuCard
              icon={Palette}
              title="Aparência"
              hint="tema e tamanho da fonte"
              onPress={() => router.push("/(professional)/aparencia" as any)}
            />
            <MenuCard
              icon={Info}
              title="Versão do app"
              hint="atualização e informações técnicas"
              onPress={() => router.push("/(professional)/sistema" as any)}
            />
            {/* botao-suporte (PAR-7): abre o site de suporte no navegador. */}
            <MenuCard
              icon={LifeBuoy}
              title="Suporte"
              hint="dúvidas e passo a passo do app"
              last={!sentryLigado()}
              onPress={() => abrirSuporte("profissional")}
            />
            {/* sentry-feedback-do-usuario: so com o Sentry ligado no binario. */}
            {sentryLigado() && (
              <MenuCard
                icon={Bug}
                title="Reportar problema"
                hint="conte o que deu errado"
                last
                onPress={() => setReportando(true)}
              />
            )}
          </Grupo>
  
          <Pressable onPress={handleLogout} className="py-1" accessibilityRole="button" accessibilityLabel="Sair">
            <Text className="font-body text-sm font-semibold text-vupth-danger text-center">
              Sair da conta
            </Text>
          </Pressable>
          <LinksLegais className="mt-2" />
  
        </View>
      </ScrollView>
      <PilulaVoltarAoTopo visivel={pilula.visivel} onPress={pilula.subir} />
      <ReportarProblema visivel={reportando} onFechar={() => setReportando(false)} />
    </View>
  );
}
