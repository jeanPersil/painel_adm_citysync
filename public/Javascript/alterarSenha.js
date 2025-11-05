import { mostrarNotificacao } from "./utils.js";

const form = document.getElementById("alterarSenhaForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  const email = sessionStorage.getItem("emailRecuperacao");
  const token = formData.get("token");
  const senha = formData.get("senha");
  const novaSenha = formData.get("confirmarSenha");

  if (!token) alert("Nenhum token foi fornecido.");

  if (senha != novaSenha) alert("As senhas inseridas não coincidem.");

  const response = await fetch(
    `http://localhost:3000/api/users/redefinir_senha`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, novaSenha }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    mostrarNotificacao(data.message, "erro");
    return;
  }
  alert("Senha alterada com sucesso");
  window.location.href = "/";
});
