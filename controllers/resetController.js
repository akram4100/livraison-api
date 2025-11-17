import bcrypt from "bcryptjs";
import db from "../config/db.js";

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM pending_verifications WHERE email = ? AND code_verification = ?",
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "❌ Code invalide ou expiré" });
    }

    res.status(200).json({ message: "✅ Code vérifié avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur ❌" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?", [
      hashed,
      email,
    ]);
    res.status(200).json({ message: "✅ Mot de passe mis à jour !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour ❌" });
  }
};
