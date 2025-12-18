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
import middleware from "../middleware/authMiddleware.js";
import reportsController from "../controller/reports_controller.js";

const router = express.Router();
//const { verificar_autenticacao, verificarAdmin } = middleware;

//router.use(verificar_autenticacao, verificarAdmin);

// Rotas de leitura
router.get("/periodo", reportsController.obterReportesPorPeriodo);
router.get("/filtrados", reportsController.listarEfiltrar);

// Rotas de edição e exclusão
router.put("/editar/:id", reportsController.editarReport);
router.delete("/deletar/:id", reportsController.deletarReport);

export default router;
