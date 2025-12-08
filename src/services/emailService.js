/**
 * SERVICE - Serviço de envio de emails usando NodeMailer
 * 
 * INSTRUÇÕES:
 * 1. npm install nodemailer
 * 2. Configure o .env com suas credenciais SMTP
 */

import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.emailConfigurado = false;
    
    // Verifica se as credenciais SMTP estão configuradas
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        
        this.emailConfigurado = true;
        this.verificarConfiguracao();
      } catch (error) {
        console.error("❌ Erro ao criar transportador de email:", error.message);
        this.emailConfigurado = false;
      }
    } else {
      console.warn("⚠️  SMTP não configurado. Emails não serão enviados.");
      console.log("💡 Configure SMTP_USER e SMTP_PASS no arquivo .env");
    }
  }

  async verificarConfiguracao() {
    if (!this.emailConfigurado) return;
    
    try {
      await this.transporter.verify();
      console.log("✅ Servidor SMTP configurado e pronto para enviar emails");
    } catch (error) {
      console.error("❌ Erro na configuração SMTP:", error.message);
      this.emailConfigurado = false;
    }
  }

  obterTemplateEmail(status, reportId, endereco) {
    const templates = {
      "Em andamento": {
        assunto: `Report #${reportId} - Em Andamento 🔄`,
        mensagem: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fc;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Report Em Andamento</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">Olá,</p>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        <strong>Seu report foi revisado e a resolução está em andamento!</strong>
      </p>
      
      <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #92400e;">
          <strong>Report #${reportId}</strong><br>
          📍 Local: ${endereco}
        </p>
      </div>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        Nossa equipe está trabalhando para resolver o problema reportado. Você será notificado quando o status for atualizado.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
        © 2025 CitySync - Sistema de Gestão de Problemas Urbanos
      </p>
    </div>
  </div>
</body>
</html>
        `,
      },
      
      "Resolvido": {
        assunto: `Report #${reportId} - Resolvido ✅`,
        mensagem: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fc;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">✅ Report Resolvido</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">Olá,</p>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        <strong>Ótimas notícias! Seu report foi resolvido!</strong>
      </p>
      
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #065f46;">
          <strong>Report #${reportId}</strong><br>
          📍 Local: ${endereco}
        </p>
      </div>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        Por favor, <strong>verifique o local do report novamente</strong> para confirmar que o problema foi solucionado adequadamente.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
        © 2025 CitySync - Sistema de Gestão de Problemas Urbanos
      </p>
    </div>
  </div>
</body>
</html>
        `,
      },
      
      "Inválido": {
        assunto: `Report #${reportId} - Inválido ⚠️`,
        mensagem: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fc;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Report Inválido</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">Olá,</p>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        Infelizmente, seu report não pôde ser validado.
      </p>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; color: #991b1b;">
          <strong>Report #${reportId}</strong><br>
          📍 Local: ${endereco}
        </p>
      </div>
      
      <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
        <strong>Você não atendeu os requisitos para seu report ser validado.</strong> Por favor, envie novamente com as informações corretas:
      </p>
      
      <ul style="color: #2d3748; line-height: 1.8; margin: 20px 0;">
        <li>Descrição clara e detalhada do problema</li>
        <li>Localização precisa</li>
        <li>Categoria correta</li>
        <li>Fotos do problema (se possível)</li>
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #718096; text-align: center; margin: 0;">
        © 2025 CitySync - Sistema de Gestão de Problemas Urbanos
      </p>
    </div>
  </div>
</body>
</html>
        `,
      },
    };

    return templates[status] || null;
  }

  async enviarNotificacaoStatus(emailUsuario, status, reportId, endereco) {
    // Verifica se o email está configurado
    if (!this.emailConfigurado) {
      console.log("⚠️  SMTP não configurado. Email não será enviado.");
      console.log(`📧 Email que seria enviado para: ${emailUsuario}`);
      console.log(`📝 Status: ${status}`);
      console.log(`💡 Configure as variáveis SMTP no .env para enviar emails`);
      return { success: false, message: "SMTP não configurado" };
    }

    try {
      const template = this.obterTemplateEmail(status, reportId, endereco);

      if (!template) {
        console.log(`ℹ️  Status "${status}" não requer envio de email`);
        return { success: true, message: "Status não requer notificação" };
      }

      // Envia o email
      const info = await this.transporter.sendMail({
        from: `"CitySync" <${process.env.SMTP_USER}>`,
        to: emailUsuario,
        subject: template.assunto,
        html: template.mensagem,
      });

      console.log(`✅ Email enviado com sucesso para ${emailUsuario}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📋 Status: ${status}`);

      return {
        success: true,
        message: "Email enviado com sucesso",
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${emailUsuario}:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export default new EmailService();