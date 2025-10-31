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

const express = require("express");
const path = require("path");
const middleware = require("../middleware/authMiddleware");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "public", "pages", "index.html")
  );
});

router.get("/esqueciSenha", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "public", "pages", "esqueci-senha.html")
  );
});

router.get(
  "/dashboard",
  middleware.verificar_autenticacao,
  middleware.verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "..", "public", "pages", "dashboard.html")
    );
  }
);

router.get("/modificarSenha", (req, res) =>{
    res.sendFile(path.join(__dirname, "..", "..", "public", "pages", "alterarSenha.html"))
})
  
router.get(
  "/gestao",
  middleware.verificar_autenticacao,
  middleware.verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "..", "public", "pages", "gestao.html")
    );
  }
);

router.get(
  "/usuario",
  middleware.verificar_autenticacao,
  middleware.verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "..", "public", "pages", "usuario.html")
    );
  }
);

router.get(
  "/configuracao",
  middleware.verificar_autenticacao,
  middleware.verificarAdmin,
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "..", "public", "pages", "configuracoes.html")
    );
  }
);

module.exports = router;
