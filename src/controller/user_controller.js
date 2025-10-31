/**
 * CONTROLLER - Camada de controle de requisições
 *
 * Responsabilidades:
 * - Receber requisições HTTP
 * - Validar dados de entrada (params, query, body)
 * - Chamar os serviços apropriados
 * - Formatar e retornar respostas HTTP
 * - Tratar erros e códigos de status
 *
 * NÃO contém regras de negócio (ficam no service)
 */

const { validarEmailBasico } = require("../utils/utils");
const userServices = require("../services/userService");

class UserController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email.trim() || !senha.trim()) {
        return res.status(400).json({
          success: false,
          message: "Preencha todos os campos obrigatorios.",
        });
      }

      const { session, user } = await userServices.autenticarAdmin(
        email,
        senha
      );

      res.cookie("authToken", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        user: user,
        redirect: "/dashboard",
      });
    } catch (error) {
      if (error.name === "Forbidden") {
        return res.status(403).json({ success: false, message: error.message });
      }

      if (error.message.includes("Invalid login credential")) {
        return res
          .status(401)
          .json({ success: false, message: "Email ou senha inválidos." });
      }
      console.error("Erro no login:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
      });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        redirect: "/",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "erro no servidor",
      });
    }
  }

  // CONTROLLER CORRIGIDO

  async editar_dados(req, res) {
    try {
      const token = req.cookies.authToken;
      const { novoNome, novoEmail } = req.body;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token não fornecido",
        });
      }

      if (!novoNome && !novoEmail) {
        return res.status(400).json({
          success: false,
          message: "Nenhum dado (nome ou email) fornecido para atualização",
        });
      }

      if (
        (novoNome !== undefined && novoNome.trim() === "") ||
        (novoEmail !== undefined && novoEmail.trim() === "")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Nome ou E-mail não podem ser campos vazios se forem fornecidos.",
        });
      }

      await userServices.editar_dados(novoNome, novoEmail, token);

      return res.status(200).json({
        success: true,
        message: "Dados atualizados com sucesso",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Erro inesperado no servidor",
      });
    }
  }

  async solicitar_recuperacao_senha(req, res) {
    try {
      const { email } = req.body;

      if (!email || !validarEmailBasico(email)) {
        return res.status(400).json({
          success: false,
          message: "Por favor, forneça um e-mail válido.",
        });
      }

      await userServices.enviar_email_de_recuperacao_de_senha(email);

      return res.status(200).json({
        success: true,
        redirect: "/modificarSenha",
      });
    } catch (error) {
      console.error("Erro ao solicitar recuperação de senha:", error.message);

      return res.status(500).json({
        success: false,
        message:
          "Ocorreu um erro interno. Por favor, tente novamente mais tarde.",
      });
    }
  }

  async validar_e_trocar_senha(req, res) {
    try {
      const { email, token, novaSenha } = req.body;

      if (!email || !token || !novaSenha) {
        return res.tatus(400).json({
          success: false,
          message: "Todos os campos são obrigatorios",
        });
      }

      await userServices.mudarSenha(email, token, novaSenha);

      return res.status(200).json({
        success: true,
        message: "Senha redefinida com sucesso.",
      });
    } catch (error) {
      if (error.message.includes("Token inválido")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `erro ao redefinir senha: ${error}`,
      });
    }
  }
}

module.exports = new UserController();
