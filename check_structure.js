const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getCollections() {
  const collections = await db.listCollections();
  console.log('=== Collections ===');
  collections.forEach(collection => {
    console.log('Collection:', collection.id);
  });
}

getCollections();
