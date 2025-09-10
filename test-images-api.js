const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkByaW1jb25zZWlsLmZyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzQ2NTA3OTMsImV4cCI6MTc0MDY1MDc5M30.FPPCpWLyLzFVLg5SQfUwKYPIEp5MQAj1u8Yfp9H1234'; // Remplacez par un vrai token

console.log('🧪 Test du système d\'images - Articles & Actualités\n');

// Fonction utilitaire pour les logs
function logStep(step, description) {
  console.log(`\n📋 ${step}: ${description}`);
  console.log('='.repeat(50));
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error) {
  console.log(`❌ ${message}`);
  if (error.response) {
    console.log(`   Status: ${error.response.status}`);
    console.log(`   Message: ${error.response.data.message || error.response.data}`);
  } else {
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Vérifier que le serveur répond
async function testServerHealth() {
  logStep('TEST 1', 'Vérification de l\'état du serveur');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/articles`);
    logSuccess(`Serveur accessible - ${response.status}`);
    logSuccess(`Articles récupérés: ${response.data.length}`);
    return true;
  } catch (error) {
    logError('Serveur inaccessible', error);
    return false;
  }
}

// Test 2: Créer un article sans images
async function testCreateArticleWithoutImages() {
  logStep('TEST 2', 'Création d\'un article sans images');
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Article de test sans images');
  formData.append('text_preview', 'Ceci est un aperçu de test');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { type: 'paragraph', text: 'Contenu de test pour l\'article sans images.' }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'API']));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess(`Article créé - ID: ${response.data.data.id}`);
    logSuccess(`img_path: ${response.data.data.img_path || 'null'}`);
    logSuccess(`cover_img_path: ${response.data.data.cover_img_path || 'null'}`);
    
    return response.data.data.id;
  } catch (error) {
    logError('Échec création article sans images', error);
    return null;
  }
}

// Test 3: Créer un article avec image principale seulement
async function testCreateArticleWithMainImage() {
  logStep('TEST 3', 'Création d\'un article avec image principale');
  
  // Créer un fichier image de test simple (pixel blanc 1x1)
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  if (!fs.existsSync(testImagePath)) {
    // Créer une image de test minimale (header JPEG basique)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
  }
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Article de test avec image principale');
  formData.append('text_preview', 'Ceci est un aperçu de test avec image');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { type: 'paragraph', text: 'Contenu de test pour l\'article avec image principale.' }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Images']));
  formData.append('image', fs.createReadStream(testImagePath), {
    filename: 'test-image.jpg',
    contentType: 'image/jpeg'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess(`Article créé - ID: ${response.data.data.id}`);
    logSuccess(`img_path: ${response.data.data.img_path}`);
    logSuccess(`cover_img_path: ${response.data.data.cover_img_path || 'null'}`);
    
    return response.data.data.id;
  } catch (error) {
    logError('Échec création article avec image principale', error);
    return null;
  }
}

// Test 4: Créer un article avec les deux types d'images
async function testCreateArticleWithBothImages() {
  logStep('TEST 4', 'Création d\'un article avec image principale + couverture');
  
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const testCoverPath = path.join(__dirname, 'test-cover.jpg');
  
  // Créer les images de test si nécessaire
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
  ]);
  
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, jpegHeader);
  }
  if (!fs.existsSync(testCoverPath)) {
    fs.writeFileSync(testCoverPath, jpegHeader);
  }
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Article de test avec les deux images');
  formData.append('text_preview', 'Ceci est un aperçu de test avec deux images');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { type: 'paragraph', text: 'Contenu de test pour l\'article avec les deux types d\'images.' }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Images', 'Complet']));
  formData.append('image', fs.createReadStream(testImagePath), {
    filename: 'test-main.jpg',
    contentType: 'image/jpeg'
  });
  formData.append('coverImage', fs.createReadStream(testCoverPath), {
    filename: 'test-cover.jpg',
    contentType: 'image/jpeg'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess(`Article créé - ID: ${response.data.data.id}`);
    logSuccess(`img_path: ${response.data.data.img_path}`);
    logSuccess(`cover_img_path: ${response.data.data.cover_img_path}`);
    
    return response.data.data.id;
  } catch (error) {
    logError('Échec création article avec deux images', error);
    return null;
  }
}

// Test 5: Mise à jour d'un article (suppression d'image)
async function testUpdateArticle(articleId) {
  logStep('TEST 5', `Mise à jour de l'article ${articleId} - Suppression image de couverture`);
  
  if (!articleId) {
    logError('Pas d\'ID d\'article pour le test de mise à jour', new Error('Article ID manquant'));
    return false;
  }
  
  const formData = new FormData();
  formData.append('titre', 'Article mis à jour - sans couverture');
  formData.append('cover_img_path', ''); // Suppression de l'image de couverture
  
  try {
    const response = await axios.patch(`${BASE_URL}/api/articles/${articleId}`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess(`Article mis à jour - ID: ${response.data.data.id}`);
    logSuccess(`img_path: ${response.data.data.img_path}`);
    logSuccess(`cover_img_path: ${response.data.data.cover_img_path || 'null (supprimée)'}`);
    
    return true;
  } catch (error) {
    logError('Échec mise à jour article', error);
    return false;
  }
}

// Test 6: Test avec les actualités
async function testCreateActu() {
  logStep('TEST 6', 'Test de création d\'actualité avec images');
  
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Actualité de test avec image');
  formData.append('text_preview', 'Aperçu de l\'actualité de test');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { type: 'paragraph', text: 'Contenu de test pour l\'actualité.' }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Actualités']));
  formData.append('coverImage', fs.createReadStream(testImagePath), {
    filename: 'test-actu-cover.jpg',
    contentType: 'image/jpeg'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/actus`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess(`Actualité créée - ID: ${response.data.data.id}`);
    logSuccess(`img_path: ${response.data.data.img_path || 'null'}`);
    logSuccess(`cover_img_path: ${response.data.data.cover_img_path}`);
    
    return response.data.data.id;
  } catch (error) {
    logError('Échec création actualité', error);
    return null;
  }
}

// Test 7: Test d'erreur (fichier invalide)
async function testInvalidFileType() {
  logStep('TEST 7', 'Test d\'erreur - Type de fichier invalide');
  
  // Créer un fichier texte
  const testTextPath = path.join(__dirname, 'test-invalid.txt');
  fs.writeFileSync(testTextPath, 'Ceci est un fichier texte, pas une image');
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Test fichier invalide');
  formData.append('text_preview', 'Test');
  formData.append('content_json', JSON.stringify({ blocks: [] }));
  formData.append('image', fs.createReadStream(testTextPath), {
    filename: 'test-invalid.txt',
    contentType: 'text/plain'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    logError('Le test devrait échouer mais a réussi', new Error('Test invalide'));
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Erreur 400 correctement détectée pour fichier invalide');
      logSuccess(`Message: ${error.response.data.message}`);
      return true;
    } else {
      logError('Erreur inattendue', error);
      return false;
    }
  } finally {
    // Nettoyer le fichier de test
    if (fs.existsSync(testTextPath)) {
      fs.unlinkSync(testTextPath);
    }
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests du système d\'images\n');
  
  let results = {
    total: 7,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Santé du serveur
  const serverOk = await testServerHealth();
  if (serverOk) results.passed++; else results.failed++;
  
  if (!serverOk) {
    console.log('\n❌ Serveur inaccessible - Arrêt des tests');
    return;
  }
  
  // Test 2: Article sans images
  const articleId1 = await testCreateArticleWithoutImages();
  if (articleId1) results.passed++; else results.failed++;
  
  // Test 3: Article avec image principale
  const articleId2 = await testCreateArticleWithMainImage();
  if (articleId2) results.passed++; else results.failed++;
  
  // Test 4: Article avec les deux images
  const articleId3 = await testCreateArticleWithBothImages();
  if (articleId3) results.passed++; else results.failed++;
  
  // Test 5: Mise à jour article
  const updateOk = await testUpdateArticle(articleId3);
  if (updateOk) results.passed++; else results.failed++;
  
  // Test 6: Actualité
  const actuId = await testCreateActu();
  if (actuId) results.passed++; else results.failed++;
  
  // Test 7: Erreur fichier invalide
  const errorOk = await testInvalidFileType();
  if (errorOk) results.passed++; else results.failed++;
  
  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${results.passed}/${results.total}`);
  console.log(`❌ Tests échoués: ${results.failed}/${results.total}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! Le système d\'images fonctionne correctement.');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
  
  // Nettoyer les fichiers de test
  const testFiles = ['test-image.jpg', 'test-cover.jpg'];
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Fichier de test supprimé: ${file}`);
    }
  });
}

// Lancer les tests
runTests().catch(console.error); 