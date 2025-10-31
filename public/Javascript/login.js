import { mostrarNotificacao } from "./utils.js"; // Importa a função de notificação
import { api } from "./api.js";

document.getElementById("ano").textContent = new Date().getFullYear();

// Função para verificar credenciais (simulação)
function verificarCredenciais(email, senha) {
  return email === "admin@gmail.com" && senha === "admin123";
}

function verificarCredenciaisSalvas() {
  const emailSalvo = localStorage.getItem("emailLembrado");
  const lembrarSalvo = localStorage.getItem("lembrarUsuario");

  if (emailSalvo && lembrarSalvo === "true") {
    document.getElementById("email").value = emailSalvo;
    document.getElementById("lembrar").checked = true;
  }
}

function toggleSenha() {
  const senhaInput = document.getElementById("senha");
  const icone = document.getElementById("iconeSenha");

  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    icone.classList.remove("fa-eye");
    icone.classList.add("fa-eye-slash");
  } else {
    senhaInput.type = "password";
    icone.classList.remove("fa-eye-slash");
    icone.classList.add("fa-eye");
  }
}

// Função para lidar com o envio do formulário
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const lembrar = document.getElementById("lembrar").checked;
  const botao = document.querySelector(".botao");

  if (!email || !senha) {
    mostrarNotificacao("Por favor, preencha todos os campos.", "erro");
    return;
  }

  botao.classList.add("carregando");
  botao.disabled = true;
  botao.innerHTML =
    '<span class="botao-loading"><i class="fas fa-spinner fa-spin"></i></span>';

  try {
    const result = await api.login(email, senha);

    if (!result.success) {
      mostrarNotificacao(result.error, "erro");
      return;
    }
    if (lembrar) {
      localStorage.setItem("emailLembrado", email);
      localStorage.setItem("lembrarUsuario", "true");
    } else {
      localStorage.removeItem("emailLembrado");
      localStorage.removeItem("lembrarUsuario");
    }

    mostrarNotificacao("Login bem-sucedido!", "sucesso");
    localStorage.setItem("user", JSON.stringify(result.data.user));
    window.location.href = result.data.redirect;
  } catch (error) {
    mostrarNotificacao(
      `Erro ao conectar ao servidor: ${error.message}`,
      "erro"
    );
  } finally {
    botao.classList.remove("carregando");
    botao.disabled = false;
    botao.innerHTML = "Entrar";
  }
}

// Adicionar efeitos de interação aos campos
function addFieldInteractions() {
  const campos = document.querySelectorAll(".campo input");

  campos.forEach((campo) => {
    campo.addEventListener("focus", function () {
      // A transformação translateY já é tratada pelo CSS :focus com box-shadow
      // this.parentElement.style.transform = 'translateY(-2px)';
      // this.parentElement.style.transition = 'transform 0.2s ease';
    });

    campo.addEventListener("blur", function () {
      // this.parentElement.style.transform = 'translateY(0)';
    });

    if (campo.type === "email") {
      campo.addEventListener("blur", function () {
        if (this.value && !this.validity.valid) {
          this.style.borderColor = "#ef4444";
        } else {
          this.style.borderColor = "var(--border-color, #cbd5e1)"; // Usa variável CSS
        }
      });
    }
  });
}

// Inicializar tudo quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function () {
  verificarCredenciaisSalvas();
  addFieldInteractions();
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  const toggleSenhaBtn = document.querySelector(".toggle-senha");
  if (toggleSenhaBtn) {
    toggleSenhaBtn.addEventListener("click", toggleSenha);
  }
});
