const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return JSON.stringify({
      success: false,
      message: "Muitas requisições deste IP. Tente novamente em 15 minutos.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador estrito especificamente para a rota de login.
 * Protege contra ataques de força bruta de senha.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return JSON.stringify({
      success: false,
      message: "Aguarde um momento, por favor.",
    });
  },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  recuperarSenhaLimit,
};
