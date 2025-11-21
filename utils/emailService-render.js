// utils/emailService-render.js - FIXED FOR RENDER
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 Starting email sending process...');
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('❌ Gmail settings incomplete');
    }

    console.log('✅ Settings verified for:', to);

    // 🔥 الحل: استخدام منفذ 465 مع SSL
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // 🔥 تغيير المنفذ إلى 465
      secure: true, // 🔥 استخدام SSL بدلاً من TLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      connectionTimeout: 30000,
      socketTimeout: 30000
    });

    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // محتوى الإيميل المبسط
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Livraison Express 🚚</h1>
        </div>
        <div style="padding: 20px; background: white;">
          <h2 style="color: #333;">Bonjour ${user_name}!</h2>
          <p>Votre code de vérification est:</p>
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #f8f9fa; border: 2px dashed #667eea; padding: 15px 30px; border-radius: 10px;">
              <span style="font-size: 24px; font-weight: bold; color: #667eea;">${otp_code}</span>
            </div>
          </div>
          <p>Ce code est valable pendant 10 minutes</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Livraison Express" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: `Bonjour ${user_name}! Votre code de vérification est: ${otp_code}`
    };

    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    return { 
      ok: true, 
      result,
      message: "Email sent successfully" 
    };

  } catch (error) {
    console.error('💥 Email sending error:', error.message);
    
    return { 
      ok: false, 
      error: "Email service unavailable - Using demo mode",
      detail: error.message
    };
  }
}

// 🔥 دالة جديدة: إرجاع كود التحقق مباشرة بدون إرسال إيميل
async function generateVerificationCode(to, subject, otp_code, user_name = "Utilisateur") {
  console.log('📧 Demo mode: Verification code generated (no email sent)');
  console.log(`📧 To: ${to}`);
  console.log(`📧 Code: ${otp_code}`);
  
  return { 
    ok: true, 
    message: "Code generated in demo mode",
    code: otp_code
  };
}

module.exports = { sendEmail, generateVerificationCode };