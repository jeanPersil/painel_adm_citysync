/**
 * ROUTES - Camada de definição de rotas e middlewares
 *
 * Responsabilidades:
 * - Definir endpoints da aplicação e seus métodos HTTP
 * - Aplicar middlewares de autenticação/autorização
 * - Servir arquivos estáticos (HTML, CSS, JS)
 * - Mapear URLs para controllers/actions específicos
 * - Gerenciar proteção de rotas com verificações de acesso
 *
 * NÃO contém lógica de negócio (service)
 * NÃO processa requisições diretamente (controller)
 */

import express from "express";
import userController from "../controller/user_controller.js";
import { loginLimiter, recuperarSenhaLimit } from "../middleware/rateLimited.js";

const router = express.Router();

router.post("/login", loginLimiter, userController.login);
router.post("/logout", userController.logout);
router.post(
  "/esqueceuSenha",
  recuperarSenhaLimit,
  userController.solicitar_recuperacao_senha
);

router.post("/redefinir_senha", userController.validar_e_trocar_senha);

router.put("/atualizar_dados", userController.editar_dados);

export default router;