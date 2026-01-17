// script-add-test-stores.js
// شغل هذا السكريبت بـ: node script-add-test-stores.js

const dotenv = require('dotenv');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');

dotenv.config();

async function addTestStores() {
  try {
    console.log('🔥 جاري تهيئة Firebase...');
    
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    const existingApps = getApps();
    let firebaseApp;
    
    if (existingApps.length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = existingApps[0];
    }
    
    const db = getFirestore(firebaseApp);
    console.log('✅ Firebase متصل');

    // متاجر تجريبية
    const testStores = [
      {
        name: 'مطعم الندى',
        category: 'restaurant',
        description: 'أفضل المأكولات التقليدية والعربية',
        address: 'شارع الرياض، حي النخيل',
        phone: '0551234567',
        logo_url: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=الندى',
        banner_url: 'https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=مطعم+الندى',
        rating: 4.7,
        total_reviews: 89,
        status: 'active',
        delivery_fee: 200,
        min_order: 1000,
        preparation_time: 30,
        open: true,
        hours: '09:00 - 23:00',
      },
      {
        name: 'مقهى القهوة الذهبية',
        category: 'cafe',
        description: 'قهوة عربية أصيلة ومشروبات ساخنة',
        address: 'حي السلام، عمارة 15',
        phone: '0557654321',
        logo_url: 'https://via.placeholder.com/150/FFD166/FFFFFF?text=القهوة',
        banner_url: 'https://via.placeholder.com/400x200/FFD166/FFFFFF?text=القهوة+الذهبية',
        rating: 4.8,
        total_reviews: 67,
        status: 'active',
        delivery_fee: 150,
        min_order: 500,
        preparation_time: 15,
        open: true,
        hours: '08:00 - 22:00',
      },
      {
        name: 'مخبز الأصالة',
        category: 'bakery',
        description: 'خبز طازج يومياً وحلويات تقليدية',
        address: 'حي الثورة، شارع الاستقلال',
        phone: '0558901234',
        logo_url: 'https://via.placeholder.com/150/F4A460/FFFFFF?text=الخبز',
        banner_url: 'https://via.placeholder.com/400x200/F4A460/FFFFFF?text=مخبز+الأصالة',
        rating: 4.5,
        total_reviews: 112,
        status: 'active',
        delivery_fee: 100,
        min_order: 300,
        preparation_time: 10,
        open: true,
        hours: '06:00 - 20:00',
      },
      {
        name: 'بقالة السوق',
        category: 'grocery',
        description: 'خضروات وفواكه طازجة يومياً',
        address: 'حي الأمل، شارع 20',
        phone: '0555567890',
        logo_url: 'https://via.placeholder.com/150/06D6A0/FFFFFF?text=الفواكه',
        banner_url: 'https://via.placeholder.com/400x200/06D6A0/FFFFFF?text=الفواكه+الطازجة',
        rating: 4.6,
        total_reviews: 45,
        status: 'active',
        delivery_fee: 75,
        min_order: 250,
        preparation_time: 10,
        open: true,
        hours: '08:00 - 20:00',
      },
      {
        name: 'محل الشاي والأعشاب',
        category: 'tea',
        description: 'أجود أنواع الشاي والأعشاب الطبيعية',
        address: 'حي النرجس، عمارة 8',
        phone: '0556789012',
        logo_url: 'https://via.placeholder.com/150/118AB2/FFFFFF?text=الشاي',
        banner_url: 'https://via.placeholder.com/400x200/118AB2/FFFFFF?text=الشاي+والأعشاب',
        rating: 4.9,
        total_reviews: 78,
        status: 'active',
        delivery_fee: 120,
        min_order: 400,
        preparation_time: 12,
        open: true,
        hours: '09:00 - 21:00',
      },
      {
        name: 'مطبخ الصحة والعافية',
        category: 'healthy',
        description: 'طعام صحي وخالي من الدهون',
        address: 'حي الحرية، شارع الرياضة',
        phone: '0557890123',
        logo_url: 'https://via.placeholder.com/150/06FFA5/FFFFFF?text=الصحة',
        banner_url: 'https://via.placeholder.com/400x200/06FFA5/FFFFFF?text=الصحة+والعافية',
        rating: 4.4,
        total_reviews: 56,
        status: 'active',
        delivery_fee: 180,
        min_order: 800,
        preparation_time: 25,
        open: true,
        hours: '10:00 - 22:00',
      },
    ];

    console.log(`🏪 جاري إضافة ${testStores.length} متاجر تجريبية...`);

    for (const store of testStores) {
      const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'stores', storeId), store);
      console.log(`  ✅ تم إضافة: ${store.name}`);
    }

    console.log(`\n✅✅ تم إضافة ${testStores.length} متاجر بنجاح!`);
    console.log('\n🚀 جرّب الآن:');
    console.log('   http://localhost:3000 -> انقر على "المتاجر"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

addTestStores();
