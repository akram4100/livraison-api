// 📁 controllers/loginController.js
import bcrypt from "bcryptjs";
import db from "../config/db.js";

export const loginUser = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    console.log("🔑 Tentative de connexion:", email);

    // 🔍 تحقق من وجود المستخدم في قاعدة البيانات
    const [rows] = await db.query("SELECT * FROM utilisateurs WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "❌ Utilisateur introuvable" });
    }

    const user = rows[0];

    // 🔒 تحقق من كلمة السر
    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ message: "❌ Mot de passe incorrect" });
    }

    // ✅ تسجيل الدخول ناجح
    console.log("✅ Connexion réussie pour:", user.nom);

    // يمكنك لاحقًا إضافة JWT هنا إن أردت
    res.status(200).json({
      message: "Connexion réussie ✅",
      nom: user.nom,
      role: user.role,
    });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    res.status(500).json({ message: "Erreur interne du serveur ❌" });
  }
};
