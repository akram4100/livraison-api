// test-gmail.js
import { sendEmail } from "./utils/emailService.js";

async function testGmail() {
  console.log('🧪 اختبار إرسال الإيميل عبر Gmail...');
  
  const result = await sendEmail(
    "akramaxpo@gmail.com",
    "🔐 اختبار Gmail - Livraison Express",
    "999999",
    "Akram Test"
  );
  
  console.log('📊 النتيجة:', result);
}

testGmail();