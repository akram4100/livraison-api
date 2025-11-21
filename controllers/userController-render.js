// controllers/userController-render.js - CommonJS Version
const bcrypt = require("bcryptjs");
const { 
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
} = require("firebase/firestore");
const { db } = require("../server-render.js");
const { sendEmail } = require("../utils/emailService-render.js");

/* =========================================================================
   🔹 1. REGISTER USER (Step 1: Temporary Storage)
   ========================================================================= */
const registerUser = async (req, res) => {
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

    console.log(`✅ User registration pending for ${email}, code: ${verificationCode}`);
    
    res.status(200).json({ 
      message: "✅ Code de vérification envoyé à votre e-mail.",
      email: email,
      code: verificationCode // مؤقتاً للاختبار
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur." 
    });
  }
};

/* =========================================================================
   🔹 2. USER LOGIN
   ========================================================================= */
const loginUser = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    console.log("🔐 Login attempt for:", email);

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
      });
    }

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
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur." 
    });
  }
};

/* =========================================================================
   🔹 3. VERIFY EMAIL CODE
   ========================================================================= */
const verifyEmailCode = async (req, res) => {
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
    res.status(500).json({ 
      message: "❌ Erreur lors de la vérification." 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmailCode
};