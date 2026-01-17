// server-render-cors-fix.js
// هذا السكريبت يضيف CORS بشكل صحيح قبل الـ Routes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server-render.js');
let content = fs.readFileSync(filePath, 'utf8');

// ابحث عن مكان إضافة CORS
const searchText = 'const app = express();';
const corsCode = `const app = express();

// ==============================================
// 🛡️ CORS CONFIGURATION - قبل الـ Routes
// ==============================================

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.status(200).send();
});

app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(\`📥 \${req.method} \${req.path}\`);
  next();
});`;

// ابحث عن CORS الموجود وأزله (إذا كان موجود)
content = content.replace(/\/\/ =+\n\/\/ 🛡️ CORS[\s\S]*?next\(\);\n}\);/g, '');
content = content.replace(/app\.options\(\'\*\'[\s\S]*?next\(\);\n}\);/g, '');
content = content.replace(/app\.use\(cors\(\{[\s\S]*?\}\)\);/g, '');

// ابحث عن app.use(express.json()) وأزله
content = content.replace(/app\.use\(express\.json\(\)\);/g, '');
content = content.replace(/app\.use\(express\.urlencoded\(\{ extended: true \}\)\);/g, '');
content = content.replace(/app\.use\(\(req, res, next\) => \{\s*console\.log\(\`📥/g, 'REPLACE_MARKER');

// استبدل
content = content.replace(searchText, corsCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ تم إضافة CORS بشكل صحيح!');
