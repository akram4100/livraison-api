// firebase-products-init.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

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

console.log("🔥 Firebase initialized for products");

// 🔧 دالة لإنشاء منتجات نموذجية للمتاجر
const initializeSampleProducts = async () => {
  try {
    console.log("🛒 Starting products initialization...");

    // المنتجات للمتاجر الثلاثة
    const storesProducts = {
      "store_001": [ // مطعم الندى
        {
          id: "product_001_001",
          name: "كشري مصري",
          description: "طبق كشري تقليدي مع صلصة الطماطم والبصل المقلي",
          price: 800,
          category: "أطباق رئيسية",
          image_url: "https://images.unsplash.com/photo-1563379091339-03246963d9d6?w=400&h=300&fit=crop",
          available: true,
          rating: 4.7,
          total_orders: 45,
          preparation_time: 15,
          ingredients: ["أرز", "عدس", "معكرونة", "صلصة طماطم", "بصل مقلي"]
        },
        {
          id: "product_001_002",
          name: "فلافل",
          description: "فلافل مقرمشة مع صلصة الطحينة والخضروات الطازجة",
          price: 500,
          category: "مقبلات",
          image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
          available: true,
          rating: 4.5,
          total_orders: 78,
          preparation_time: 10,
          ingredients: ["حمص", "بقدونس", "ثوم", "بهارات"]
        },
        {
          id: "product_001_003",
          name: "عصير برتقال طازج",
          description: "عصير برتقال طبيعي 100% مع قطع البرتقال",
          price: 400,
          category: "مشروبات",
          image_url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
          available: true,
          rating: 4.8,
          total_orders: 120,
          preparation_time: 5,
          ingredients: ["برتقال طازج"]
        }
      ],
      "store_002": [ // مقهى القهوة الذهبية
        {
          id: "product_002_001",
          name: "قهوة عربية",
          description: "قهوة عربية أصيلة مع هيل وقرنفل",
          price: 300,
          category: "مشروبات ساخنة",
          image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
          available: true,
          rating: 4.9,
          total_orders: 200,
          preparation_time: 8,
          ingredients: ["بن عربي", "هيل", "قرنفل"]
        },
        {
          id: "product_002_002",
          name: "شاي بالنعناع",
          description: "شاي أخضر مع أوراق النعناع الطازجة",
          price: 250,
          category: "مشروبات ساخنة",
          image_url: "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&h=300&fit=crop",
          available: true,
          rating: 4.6,
          total_orders: 150,
          preparation_time: 5,
          ingredients: ["شاي أخضر", "نعناع طازج", "سكر"]
        }
      ],
      "store_003": [ // مخبز الأصالة
        {
          id: "product_003_001",
          name: "خبز فرنسي",
          description: "خبز فرنسي طازج مقرمش من الخارج وطري من الداخل",
          price: 150,
          category: "خبز",
          image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
          available: true,
          rating: 4.4,
          total_orders: 300,
          preparation_time: 20,
          ingredients: ["طحين", "خميرة", "ماء", "ملح"]
        },
        {
          id: "product_003_002",
          name: "كرواسون",
          description: "كرواسون هش مع حشوة الشوكولاتة",
          price: 200,
          category: "حلويات",
          image_url: "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=400&h=300&fit=crop",
          available: true,
          rating: 4.7,
          total_orders: 180,
          preparation_time: 25,
          ingredients: ["عجينة كرواسون", "شوكولاتة", "زبدة"]
        }
      ]
    };

    // إنشاء المنتجات في subcollections
    for (const [storeId, products] of Object.entries(storesProducts)) {
      console.log(`📝 Creating products for store: ${storeId}`);
      
      for (const product of products) {
        const productData = {
          ...product,
          store_id: storeId,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        };
        
        await setDoc(doc(db, "stores", storeId, "products", product.id), productData);
        console.log(`✅ Created product: ${product.name} in store: ${storeId}`);
      }
    }

    console.log("\n🎉 SUCCESS! Products initialized for all stores");
    console.log("📊 Products per store:");
    Object.entries(storesProducts).forEach(([storeId, products]) => {
      console.log(`  - Store ${storeId}: ${products.length} products`);
    });

    return {
      success: true,
      totalProducts: Object.values(storesProducts).flat().length
    };

  } catch (error) {
    console.error("❌ Error initializing products:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// 🔧 الوظيفة الرئيسية
const main = async () => {
  console.log("🚀 Starting products setup...");
  console.log("=".repeat(50));
  
  // تهيئة المنتجات
  const result = await initializeSampleProducts();
  
  console.log("\n" + "=".repeat(50));
  if (result.success) {
    console.log("✨ PRODUCTS SETUP COMPLETED SUCCESSFULLY!");
    console.log(`📊 Total products created: ${result.totalProducts}`);
    
    console.log("\n📋 HOW TO USE:");
    console.log("1. Products are stored in subcollections: /stores/{storeId}/products");
    console.log("2. Access products via:");
    console.log("   - API: /api/stores/{storeId}/products");
    console.log("   - Direct Firestore: db.collection('stores').doc('store_001').collection('products')");
  } else {
    console.log("❌ PRODUCTS SETUP FAILED!");
    console.log(`Error: ${result.error}`);
  }
  
  console.log("\n" + "=".repeat(50));
};

// تشغيل البرنامج
main().catch(error => {
  console.error("💥 Fatal error in main:", error);
  process.exit(1);
});