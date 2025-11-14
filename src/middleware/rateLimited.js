import rateLimit from "express-rate-limit";
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 200, 
  standardHeaders: true,
  legacyHeaders: false,



  skip: (req, res) => {
  
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
  statusCode: 423,
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
  statusCode: 423,
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