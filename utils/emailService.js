// utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 بدء إرسال الإيميل عبر Gmail...');
    
    // التحقق من إعدادات Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('❌ إعدادات Gmail غير مكتملة في ملف .env');
    }

    console.log('✅ الإعدادات صحيحة:', {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject
    });

    // إنشاء Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // محتوى الإيميل (نفس تصميم القالب السابق)
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
          <div style="text-align: center; margin-top: 20px;">
            <div style="font-size: 48px;">📦</div>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          © 2024 Livraison Express. Tous droits réservés.
        </div>
      </div>
    `;

    // إعداد خيارات الإيميل
    const mailOptions = {
      from: `"Livraison Express" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    // إرسال الإيميل
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ الإيميل مرسل بنجاح عبر Gmail!', {
      messageId: result.messageId,
      response: result.response
    });

    return { 
      ok: true, 
      result,
      message: "تم إرسال الإيميل بنجاح" 
    };

  } catch (error) {
    console.error('💥 خطأ في إرسال الإيميل:', error);
    
    let errorMessage = "خطأ غير معروف في إرسال الإيميل";
    
    if (error.code === 'EAUTH') {
      errorMessage = "خطأ في مصادقة Gmail. تحقق من GMAIL_APP_PASSWORD في ملف .env";
    } else if (error.code === 'EENVELOPE') {
      errorMessage = "خطأ في عنوان الإيميل. تأكد من صحة الإيميل المدخل";
    } else {
      errorMessage = error.message;
    }
    
    return { 
      ok: false, 
      error: errorMessage,
      detail: error
    };
  }
}