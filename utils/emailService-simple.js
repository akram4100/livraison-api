// utils/emailService-simple.js - SIMPLE SOLUTION
const dotenv = require('dotenv');

dotenv.config();

async function sendVerificationCode(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('📧 SIMPLE EMAIL SERVICE - Generating code');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Code: ${otp_code}`);
    console.log(`📧 Name: ${user_name}`);
    
    // في الإنتاج الحقيقي، هنا نستخدم خدمة إيميل مثل:
    // - SendGrid
    // - Mailgun  
    // - Resend
    // - Amazon SES
    
    // لكن حالياً نعيد الكود مباشرة للعميل
    return { 
      ok: true,
      code: otp_code,
      message: "Verification code generated successfully",
      note: "In production, this code would be sent via email"
    };

  } catch (error) {
    console.error('💥 Email service error:', error);
    return { 
      ok: false, 
      error: "Email service temporary unavailable"
    };
  }
}

module.exports = { sendVerificationCode };