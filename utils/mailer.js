import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to, code) => {
  try {
    await transporter.sendMail({
      from: `"Livraison Express" <no-reply@livraison.com>`,
      to,
      subject: "Vérification de votre e-mail 🚚",
      html: `
        <h2>Bonjour 👋</h2>
        <p>Voici votre code de vérification :</p>
        <div style="font-size:24px;font-weight:bold;background:#2563eb;color:white;display:inline-block;padding:10px 20px;border-radius:8px;">
          ${code}
        </div>
        <p>Ce code expirera dans 10 minutes.</p>
      `,
    });
    console.log("✅ E-mail envoyé à:", to);
  } catch (error) {
    console.error("❌ Erreur d'envoi d'e-mail:", error);
    throw error;
  }
};
