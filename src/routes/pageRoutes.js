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
import path from "path";
import middleware from "../middleware/authMiddleware.js";

const router = express.Router();
const { verificar_autenticacao, verificarAdmin } = middleware;

router.get("/", (req, res) => {
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "public", "pages", "index.html")
  );
});

router.get("/esqueciSenha", (req, res) => {
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "public", "pages", "esqueci-senha.html")
  );
});

router.get(
  "/dashboard",
  verificar_autenticacao,
  verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(import.meta.dirname, "..", "..", "public", "pages", "dashboard.html")
    );
  }
);

router.get("/modificarSenha", (req, res) => {
  res.sendFile(
    path.join(import.meta.dirname, "..", "..", "public", "pages", "alterarSenha.html")
  );
});

router.get(
  "/gestao",
  verificar_autenticacao,
  verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(import.meta.dirname, "..", "..", "public", "pages", "gestao.html")
    );
  }
);

router.get(
  "/usuario",
  verificar_autenticacao,
  verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(import.meta.dirname, "..", "..", "public", "pages", "usuario.html")
    );
  }
);

router.get(
  "/configuracao",
  verificar_autenticacao,
  verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(import.meta.dirname, "..", "..", "public", "pages", "configuracoes.html")
    );
  }
);

export default router;