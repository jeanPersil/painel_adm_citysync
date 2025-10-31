const botaoEnviar = document.getElementById("enviarInstrucoes");

async function enviar_email_de_recuperacao_de_senha(email) {
    const response = await fetch(`http://localhost:3000/api/users/esqueceuSenha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message);
    }

    // Redireciona corretamente
    window.location.href = data.redirect;
}

botaoEnviar.addEventListener("click", async (e) => {
    e.preventDefault();

  
    const email = document.getElementById("email").value.trim();

    try {
        await enviar_email_de_recuperacao_de_senha(email);
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        alert(error.message || "Erro ao enviar email de recuperação.");
    }
});
