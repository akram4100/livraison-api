// firebase-stores-init.js - UPDATED VERSION
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, Timestamp } = require('firebase/firestore');

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2gSvCF-b2uAZM9j-EQAYs6UKjbRmuxrM",
  authDomain: "livraison-express-f48c3.firebaseapp.com",
  projectId: "livraison-express-f48c3",
  storageBucket: "livraison-express-f48c3.firebasestorage.app",
  messagingSenderId: "1077573560587",
  appId: "1:1077573560587:web:c1a1ffb4cd36f60d605a0e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase initialized");

// 🔧 وظيفة لإنشاء مجموعة المتاجر
const initializeStoresCollection = async () => {
  try {
    console.log("🏪 Starting stores collection initialization...");
    
    // 1. التحقق من وجود المجموعة وعدد المستندات
    const storesCollection = collection(db, "stores");
    const existingStores = await getDocs(storesCollection);
    
    console.log(`📊 Found ${existingStores.size} existing stores`);
    
    // 2. تنظيف المتاجر القديمة (اختياري - للإعداد الأولي فقط)
    if (existingStores.size > 0) {
      console.log("🧹 Cleaning old stores...");
      const deletePromises = [];
      existingStores.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deletePromises.length} old stores`);
    }
    
    // 3. إنشاء متاجر نموذجية
    const sampleStores = [
      {
        id: "store_001",
        name: "مطعم الندى",
        description: "أفضل المأكولات التقليدية",
        category: "restaurant",
        address: "شارع الرياض، حي النخيل",
        phone: "0551234567",
        email: "info@alnada.com",
        owner_id: "partner_001",
        owner_email: "partner1@example.com",
        status: "active",
        logo_url: "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=AL+NADA",
        banner_url: "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=مطعم+الندى",
        location: {
          lat: 36.752887,
          lng: 3.042048,
          address: "شارع الرياض، حي النخيل، الجزائر"
        },
        hours: {
          sunday: "09:00-23:00",
          monday: "09:00-23:00",
          tuesday: "09:00-23:00",
          wednesday: "09:00-23:00",
          thursday: "09:00-23:00",
          friday: "14:00-01:00",
          saturday: "09:00-23:00"
        },
        settings: {
          accepts_orders: true,
          delivery_enabled: true,
          pickup_enabled: true,
          delivery_fee: 200,
          min_order_amount: 1000,
          preparation_time: 30,
          payment_methods: ["cash", "card"]
        },
        stats: {
          total_orders: 156,
          total_revenue: 45000,
          average_rating: 4.5,
          total_reviews: 89,
          monthly_orders: 45
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: "store_002",
        name: "مقهى القهوة الذهبية",
        description: "قهوة عربية أصيلة ومشروبات ساخنة",
        category: "cafe",
        address: "حي السلام، عمارة 15",
        phone: "0557654321",
        email: "coffee@golden.com",
        owner_id: "partner_002",
        owner_email: "partner2@example.com",
        status: "active",
        logo_url: "https://via.placeholder.com/200/FFD166/FFFFFF?text=Golden+Cafe",
        banner_url: "https://via.placeholder.com/1200x400/06D6A0/FFFFFF?text=قهوة+ذهبية",
        location: {
          lat: 36.723456,
          lng: 3.156789,
          address: "حي السلام، عمارة 15، الجزائر"
        },
        hours: {
          sunday: "07:00-01:00",
          monday: "07:00-01:00",
          tuesday: "07:00-01:00",
          wednesday: "07:00-01:00",
          thursday: "07:00-01:00",
          friday: "08:00-02:00",
          saturday: "07:00-01:00"
        },
        settings: {
          accepts_orders: true,
          delivery_enabled: true,
          pickup_enabled: true,
          delivery_fee: 150,
          min_order_amount: 500,
          preparation_time: 15,
          payment_methods: ["cash", "card"]
        },
        stats: {
          total_orders: 89,
          total_revenue: 23500,
          average_rating: 4.8,
          total_reviews: 67,
          monthly_orders: 32
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      },
      {
        id: "store_003",
        name: "مخبز الأصالة",
        description: "خبز طازج وحلويات تقليدية",
        category: "bakery",
        address: "شارع الثورة، المركز التجاري",
        phone: "0551122334",
        email: "bakery@asala.com",
        owner_id: "partner_003",
        owner_email: "partner3@example.com",
        status: "active",
        logo_url: "https://via.placeholder.com/200/EF476F/FFFFFF?text=الأصالة",
        banner_url: "https://via.placeholder.com/1200x400/118AB2/FFFFFF?text=مخبز+الأصالة",
        location: {
          lat: 36.778456,
          lng: 3.098765,
          address: "شارع الثورة، المركز التجاري، الجزائر"
        },
        hours: {
          sunday: "06:00-22:00",
          monday: "06:00-22:00",
          tuesday: "06:00-22:00",
          wednesday: "06:00-22:00",
          thursday: "06:00-22:00",
          friday: "07:00-23:00",
          saturday: "06:00-22:00"
        },
        settings: {
          accepts_orders: true,
          delivery_enabled: true,
          pickup_enabled: true,
          delivery_fee: 100,
          min_order_amount: 300,
          preparation_time: 20,
          payment_methods: ["cash"]
        },
        stats: {
          total_orders: 234,
          total_revenue: 38900,
          average_rating: 4.3,
          total_reviews: 112,
          monthly_orders: 78
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      }
    ];
    
    // 4. حفظ المتاجر النموذجية
    console.log("📝 Creating sample stores...");
    const creationPromises = sampleStores.map(async (store) => {
      await setDoc(doc(db, "stores", store.id), store);
      console.log(`✅ Created store: ${store.name} (ID: ${store.id})`);
    });
    
    await Promise.all(creationPromises);
    
    // 5. التحقق من التأسيس
    const finalCheck = await getDocs(storesCollection);
    console.log(`\n🎉 SUCCESS! Stores collection initialized with ${finalCheck.size} stores`);
    
    // 6. عرض معلومات المتاجر
    console.log("\n📋 Sample stores created:");
    sampleStores.forEach(store => {
      console.log(`  - ${store.name} (${store.category}) - ${store.status}`);
    });
    
    return {
      success: true,
      totalStores: finalCheck.size,
      stores: sampleStores
    };
    
  } catch (error) {
    console.error("❌ Error initializing stores collection:", error.message);
    console.error("Stack trace:", error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

// 🔧 وظيفة مساعدة للتحقق من الهيكل
const verifyFirebaseConnection = async () => {
  try {
    console.log("🔍 Verifying Firebase connection...");
    
    // محاولة قراءة مجموعة
    const testCollection = collection(db, "test_connection");
    const testQuery = await getDocs(testCollection);
    
    console.log("✅ Firebase connection successful!");
    console.log(`📡 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🏪 Stores will be created in: /stores/`);
    
    return true;
  } catch (error) {
    console.error("❌ Firebase connection failed:", error.message);
    return false;
  }
};

// 🔧 الوظيفة الرئيسية
const main = async () => {
  console.log("🚀 Starting stores collection setup...");
  console.log("=".repeat(50));
  
  // 1. التحقق من الاتصال
  const connectionOk = await verifyFirebaseConnection();
  if (!connectionOk) {
    console.log("❌ Cannot proceed without Firebase connection");
    process.exit(1);
  }
  
  // 2. تهيئة المجموعة
  const result = await initializeStoresCollection();
  
  console.log("\n" + "=".repeat(50));
  if (result.success) {
    console.log("✨ SETUP COMPLETED SUCCESSFULLY!");
    console.log(`📊 Total stores created: ${result.totalStores}`);
    
    // 3. تعليمات الاستخدام
    console.log("\n📋 HOW TO USE:");
    console.log("1. Stores collection is now available at: /stores/");
    console.log("2. Sample store IDs: store_001, store_002, store_003");
    console.log("3. Access stores via:");
    console.log("   - API: /api/partner/stores?owner_email=partner@example.com");
    console.log("   - Direct Firestore: db.collection('stores').doc('store_001')");
    
    console.log("\n🔧 NEXT STEPS:");
    console.log("1. Add stores API endpoints to server-render.js");
    console.log("2. Update DashboardPartner.jsx to use real API");
    console.log("3. Test with: curl https://your-api.com/api/partner/stores");
  } else {
    console.log("❌ SETUP FAILED!");
    console.log(`Error: ${result.error}`);
  }
  
  console.log("\n" + "=".repeat(50));
};

// 🔧 تشغيل البرنامج
main().catch(error => {
  console.error("💥 Fatal error in main:", error);
  process.exit(1);
});