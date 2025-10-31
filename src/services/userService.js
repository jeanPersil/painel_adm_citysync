/**
 * SERVICE - Camada de regras de negócio para usuarios
 *
 * Responsabilidades:
 * - Implementar lógica de negócio e regras de aplicação
 * - Orquestrar operações entre diferentes repositórios
 * - Validar regras específicas do domínio
 * - Tratar autenticação e autorização
 * - Gerenciar fluxos complexos de operações
 *
 * NÃO lida diretamente com HTTP (isso fica no controller)
 * NÃO acessa o banco diretamente (isso fica no repository)
 */

const supabase = require("../config");
const userRepositorie = require("../repositories/userRepositorie");
const UserRepositories = require("../repositories/userRepositorie"); //

class UserService {
  async autenticarAdmin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const dados_usuario = await UserRepositories.pegarDadosPeloId(data.user.id);

    if (!dados_usuario) {
      throw new Error("Detalhes do usuário não encontrados após o login.");
    }

    return {
      session: data.session,
      user: dados_usuario,
    };
  }

  async editar_dados(nome, email, token) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Token inválido ou expirado.");
    }

    const userId = user.id;

    if (email) {
      const { error: emailAuthError } =
        await supabase.auth.admin.updateUserById(userId, { email: email });

      if (emailAuthError) {
        throw new Error(
          `Erro ao atualizar e-mail de autenticação: ${emailAuthError.message}`
        );
      }
    }

    const profileUpdates = {};

    if (nome) {
      profileUpdates.nome = nome;
    }
    if (email) {
      profileUpdates.email = email;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("users")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        throw new Error(
          `Erro ao atualizar perfil (tabela users): ${profileError.message}`
        );
      }
    }
  }

  async enviar_email_de_recuperacao_de_senha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://meusite.com/reset-password",
    });

    if (error) throw new Error(error.message);

    return true;
  }

  async mudarSenha(email, token, novaSenha) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (verifyError) throw new Error("Token inválido ou expirado.");

    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (updateError) throw new Error("Não foi possivel atualizar a senha");

    return true;
  }
}

module.exports = new UserService();
