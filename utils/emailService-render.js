// utils/emailService-render.js - UPDATED WITH BETTER SETTINGS
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 Starting email sending process...');
    
    // التحقق من إعدادات Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('❌ Gmail settings incomplete in .env file');
    }

    console.log('✅ Settings verified:', {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject
    });

    // 🔥 إعدادات محسنة مع timeout أطول
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // استخدام STARTTLS
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      connectionTimeout: 60000, // 60 ثانية
      socketTimeout: 60000,
      greetingTimeout: 30000,
      logger: true, // تسجيل التفاصيل
      debug: true   // وضع التصحيح
    });

    // تحقق من الاتصال أولاً
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

    // إعداد خيارات الإيميل
    const mailOptions = {
      from: `"Livraison Express" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      // إضافة نص عادي كبديل
      text: `Bonjour ${user_name}! Votre code de vérification est: ${otp_code}`
    };

    console.log('📤 Sending email...');
    
    // إرسال الإيميل مع timeout منفصل
    const result = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 45000)
      )
    ]);
    
    console.log('✅ Email sent successfully!', {
      messageId: result.messageId,
      response: result.response
    });

    return { 
      ok: true, 
      result,
      message: "Email sent successfully" 
    };

  } catch (error) {
    console.error('💥 Email sending error:', error);
    
    let errorMessage = "Unknown email error";
    
    if (error.code === 'EAUTH') {
      errorMessage = "Gmail authentication error. Check GMAIL_APP_PASSWORD";
    } else if (error.code === 'EENVELOPE') {
      errorMessage = "Invalid email address";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Email timeout - Gmail server is slow to respond";
    } else {
      errorMessage = error.message;
    }
    
    return { 
      ok: false, 
      error: errorMessage,
      detail: error.toString()
    };
  }
}

// دالة مساعدة مع retry
async function sendEmailWithRetry(to, subject, otp_code, user_name = "Utilisateur", maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 Email attempt ${attempt}/${maxRetries}`);
    const result = await sendEmail(to, subject, otp_code, user_name);
    
    if (result.ok) {
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`🔄 Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return { ok: false, error: "All email attempts failed" };
}

module.exports = { sendEmail, sendEmailWithRetry };