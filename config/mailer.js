import emailjs from "@emailjs/browser";
import dotenv from "dotenv";
dotenv.config();

export const sendVerificationEmail = async (to, name, code) => {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        name: name,
        verification_code: code,
      },
      { publicKey: process.env.EMAILJS_PUBLIC_KEY }
    );
    console.log("✅ Verification email sent via EmailJS");
  } catch (error) {
    console.error("❌ EmailJS sending error:", error);
    throw error;
  }
};
