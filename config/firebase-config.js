// config/firebase-config.js - FIXED VERSION
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// ✅ FIX: منع تكرار تهيئة Firebase
let app;
let db;

try {
    const existingApps = getApps();
    
    if (existingApps.length > 0) {
        app = existingApps[0];
        console.log('✅ Using existing Firebase app');
    } else {
        app = initializeApp(firebaseConfig);
        console.log('✅ New Firebase app initialized');
    }
    
    db = getFirestore(app);
    console.log('📡 Firebase Firestore connected from config');
    
} catch (error) {
    console.error('💥 Firebase config initialization failed:', error.message);
    throw error;
}

export { db };
export default db;