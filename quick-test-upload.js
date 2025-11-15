const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

// Fonction pour obtenir un token valide
async function getToken() {
  try {
    console.log('🔑 Tentative de connexion...');
    const response = await axios.post(`${BASE_URL}/api/login`, {
      email: 'admin@rimconseil.fr',
      password: 'Admin2024!'
    });
    console.log('✅ Token obtenu avec succès');
    return response.data.token;
  } catch (error) {
    console.log('❌ Échec de connexion, tentative de création d\'utilisateur...');
    // Si l'utilisateur n'existe pas, essayer de le créer
    try {
      await axios.post(`${BASE_URL}/api/register`, {
        email: 'admin@rimconseil.fr',
        password: 'Admin2024!'
      });
      console.log('✅ Utilisateur créé');
      // Retry login
      const retryResponse = await axios.post(`${BASE_URL}/api/login`, {
        email: 'admin@rimconseil.fr',
        password: 'Admin2024!'
      });
      return retryResponse.data.token;
    } catch (err) {
      console.error('❌ Impossible d\'obtenir un token:', err.message);
      return null;
    }
  }
}

// Test simple de création d'article avec image
async function testUpload() {
  console.log('🧪 TEST RAPIDE - Upload d\'images\n');
  console.log('='.repeat(50));
  
  // 1. Obtenir un token
  const token = await getToken();
  if (!token) {
    console.log('❌ Impossible de continuer sans token');
    return;
  }
  
  // 2. Créer une image de test (1x1 pixel JPEG minimal)
  console.log('\n📷 Création d\'une image de test...');
  const testImagePath = path.join(__dirname, 'test-upload.jpg');
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
    0x3F, 0x00, 0x7F, 0xFF, 0xD9
  ]);
  fs.writeFileSync(testImagePath, jpegHeader);
  const fileSize = fs.statSync(testImagePath).size;
  console.log(`✅ Image créée: ${fileSize} bytes`);
  
  // 3. Test sans images
  console.log('\n📋 TEST 1: Création d\'article SANS images');
  console.log('-'.repeat(50));
  try {
    const formData = new FormData();
    formData.append('date', new Date().toISOString());
    formData.append('titre', 'Test sans images - ' + Date.now());
    formData.append('text_preview', 'Aperçu de test');
    formData.append('content_json', JSON.stringify({
      metadata: { type: "articles" },
      blocks: { "text_1": { type: "paragraph", content: "Test", order: 0 } }
    }));
    formData.append('category', JSON.stringify(['Test']));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé sans images');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   img_path: ${response.data.data.img_path || 'null'}`);
    console.log(`   cover_img_path: ${response.data.data.cover_img_path || 'null'}`);
  } catch (error) {
    console.log('❌ Échec:', error.response?.data?.message || error.message);
  }
  
  // 4. Test avec image principale
  console.log('\n📋 TEST 2: Création d\'article AVEC image principale');
  console.log('-'.repeat(50));
  try {
    const formData = new FormData();
    formData.append('date', new Date().toISOString());
    formData.append('titre', 'Test avec image principale - ' + Date.now());
    formData.append('text_preview', 'Aperçu de test avec image');
    formData.append('content_json', JSON.stringify({
      metadata: { type: "articles" },
      blocks: { "text_1": { type: "paragraph", content: "Test image", order: 0 } }
    }));
    formData.append('category', JSON.stringify(['Test']));
    formData.append('image', fs.createReadStream(testImagePath));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé avec image principale');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   img_path: ${response.data.data.img_path}`);
    console.log(`   cover_img_path: ${response.data.data.cover_img_path || 'null'}`);
    
    // Vérifier que le fichier existe
    const imagePath = response.data.data.img_path;
    if (imagePath) {
      const fullPath = path.join(__dirname, imagePath);
      const exists = fs.existsSync(fullPath);
      console.log(`   Fichier existe sur disque: ${exists ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Échec:', error.response?.data?.message || error.message);
  }
  
  // 5. Test avec les deux images
  console.log('\n📋 TEST 3: Création d\'article AVEC les DEUX images');
  console.log('-'.repeat(50));
  try {
    const formData = new FormData();
    formData.append('date', new Date().toISOString());
    formData.append('titre', 'Test avec deux images - ' + Date.now());
    formData.append('text_preview', 'Aperçu de test avec deux images');
    formData.append('content_json', JSON.stringify({
      metadata: { type: "articles" },
      blocks: { "text_1": { type: "paragraph", content: "Test 2 images", order: 0 } }
    }));
    formData.append('category', JSON.stringify(['Test']));
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('coverImage', fs.createReadStream(testImagePath));
    
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé avec les deux images');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   img_path: ${response.data.data.img_path}`);
    console.log(`   cover_img_path: ${response.data.data.cover_img_path}`);
    
    // Vérifier que les fichiers existent
    if (response.data.data.img_path) {
      const fullPath = path.join(__dirname, response.data.data.img_path);
      console.log(`   Image principale existe: ${fs.existsSync(fullPath) ? '✅' : '❌'}`);
    }
    if (response.data.data.cover_img_path) {
      const fullPath = path.join(__dirname, response.data.data.cover_img_path);
      console.log(`   Image de couverture existe: ${fs.existsSync(fullPath) ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Échec:', error.response?.data?.message || error.message);
  }
  
  // 6. Vérifier le dossier uploads
  console.log('\n📁 Contenu du dossier uploads:');
  console.log('-'.repeat(50));
  const uploadsPath = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    console.log(`📊 Nombre de fichiers: ${files.length}`);
    files.forEach((file, i) => {
      const stats = fs.statSync(path.join(uploadsPath, file));
      console.log(`   ${i + 1}. ${file} (${stats.size} bytes)`);
    });
  } else {
    console.log('❌ Dossier uploads non trouvé');
  }
  
  // Nettoyer
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  
  console.log('\n✅ Tests terminés!');
  console.log('='.repeat(50));
}

// Exécuter les tests
testUpload().catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
