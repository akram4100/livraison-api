// controllers/userController.js - Firebase Version FIXED
import bcrypt from "bcryptjs";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "../server.js"; // ✅ تم التصحيح - من server.js بدلاً من firebase-config.js
import { sendEmail } from "../utils/emailService.js";

/* =========================================================================
   🔹 1. REGISTER USER (Step 1: Temporary Storage)
   ========================================================================= */
export const registerUser = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;
    console.log("📥 Registration request received:", { nom, email, role });

    // Validate required fields
    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ 
        message: "❌ Tous les champs sont obligatoires." 
      });
    }

    // Check if user already exists in main collection
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    if (userDoc.exists()) {
      return res.status(400).json({ 
        message: "❌ Cet e-mail est déjà utilisé." 
      });
    }

    // Check for existing pending verification
    const pendingQuery = query(
      collection(db, "pending_verifications"), 
      where("email", "==", email)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    if (!pendingSnapshot.empty) {
      // Delete existing pending verification
      const deletePromises = pendingSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Generate OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

    // Save to pending_verifications
    const pendingId = `pending_${Date.now()}`;
    await setDoc(doc(db, "pending_verifications", pendingId), {
      nom,
      email,
      mot_de_passe: hashedPassword,
      role,
      code_verification: verificationCode,
      date_creation: Timestamp.now(),
      expiration
    });

    // Send email
    const emailResult = await sendEmail(
      email,
      "Code de vérification - Livraison Express",
      verificationCode,
      nom
    );

    if (!emailResult.ok) {
      console.error("❌ Email sending failed:", emailResult.error);
      return res.status(500).json({ 
        message: "❌ Erreur lors de l'envoi de l'email." 
      });
    }

    console.log(`✅ Verification code sent to ${email}: ${verificationCode}`);
    res.status(200).json({ 
      message: "✅ Code de vérification envoyé à votre e-mail.",
      email: email
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    
    // ✅ معالجة أخطاء Firebase المحددة
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    if (error.code === 'permission-denied') {
      return res.status(500).json({ 
        message: "❌ Problème de permissions. Vérifiez les règles Firebase." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur." 
    });
  }
};

/* =========================================================================
   🔹 2. VERIFY EMAIL CODE (Account Activation)
   ========================================================================= */
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log("📩 Email verification request:", { email, code });

    if (!email || !code) {
      return res.status(400).json({ 
        message: "❌ Email et code sont requis." 
      });
    }

    // Find pending verification
    const pendingQuery = query(
      collection(db, "pending_verifications"), 
      where("email", "==", email),
      where("code_verification", "==", code)
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);

    if (pendingSnapshot.empty) {
      return res.status(400).json({ 
        message: "❌ Code invalide ou expiré." 
      });
    }

    const pendingData = pendingSnapshot.docs[0].data();
    const pendingRef = pendingSnapshot.docs[0].ref;

    // Check expiration
    if (pendingData.expiration.toDate() < new Date()) {
      await deleteDoc(pendingRef);
      return res.status(400).json({ 
        message: "❌ Code expiré." 
      });
    }

    // Create user in main collection
    await setDoc(doc(db, "utilisateurs", email), {
      nom: pendingData.nom,
      email: pendingData.email,
      mot_de_passe: pendingData.mot_de_passe,
      role: pendingData.role,
      verified: true,
      date_creation: Timestamp.now(),
      reset_code: null,
      reset_expires: null,
      telephone: "",
      ville: ""
    });

    // Delete pending verification
    await deleteDoc(pendingRef);

    console.log(`✅ User ${email} verified and activated`);
    res.status(200).json({ 
      message: "✅ Email vérifié avec succès !",
      user: {
        nom: pendingData.nom,
        email: pendingData.email,
        role: pendingData.role
      }
    });

  } catch (error) {
    console.error("❌ Email verification error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de la vérification." 
    });
  }
};

/* =========================================================================
   🔹 3. USER LOGIN - FIXED VERSION
   ========================================================================= */
export const loginUser = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    console.log("🔐 Login attempt for:", email);

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
      });
    }

    // ✅ الطريقة الصحيحة للقراءة من Firestore
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "❌ Mot de passe incorrect." 
      });
    }

    // Check if account is verified
    if (!user.verified) {
      return res.status(403).json({ 
        message: "⚠️ Compte non vérifié. Veuillez vérifier votre email." 
      });
    }

    console.log(`✅ Login successful for: ${email}`);
    res.status(200).json({
      message: "✅ Connexion réussie.",
      user: {
        id: userDoc.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        ville: user.ville || "",
        telephone: user.telephone || ""
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    
    // ✅ معالجة أفضل للأخطاء
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    if (error.code === 'permission-denied') {
      return res.status(500).json({ 
        message: "❌ Problème de permissions. Vérifiez les règles Firebase." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur." 
    });
  }
};

/* =========================================================================
   🔹 4. FORGOT PASSWORD (Send Reset Code)
   ========================================================================= */
export const sendPasswordResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📧 Password reset request for:", email);

    if (!email) {
      return res.status(400).json({ 
        message: "❌ Email est requis." 
      });
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      console.log("❌ User not found:", email);
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();
    const userName = user.nom || "Utilisateur";

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

    // Update user with reset code
    await updateDoc(doc(db, "utilisateurs", email), {
      reset_code: otp,
      reset_expires: expiration
    });

    console.log(`🔐 Reset OTP for ${email}: ${otp}`);

    // Send email
    const emailResult = await sendEmail(
      email,
      "Code de réinitialisation - Livraison Express",
      otp,
      userName
    );

    if (!emailResult.ok) {
      console.error("❌ Reset email failed:", emailResult.error);
      return res.status(500).json({ 
        message: "❌ Erreur lors de l'envoi du code." 
      });
    }

    console.log(`✅ Reset code sent to ${email}`);
    res.status(200).json({ 
      message: "✅ Code de réinitialisation envoyé avec succès.",
      email: email
    });

  } catch (error) {
    console.error("❌ Password reset request error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de l'envoi du code." 
    });
  }
};

// ... باقي الدوال بنفس النمط (verifyResetCode, resetPassword, etc.) ...

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log("🔍 Verifying reset code for:", email);

    if (!email || !code) {
      return res.status(400).json({ 
        message: "❌ Email et code sont requis." 
      });
    }

    // Get user
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();

    // Check reset code and expiration
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ 
        message: "❌ Code de réinitialisation invalide." 
      });
    }

    if (user.reset_expires.toDate() < new Date()) {
      return res.status(400).json({ 
        message: "❌ Code de réinitialisation expiré." 
      });
    }

    console.log(`✅ Reset code verified for: ${email}`);
    res.status(200).json({ 
      message: "✅ Code vérifié avec succès.",
      email: email
    });

  } catch (error) {
    console.error("❌ Reset code verification error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de la vérification." 
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, nouveauMotDePasse } = req.body;
    console.log("🔄 Password reset final step for:", email);

    if (!email || !nouveauMotDePasse) {
      return res.status(400).json({ 
        message: "❌ Email et nouveau mot de passe sont requis." 
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ 
        message: "❌ Le mot de passe doit contenir au moins 6 caractères." 
      });
    }

    // Get user to verify existence
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    // Update password and clear reset fields
    await updateDoc(doc(db, "utilisateurs", email), {
      mot_de_passe: hashedPassword,
      reset_code: null,
      reset_expires: null
    });

    console.log(`✅ Password reset successfully for: ${email}`);
    res.status(200).json({ 
      message: "✅ Mot de passe réinitialisé avec succès." 
    });

  } catch (error) {
    console.error("❌ Password reset error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de la réinitialisation." 
    });
  }
};
/* =========================================================================
   🔹 7. GET USER PROFILE (ADDED)
   ========================================================================= */
export const getUserProfile = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("👤 Profile request for:", email);

    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();
    
    // Remove sensitive data
    const { mot_de_passe, reset_code, reset_expires, ...userProfile } = user;

    res.status(200).json({
      message: "✅ Profil utilisateur récupéré.",
      user: userProfile
    });

  } catch (error) {
    console.error("❌ Get profile error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de la récupération du profil." 
    });
  }
};

/* =========================================================================
   🔹 8. UPDATE USER PROFILE (ADDED)
   ========================================================================= */
export const updateUserProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const { nom, telephone, ville } = req.body;
    console.log("✏️ Profile update for:", email);

    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const updateData = {};
    if (nom) updateData.nom = nom;
    if (telephone) updateData.telephone = telephone;
    if (ville) updateData.ville = ville;

    await updateDoc(doc(db, "utilisateurs", email), updateData);

    console.log(`✅ Profile updated for: ${email}`);
    res.status(200).json({ 
      message: "✅ Profil mis à jour avec succès." 
    });

  } catch (error) {
    console.error("❌ Profile update error:", error);
    
    if (error.code === 'unavailable') {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible. Réessayez plus tard." 
      });
    }
    
    res.status(500).json({ 
      message: "❌ Erreur lors de la mise à jour du profil." 
    });
  }
};