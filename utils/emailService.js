// utils/emailService.js
import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";

dotenv.config();

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

function checkEnv() {
  const missing = [];
  if (!SERVICE_ID) missing.push("EMAILJS_SERVICE_ID");
  if (!TEMPLATE_ID) missing.push("EMAILJS_TEMPLATE_ID");
  if (!PUBLIC_KEY) missing.push("EMAILJS_PUBLIC_KEY");
  if (!PRIVATE_KEY) missing.push("EMAILJS_PRIVATE_KEY");
  return missing;
}

/**
 * sendEmail
 * إرسال بريد مع تسجيل مفصّل لمساعدة تصحيح الأخطاء.
 * يعيد كائن مفصل مع status/logs.
 */
export async function sendEmail(to, subject, otp_code, user_name = "Utilisateur") {
  const logs = [];
  try {
    logs.push("🔎 Starting sendEmail...");
    
    // 1) تحقق من المتغيرات البيئية
    const missing = checkEnv();
    if (missing.length > 0) {
      const msg = `❌ Missing EmailJS env vars: ${missing.join(", ")}`;
      logs.push(msg);
      console.error(msg);
      return { ok: false, error: msg, logs };
    }

    // 2) تحضير payload للـ template - شامل لكل المتغيرات
    const templateParams = {
      to_email: to,
      subject: subject,
      name: user_name,                    // للمتغير {{name}} في القالب
      user_name: user_name,               // للمتغير {{user_name}} في القالب
      username: user_name,                // للمتغير {{username}} في القالب
      code: String(otp_code),             // للمتغير {{code}} في القالب
      otp_code: String(otp_code),         // للمتغير {{otp_code}} في القالب
      code_otp: String(otp_code),         // للمتغير {{code_otp}} في القالب
    };

    // 🔍 DEBUG: طباعة البيانات المرسلة
    console.log("📨 DEBUG - Email Data Being Sent:");
    console.log("📧 To:", to);
    console.log("📝 Subject:", subject);
    console.log("🔢 OTP Code:", otp_code);
    console.log("👤 User Name:", user_name);
    console.log("🎯 Template Params:", templateParams);

    logs.push("📨 Prepared templateParams:");
    logs.push(JSON.stringify(templateParams));

    // 3) طباعة بيانات الاتصال (بدون مفاتيح حساسة كاملة)
    logs.push(`🔧 Using SERVICE_ID=${SERVICE_ID}, TEMPLATE_ID=${TEMPLATE_ID}`);
    logs.push(`🔧 PUBLIC_KEY=${PUBLIC_KEY ? PUBLIC_KEY.slice(0,4) + "..." : "undefined"}`);
    logs.push(`🔧 PRIVATE_KEY=${PRIVATE_KEY ? PRIVATE_KEY.slice(0,4) + "..." : "undefined"}`);

    // 4) فعلياً استدعاء EmailJS
    logs.push("⏳ Calling emailjs.send(...)");
    let response;
    try {
      response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        {
          publicKey: PUBLIC_KEY,
          privateKey: PRIVATE_KEY,
        }
      );
    } catch (sendErr) {
      logs.push("❌ emailjs.send threw an exception");
      logs.push(String(sendErr));
      console.error("❌ EmailJS Send Error:", sendErr);
      if (sendErr && sendErr.response) {
        try {
          logs.push("sendErr.response (raw): " + JSON.stringify(sendErr.response));
        } catch (e) {}
      }
      return { ok: false, error: "emailjs_send_exception", detail: sendErr, logs };
    }

    // 5) response قد يكون EmailJSResponseStatus أو ما شابه
    logs.push("✅ emailjs.send returned:");
    try {
      logs.push(JSON.stringify(response));
    } catch (e) {
      logs.push(String(response));
    }

    // 6) فحص حالة الرد
    const status = response && response.status ? response.status : null;
    const text = response && response.text ? response.text : null;

    console.log("✅ EmailJS Response Status:", status);
    console.log("✅ EmailJS Response Text:", text);

    if (status === 200 || status === "200" || text === "OK") {
      logs.push("🎉 EmailJS reports success");
      console.log("🎉 Email sent successfully!");
      return { ok: true, response, logs };
    } else {
      logs.push("⚠️ EmailJS returned non-200 status or unknown response");
      console.log("⚠️ EmailJS returned unexpected response");
      return { ok: false, response, logs };
    }
  } catch (error) {
    logs.push("💥 Unexpected error in sendEmail: " + String(error));
    console.error("💥 Unexpected error in sendEmail:", error);
    return { ok: false, error: "unexpected_error", detail: error, logs };
  }
}