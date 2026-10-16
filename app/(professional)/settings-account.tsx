import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@components/ScreenHeader";
import { NwButton } from "@components/nw/Button";
import { NwInput } from "@components/nw/Input";
import { useProfessionalStore } from "@store/professional.store";
import { useAuthStore } from "@store/auth.store";
import { getApiErrorMessage, API_ENV } from "@lib/api";
import { FotoEditavel } from "@components/FotoEditavel";
import { CompartilharPerfil } from "@components/CompartilharPerfil";
import { useMinhaFoto } from "@hooks/useMinhaFoto";
import { editarFoto, ROTA_DO_PERFIL } from "@lib/fotoDePerfil";
import { avisar } from "@lib/confirmar";
import { linkDoProfissional, mensagemDeDivulgacao } from "@lib/linkPublico";
import { validatePassword, SENHA_DICA, SENHA_MAX } from "@lib/passwordValidation";
import { rotaDeVoltaDosDados } from "@lib/routing";
import { useLimparAoSair } from "@hooks/useLimparAoSair";
import { ExcluirContaModal } from "@components/ExcluirContaModal";
import { DesativarContaModal } from "@components/DesativarContaModal";
import { mensagemDaExclusao, mensagemDaDesativacao } from "@lib/exclusaoDeConta";
import { maskPhone } from "@lib/masks";
import { erroDoTelefoneDeContato, telefoneParaMostrar } from "@lib/telefoneDeContato";

type Editing = null | "name" | "nickname" | "phone" | "email" | "password";

// Nav v2 etapa 3 (Andre 2026-07-23): "as configuracoes do profissional deve ser
// melhor dividida". Esta tela concentra os DADOS CADASTRAIS (nome, apelido,
// e-mail, senha) que antes viviam misturados na Configuracoes gigante.
// Card de UM campo editavel. Os quatro (nome, apelido, e-mail, senha) eram
// blocos identicos copiados — na conversao p/ NativeWind viraram este
// componente, que carrega o formulario como `children`. No escopo do MODULO,
// nunca dentro da tela (licao do segfault do tsc).
function FieldCard({
  label,
  value,
  editing,
  editLabel = "Editar",
  onEdit,
  onCancel,
  onSave,
  isSaving,
  error,
  children,
}: {
  label: string;
  value: string;
  editing: boolean;
  editLabel?: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <View className="bg-vupth-surface p-4 rounded-card">
      <Text className="font-body text-sm text-vupth-textSecondary">{label}</Text>
      {editing ? (
        <View className="mt-2">
          {children}
          {error && (
            <Text className="font-body text-xs text-vupth-danger mb-2">{error}</Text>
          )}
          <View className="flex-row gap-2">
            <NwButton title="Cancelar" onPress={onCancel} variant="secondary" className="flex-1 h-9 mt-0" />
            <NwButton title="Salvar" onPress={onSave} isLoading={isSaving} className="flex-1 h-9 mt-0" />
          </View>
        </View>
      ) : (
        <>
          <Text className="font-heading text-vupth-forest mt-1">{value}</Text>
          <NwButton title={editLabel} onPress={onEdit} variant="secondary" className="h-9 mt-2" />
        </>
      )}
    </View>
  );
}

export default function SettingsAccountScreen() {
  const professional = useProfessionalStore((s) => s.professional);
  // O dono chega aqui pelo menu ("Dados pessoais"). Nome e apelido pertencem ao
  // PERFIL PROFISSIONAL — quem nao tem um nao vê esses campos, senao a tela
  // ofereceria editar algo que nao existe. E-mail e senha sao do usuario e
  // valem para os dois.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const temPerfilProfissional = !!professional;
  const minhaFoto = useMinhaFoto();
  const updateMyProfile = useProfessionalStore((s) => s.updateMyProfile);
  const updateNickname = useProfessionalStore((s) => s.updateNickname);
  const setContactPhone = useProfessionalStore((s) => s.setContactPhone);
  const user = useAuthStore((s) => s.user);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const deactivateAccount = useAuthStore((s) => s.deactivateAccount);

  // Excluir conta: bloqueio de publicacao (lojas + LGPD). Mora aqui porque
  // esta tela e a mesma para profissional e dono.
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  // desativar-conta (c0f5b17): o par reversivel do excluir, lado a lado no menu Conta.
  const [desativarAberto, setDesativarAberto] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [erroDesativacao, setErroDesativacao] = useState<string | null>(null);

  const handleDeactivateAccount = async (senhaAtual: string) => {
    setDesativando(true);
    setErroDesativacao(null);
    try {
      await deactivateAccount(senhaAtual);
      setDesativarAberto(false);
      router.replace("/(auth)" as any);
    } catch (error: any) {
      setErroDesativacao(mensagemDaDesativacao(error));
    } finally {
      setDesativando(false);
    }
  };

  const handleDeleteAccount = async (senhaAtual: string) => {
    setExcluindo(true);
    setErroExclusao(null);
    try {
      await deleteAccount(senhaAtual);
      setExcluirAberto(false);
      router.replace("/(auth)" as any);
    } catch (error: any) {
      setErroExclusao(mensagemDaExclusao(error));
    } finally {
      setExcluindo(false);
    }
  };

  const [editing, setEditing] = useState<Editing>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const startEdit = (field: Editing) => {
    setFieldError(null);
    setName(field === "name" ? professional?.name ?? "" : "");
    setNickname(field === "nickname" ? professional?.nickname ?? "" : "");
    const atual = telefoneParaMostrar(professional?.contact_phone);
    setPhone(field === "phone" && atual !== "—" ? atual : "");
    setEmail("");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setEditing(field);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFieldError(null);
  };

  // 🔴 A tela continua MONTADA na pilha ao navegar, entao o que foi digitado
  // sobrevive — inclusive a SENHA ATUAL e a NOVA, que ficavam vivas na memoria
  // do app por tempo indefinido (pedido dele, 10/09). Limpa ao SAIR: quem volta
  // encontra a tela limpa, sem ver o proprio texto sumir na frente.
  useLimparAoSair(() => {
    setEditing(null);
    setFieldError(null);
    setName("");
    setNickname("");
    setPhone("");
    setEmail("");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
  });

  const handleSaveName = async () => {
    const value = name.trim();
    if (value.length < 2) {
      setFieldError("Informe um nome valido.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updateMyProfile({ name: value });
      setEditing(null);
      Alert.alert("Nome atualizado", "Seu nome foi alterado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível alterar o nome."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNickname = async () => {
    const value = nickname.trim();
    if (value.length > 50) {
      setFieldError("O apelido deve ter no máximo 50 caracteres.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      // String vazia limpa o apelido no backend.
      await updateNickname(value);
      setEditing(null);
      Alert.alert(
        "Apelido atualizado",
        value ? "Seu apelido foi salvo." : "Seu apelido foi removido."
      );
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o apelido."));
    } finally {
      setIsSaving(false);
    }
  };

  // telefone-de-contato (Andre, 05/10): opcional. Vazio = o cliente nao ve
  // telefone nenhum em "Informacoes do profissional".
  const handleSavePhone = async () => {
    const erro = erroDoTelefoneDeContato(phone);
    if (erro) {
      setFieldError(erro);
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await setContactPhone(phone);
      setEditing(null);
      Alert.alert(
        "Telefone de contato",
        phone.trim()
          ? "Seu número foi salvo. O cliente vê em Informações do profissional."
          : "Seu número foi removido. O cliente não vê mais telefone."
      );
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível salvar o telefone."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError("Informe um e-mail valido.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updateEmail(value);
      setEditing(null);
      Alert.alert("E-mail atualizado", "Seu e-mail foi alterado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível alterar o e-mail."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      setFieldError("Informe sua senha atual.");
      return;
    }
    const check = validatePassword(password);
    if (!check.valid) {
      setFieldError(check.errors.join("\n"));
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("As senhas não coincidem.");
      return;
    }
    setFieldError(null);
    setIsSaving(true);
    try {
      await updatePassword(currentPassword, password);
      setEditing(null);
      Alert.alert("Senha alterada", "Sua senha foi alterada com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", getApiErrorMessage(error, "Não foi possível alterar a senha."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 pb-12 px-4">
          <ScreenHeader
          title={from === "owner" ? "Dados pessoais" : "Dados cadastrais"}
          onBack={() => router.navigate(rotaDeVoltaDosDados(from) as any)}
        />

          {/* A foto (S22) e o link publico moram aqui (Andre, 26/09): foto com o
              selo de camera no canto; compartilhar com o copiar ao lado. */}
          <View className="mt-4 items-center gap-2">
            <FotoEditavel
              nome={professional?.name}
              uri={minhaFoto.uri}
              rotulo={minhaFoto.uri ? "Trocar foto de perfil" : "Pôr foto de perfil"}
              testID="foto-perfil"
              titulo="Foto de perfil"
              onEscolher={(acao, enquadrar) =>
                editarFoto({
                  temFoto: !!minhaFoto.uri,
                  rota: ROTA_DO_PERFIL,
                  aoMudar: minhaFoto.trocar,
                  enquadrar,
                  perguntar: async () => acao,
                  avisar,
                })
              }
            />
          </View>
          {professional?.establishment_id && (
            <View className="mt-4">
              <CompartilharPerfil
                link={linkDoProfissional(API_ENV, professional.establishment_id, professional.id)}
                titulo={professional.establishment_name ?? "Minha fila"}
                mensagem={mensagemDeDivulgacao(
                  professional.establishment_name,
                  professional.nickname || professional.name
                )}
              />
            </View>
          )}

          <View className="mt-6 gap-3">
            {/* Nome e apelido moram no PERFIL PROFISSIONAL. Dono sem esse perfil
                nao os vê — oferecer edicao de algo inexistente e pior que a tela
                de "Em breve" que havia aqui antes. */}
            {temPerfilProfissional && (
              <>
            <FieldCard
              label="Nome"
              value={professional?.name ?? "—"}
              editing={editing === "name"}
              onEdit={() => startEdit("name")}
              onCancel={cancelEdit}
              onSave={handleSaveName}
              isSaving={isSaving}
              error={fieldError}
            >
              <NwInput
                label="Novo nome"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </FieldCard>

            <FieldCard
              label="Apelido"
              value={professional?.nickname || "—"}
              editing={editing === "nickname"}
              onEdit={() => startEdit("nickname")}
              onCancel={cancelEdit}
              onSave={handleSaveNickname}
              isSaving={isSaving}
              error={fieldError}
            >
              <NwInput
                label="Apelido (ajuda os clientes a te achar na busca)"
                placeholder="Ex.: Dedeco"
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="words"
                maxLength={50}
              />
            </FieldCard>

            <FieldCard
              label="Telefone de contato (opcional)"
              value={telefoneParaMostrar(professional?.contact_phone)}
              editing={editing === "phone"}
              onEdit={() => startEdit("phone")}
              onCancel={cancelEdit}
              onSave={handleSavePhone}
              isSaving={isSaving}
              error={fieldError}
            >
              <NwInput
                label="Telefone de contato"
                placeholder="(11) 98888-7777"
                value={phone}
                onChangeText={(t) => setPhone(maskPhone(t))}
                keyboardType="phone-pad"
                testID="telefone-de-contato"
              />
              <Text className="font-body text-xs text-vupth-textSecondary mb-2">
                Aparece em “Informações do profissional”, no app do cliente. Deixe vazio
                para não mostrar.
              </Text>
            </FieldCard>
              </>
            )}

            <FieldCard
              label="E-mail"
              value={user?.email ?? "—"}
              editing={editing === "email"}
              onEdit={() => startEdit("email")}
              onCancel={cancelEdit}
              onSave={handleSaveEmail}
              isSaving={isSaving}
              error={fieldError}
            >
              <NwInput
                label="Novo e-mail"
                placeholder="voce@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FieldCard>

            <FieldCard
              label="Senha"
              value="********"
              editing={editing === "password"}
              editLabel="Alterar"
              onEdit={() => startEdit("password")}
              onCancel={cancelEdit}
              onSave={handleSavePassword}
              isSaving={isSaving}
              error={fieldError}
            >
              {/* "Senha atual" e exigida pelo backend desde 2026-07-23
                  (CURRENT_PASSWORD_INVALID -> 401 tratado como erro de campo). */}
              <NwInput
                label="Senha atual"
                placeholder="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secure
                autoCapitalize="none"
              />
              <NwInput
                label="Nova senha"
                placeholder={SENHA_DICA}
                maxLength={SENHA_MAX}
                value={password}
                onChangeText={setPassword}
                secure
                autoCapitalize="none"
              />
              <NwInput
                label="Confirmar nova senha"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secure
                autoCapitalize="none"
              />
            </FieldCard>
          </View>

          {/* Menu Conta (Andre, 08/10: "deve haver um menu em ambos os fronts
              para excluir e desativar conta"): Desativar e Excluir lado a lado,
              no fim — caminho que a loja de apps exige, nao acao do dia a dia. */}
          <View className="mt-10 gap-2" testID="menu-conta">
            <Text className="font-heading text-sm text-vupth-forest">Conta</Text>
            <View className="flex-row gap-2">
              <NwButton
                title="Desativar"
                variant="secondary"
                className="flex-1 mt-0"
                onPress={() => {
                  setErroDesativacao(null);
                  setDesativarAberto(true);
                }}
                testID="deactivate-account"
              />
              <NwButton
                title="Excluir"
                variant="outlineDanger"
                className="flex-1 mt-0"
                onPress={() => {
                  setErroExclusao(null);
                  setExcluirAberto(true);
                }}
                testID="delete-account"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <DesativarContaModal
        visible={desativarAberto}
        ehDono={user?.roles?.includes("OWNER")}
        isDeactivating={desativando}
        error={erroDesativacao}
        onConfirm={handleDeactivateAccount}
        onClose={() => setDesativarAberto(false)}
      />
      <ExcluirContaModal
        visible={excluirAberto}
        isDeleting={excluindo}
        error={erroExclusao}
        onConfirm={handleDeleteAccount}
        onClose={() => setExcluirAberto(false)}
      />
    </KeyboardAvoidingView>
  );
}
