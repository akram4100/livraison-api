// controllers/userController.js
import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { sendEmail } from "../utils/emailService.js";

/* =========================================================================
   🔹 1. Enregistrement d'un nouvel utilisateur (étape 1 : temporaire)
   ========================================================================= */
export const registerUser = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;
    console.log("📥 Données reçues pour inscription:", req.body);

    // الحصول على الاتصال من Promise
    const connection = await db;

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await connection.query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "❌ Cet e-mail est déjà utilisé." });

    // Vérifier s'il y a déjà une vérification en attente
    const [pending] = await connection.query("SELECT * FROM pending_verifications WHERE email = ?", [email]);
    if (pending.length > 0)
      return res.status(400).json({ message: "⚠️ Un code a déjà été envoyé à cet e-mail." });

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Générer un code OTP à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // expire dans 10 min

    // Sauvegarder dans la table temporaire
    await connection.query(
      "INSERT INTO pending_verifications (nom, email, mot_de_passe, role, code_verification, expiration) VALUES (?, ?, ?, ?, ?, ?)",
      [nom, email, hashedPassword, role, verificationCode, expiration]
    );

    // Envoi du mail
    const userName = nom || "Utilisateur";
    await sendEmail(
      email,
      "Code de vérification - Livraison Express",
      verificationCode,
      userName
    );

    console.log(`✅ Code envoyé à ${email}: ${verificationCode}`);
    res.status(200).json({ message: "✅ Code envoyé à votre e-mail." });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

/* =========================================================================
   🔹 2. Vérification du code reçu (activation du compte)
   ========================================================================= */
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log("📩 Vérification du code pour:", email);

    const connection = await db;

    // Recherche du code dans la table temporaire
    const [pending] = await connection.query(
      "SELECT * FROM pending_verifications WHERE email = ? AND code_verification = ? AND expiration > NOW()",
      [email, code]
    );

    if (pending.length === 0)
      return res.status(400).json({ message: "❌ Code invalide ou expiré." });

    const user = pending[0];

    // Déplacer l'utilisateur dans la table principale
    await connection.query(
      "INSERT INTO utilisateurs (nom, email, mot_de_passe, role, verifie) VALUES (?, ?, ?, ?, 1)",
      [user.nom, user.email, user.mot_de_passe, user.role]
    );

    // Supprimer de la table temporaire
    await connection.query("DELETE FROM pending_verifications WHERE email = ?", [email]);

    console.log("✅ Email vérifié et utilisateur activé.");
    res.status(200).json({ message: "✅ Email vérifié avec succès !" });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du code:", error);
    res.status(500).json({ message: "Erreur serveur lors de la vérification." });
  }
};

/* =========================================================================
   🔹 3. Connexion utilisateur (login)
   ========================================================================= */
export const loginUser = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    const connection = await db;
    const [rows] = await connection.query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "❌ Utilisateur introuvable." });

    const user = rows[0];

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch)
      return res.status(401).json({ message: "❌ Mot de passe incorrect." });

    if (!user.verifie)
      return res.status(403).json({ message: "⚠️ Compte non vérifié." });

    console.log("✅ Connexion réussie pour:", user.email);
    res.status(200).json({
      message: "✅ Connexion réussie.",
      user: { id: user.id, nom: user.nom, role: user.role, email: user.email },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

/* =========================================================================
   🔹 4. Mot de passe oublié (envoi du code OTP)
   ========================================================================= */
export const sendPasswordResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📩 Requête de réinitialisation pour:", email);

    const connection = await db;

    // ✅ البحث في قاعدة البيانات والحصول على الاسم
    const [userRows] = await connection.query("SELECT nom, email FROM utilisateurs WHERE email = ?", [email]);
    
    if (userRows.length === 0) {
      console.log("❌ Utilisateur non trouvé dans la base de données");
      return res.status(404).json({ message: "❌ Utilisateur introuvable." });
    }

    const user = userRows[0];
    console.log("👤 Utilisateur trouvé dans la base:", user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Mise à jour du code OTP dans la base
    await connection.query(
      "UPDATE utilisateurs SET reset_code = ?, reset_expires = ? WHERE email = ?",
      [otp, expiration, email]
    );

    console.log(`🧾 Code OTP pour ${email}: ${otp} (expire à ${expiration})`);

    // ✅ استخدام الاسم من قاعدة البيانات مع قيمة افتراضية
    const userName = user.nom || "Utilisateur";
    console.log("👤 Nom utilisé pour l'email:", userName);

    // Envoi d'email via EmailJS
    await sendEmail(
      email,
      "Code de réinitialisation du mot de passe - Livraison Express",
      otp,
      userName
    );

    console.log("✅ Email envoyé avec nom:", userName);
    res.status(200).json({ message: "✅ Code envoyé avec succès." });
  } catch (error) {
    console.error("❌ Erreur dans sendPasswordResetCode:", error);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi du code." });
  }
};

/* =========================================================================
   🔹 5. Vérification du code OTP de réinitialisation
   ========================================================================= */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log("📩 Vérification du code pour:", email);

    const connection = await db;
    const [rows] = await connection.query(
      "SELECT * FROM utilisateurs WHERE email = ? AND reset_code = ? AND reset_expires > NOW()",
      [email, code]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: "❌ Code invalide ou expiré." });

    res.status(200).json({ message: "✅ Code vérifié avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du code:", error);
    res.status(500).json({ message: "Erreur serveur lors de la vérification." });
  }
};

/* =========================================================================
   🔹 6. Réinitialisation finale du mot de passe
   ========================================================================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, nouveauMotDePasse } = req.body;

    const connection = await db;
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    await connection.query(
      "UPDATE utilisateurs SET mot_de_passe = ?, reset_code = NULL, reset_expires = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    console.log("✅ Mot de passe réinitialisé pour:", email);
    res.status(200).json({ message: "✅ Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error);
    res.status(500).json({ message: "Erreur serveur lors de la réinitialisation." });
  }
};