// utils/emailService-emailjs.js - EmailJS Version
const dotenv = require('dotenv');

dotenv.config();

async function sendEmailWithEmailJS(to, subject, otp_code, user_name = "Utilisateur") {
  try {
    console.log('🚀 Starting EmailJS service...');
    
    // التحقق من إعدادات EmailJS
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      throw new Error('❌ EmailJS configuration missing in environment variables');
    }

    console.log('✅ EmailJS settings verified for:', to);

    // استخدام EmailJS عبر fetch API
    const emailjsData = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        subject: subject,
        otp_code: otp_code,
        user_name: user_name,
        app_name: "Livraison Express"
      }
    };

    console.log('📤 Sending email via EmailJS API...');
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailjsData)
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via EmailJS!');
      return {
        ok: true,
        message: "Email sent successfully via EmailJS",
        method: "EmailJS API"
      };
    } else {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('💥 EmailJS error:', error.message);
    return {
      ok: false,
      error: error.message,
      fallback_code: otp_code
    };
  }
}

// دالة رئيسية مع fallback
async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  console.log(`📧 EmailJS delivery attempt for: ${to}`);
  
  // المحاولة مع EmailJS أولاً
  const emailjsResult = await sendEmailWithEmailJS(to, subject, otp_code, user_name);
  
  if (emailjsResult.ok) {
    return emailjsResult;
  }
  
  // إذا فشل EmailJS، نستخدم fallback
  console.log('🛡️ EmailJS failed, using fallback method');
  return {
    ok: true,
    fallback: true,
    code: otp_code,
    message: "Code returned directly - EmailJS service unavailable",
    note: "Check EmailJS configuration in Render environment variables"
  };
}

async function sendEmailWithRetry(to, subject, otp_code, user_name = "Utilisateur", maxRetries = 1) {
  console.log(`📧 Email delivery attempt for: ${to}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 Attempt ${attempt}/${maxRetries} with EmailJS`);
    
    const result = await sendEmail(to, subject, otp_code, user_name);
    
    if (result.ok && !result.fallback) {
      console.log('🎉 Email sent successfully via EmailJS!');
      return result;
    }
    
    if (result.ok && result.fallback) {
      console.log('🛡️ Using fallback method: returning code directly');
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting 2 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // الفشل النهائي
  console.log('🛡️ All email attempts failed - returning code directly');
  return { 
    ok: true,
    fallback: true,
    code: otp_code,
    message: "Code returned directly - all email services unavailable"
  };
}

module.exports = { 
  sendEmail, 
  sendEmailWithRetry,
  sendEmailWithEmailJS
};