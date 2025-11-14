import rateLimit from "express-rate-limit";
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,

  // --- ADICIONE ISTO AQUI ---
  // Se retornar true, o limitador ignora a requisição (deixa passar)
  skip: (req, res) => {
    // 1. Libera a própria página de bloqueio para não dar loop
    if (req.url.includes('/pages/bloqueado.html')) return true;
    
    return false;
  },
  // ---------------------------

  handler: (req, res, next, options) => {
    if (req.accepts('html')) {
       return res.redirect('/pages/bloqueado.html');
    }
    res.status(options.statusCode).json({
      success: false,
      message: "Muitas requisições. Aguarde.",
      redirectUrl: "/pages/bloqueado.html"
    });
  }
});

/**
 * Limitador estrito especificamente para a rota de login.
 * Protege contra ataques de força bruta de senha.
 */
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return JSON.stringify({
      success: false,
      message:
        "Muitas tentativas de login. Por favor, aguarde e tente novamente mais tarde.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const recuperarSenhaLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return JSON.stringify({
      success: false,
      message: "Aguarde um momento, por favor.",
    });
  },
});

export {
  globalLimiter,
  loginLimiter,
  recuperarSenhaLimit,
};