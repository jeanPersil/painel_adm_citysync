import { mostrarNotificacao } from "./utils.js";

const botaoEnviar = document.getElementById("enviarInstrucoes");

async function enviar_email_de_recuperacao_de_senha(email) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/users/esqueceuSenha`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    window.location.href = data.redirect;
  } catch (error) {
    mostrarNotificacao(error.message, "erro");
    throw error;
  }
}

botaoEnviar.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  try {
    sessionStorage.setItem("emailRecuperacao", email);
    await enviar_email_de_recuperacao_de_senha(email);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
});
