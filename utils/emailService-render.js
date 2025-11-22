// utils/emailService-render.js - CommonJS Version
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 بدء إرسال الإيميل عبر Gmail...');
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('❌ إعدادات Gmail غير مكتملة');
    }

    console.log('✅ الإعدادات صحيحة لـ:', to);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      connectionTimeout: 30000,
      socketTimeout: 30000
    });

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Livraison Express 🚚</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Vérification de votre compte</p>
        </div>
        <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">مرحباً ${user_name}!</h2>
          <p style="color: #666; text-align: center; font-size: 16px;">رمز التحقق الخاص بك هو:</p>
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #f8f9fa; border: 2px dashed #667eea; padding: 15px 30px; border-radius: 10px;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp_code}</span>
            </div>
          </div>
          <p style="color: #666; text-align: center; font-size: 14px;">هذا الكود صالح لمدة <strong>10 دقائق</strong></p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Livraison Express" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    console.log('🔍 التحقق من اتصال SMTP...');
    await transporter.verify();
    console.log('✅ اتصال SMTP ناجح');

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ الإيميل مرسل بنجاح!');
    return { 
      ok: true, 
      result,
      message: "تم إرسال الإيميل بنجاح" 
    };

  } catch (error) {
    console.error('💥 خطأ في إرسال الإيميل:', error.message);
    return { 
      ok: false, 
      error: error.message
    };
  }
}

async function sendEmailWithRetry(to, subject, otp_code, user_name = "Utilisateur", maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 محاولة إرسال ${attempt}/${maxRetries}`);
    const result = await sendEmail(to, subject, otp_code, user_name);
    
    if (result.ok) {
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`🔄 إعادة المحاولة بعد 5 ثواني...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return { 
    ok: false, 
    error: "فشلت جميع محاولات إرسال الإيميل"
  };
}

module.exports = { sendEmail, sendEmailWithRetry };