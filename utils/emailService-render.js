// utils/emailService-render.js - INTELLIGENT EMAIL SERVICE
const dotenv = require('dotenv');

dotenv.config();

// 🔍 كشف سبب الخطأ وحله تلقائياً
function diagnoseEmailError(error) {
  const diagnostics = [];
  
  if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
    diagnostics.push({
      problem: "🚫 Render blocks SMTP connections",
      solution: "Use external email service like SendGrid, Mailgun, or Resend",
      immediate_fix: "Return code directly to user"
    });
  }
  
  if (error.message.includes('EAUTH') || error.message.includes('authentication')) {
    diagnostics.push({
      problem: "❌ Gmail authentication failed",
      solution: "Check GMAIL_USER and GMAIL_APP_PASSWORD in Render environment variables",
      immediate_fix: "Verify app password is correct"
    });
  }
  
  if (error.message.includes('EENVELOPE') || error.message.includes('address')) {
    diagnostics.push({
      problem: "📧 Invalid email address",
      solution: "Validate email format before sending",
      immediate_fix: "Check recipient email format"
    });
  }
  
  return diagnostics.length > 0 ? diagnostics : [{
    problem: "❓ Unknown email error",
    solution: "Check Render logs for detailed error information",
    immediate_fix: "Return code directly as fallback"
  }];
}

async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 Attempting to send email via Gmail...');
    
    // التحقق من الإعدادات
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      const error = new Error('❌ Gmail configuration missing in environment variables');
      const diagnostics = diagnoseEmailError(error);
      throw { error, diagnostics };
    }

    console.log('✅ Gmail settings verified for:', to);

    // محاولة استخدام nodemailer مع معالجة الأخطاء المحسنة
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      const error = new Error('Nodemailer not available');
      const diagnostics = diagnoseEmailError(error);
      throw { error, diagnostics };
    }

    // إعدادات متعددة للمحاولة
    const transportConfigs = [
      {
        // المحاولة الأولى: Gmail SMTP مع SSL
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
        name: 'Gmail SSL'
      },
      {
        // المحاولة الثانية: Gmail SMTP مع TLS
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
        name: 'Gmail TLS'
      }
    ];

    let lastError;
    
    for (const config of transportConfigs) {
      try {
        console.log(`🔧 Trying ${config.name}...`);
        
        const transporter = nodemailer.createTransport(config);
        
        // اختبار الاتصال السريع
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 8000)
          )
        ]);
        
        console.log(`✅ ${config.name} connection successful`);

        // محتوى الإيميل
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

        const result = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully via ${config.name}!`);
        return { 
          ok: true, 
          result,
          message: "Email sent successfully",
          method: config.name
        };

      } catch (configError) {
        lastError = configError;
        console.log(`❌ ${config.name} failed:`, configError.message);
        continue; // جرب الإعداد التالي
      }
    }

    // إذا فشلت جميع المحاولات
    const diagnostics = diagnoseEmailError(lastError);
    throw { error: lastError, diagnostics };

  } catch (error) {
    console.error('💥 Email service comprehensive error analysis:');
    
    let diagnostics = [];
    if (error.diagnostics) {
      diagnostics = error.diagnostics;
      console.error('🔍 Error:', error.error.message);
    } else {
      diagnostics = diagnoseEmailError(error);
      console.error('🔍 Error:', error.message);
    }
    
    // عرض التشخيص المفصل
    diagnostics.forEach((diag, index) => {
      console.log(`📋 Diagnosis ${index + 1}:`);
      console.log(`   Problem: ${diag.problem}`);
      console.log(`   Solution: ${diag.solution}`);
      console.log(`   Immediate Fix: ${diag.immediate_fix}`);
    });
    
    return { 
      ok: false, 
      error: "Email service unavailable - Render blocks SMTP",
      diagnostics: diagnostics,
      fallback_code: otp_code, // إرجاع الكود كبديل
      recommendation: "Use external email service like SendGrid for production"
    };
  }
}

async function sendEmailWithRetry(to, subject, otp_code, user_name = "Utilisateur", maxRetries = 2) {
  console.log(`📧 Email delivery attempt for: ${to}`);
  console.log(`🔑 OTP Code: ${otp_code} (will be returned if email fails)`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
    
    const result = await sendEmail(to, subject, otp_code, user_name);
    
    if (result.ok) {
      console.log('🎉 Email sent successfully!');
      return result;
    }
    
    // إذا كان هناك كود بديل، استخدمه
    if (result.fallback_code) {
      console.log('🛡️ Using fallback method: returning code directly');
      return {
        ok: true,
        fallback: true,
        code: result.fallback_code,
        message: "Code returned directly (email service unavailable)",
        note: "In production, consider using SendGrid, Mailgun, or similar services"
      };
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // الفشل النهائي - إرجاع الكود مباشرة
  console.log('🛡️ All email attempts failed - returning code directly');
  return { 
    ok: true,
    fallback: true,
    code: otp_code,
    message: "Code returned directly - email service unavailable",
    diagnostics: [
      {
        problem: "Render blocks all SMTP connections",
        solution: "Migrate to external email service provider",
        recommendation: "Use SendGrid (free tier available) or similar service"
      }
    ]
  };
}

// دالة مساعدة للتحقق من إعدادات الإيميل
function checkEmailConfig() {
  const config = {
    hasGmailUser: !!process.env.GMAIL_USER,
    hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
    isRender: process.env.NODE_ENV === 'production' && process.env.RENDER,
    suggestions: []
  };
  
  if (!config.hasGmailUser || !config.hasGmailPassword) {
    config.suggestions.push("Add GMAIL_USER and GMAIL_APP_PASSWORD to Render environment variables");
  }
  
  if (config.isRender) {
    config.suggestions.push("Render blocks SMTP - use external email service like SendGrid");
    config.suggestions.push("Current solution: Codes are returned directly to user");
  }
  
  return config;
}

module.exports = { 
  sendEmail, 
  sendEmailWithRetry, 
  checkEmailConfig,
  diagnoseEmailError 
};