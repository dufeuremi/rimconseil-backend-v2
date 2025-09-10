const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:4000';
const IMAGE_PATH = 'C:\\Users\\remid\\Desktop\\test.png';

console.log('🧪 Test API avec image réelle: test.png\n');

// Fonction pour obtenir un token valide
async function getAuthToken() {
  try {
    // Essayer de se connecter avec l'utilisateur admin
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'admin@rimconseil.fr',
      password: 'admin123'
    });
    
    console.log('✅ Connexion réussie');
    return loginResponse.data.token;
  } catch (error) {
    console.log('❌ Échec de connexion avec admin@rimconseil.fr');
    
    // Essayer de créer un utilisateur de test
    try {
      await axios.post(`${BASE_URL}/api/users`, {
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      console.log('✅ Utilisateur de test créé et connecté');
      return loginResponse.data.token;
    } catch (createError) {
      console.error('❌ Impossible de créer un utilisateur ou de se connecter');
      return null;
    }
  }
}

// Test avec image principale seulement
async function testWithMainImage(token) {
  console.log('\n📋 TEST 1: Création d\'article avec image principale (test.png)');
  console.log('='.repeat(60));
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Test avec image réelle - Principal');
  formData.append('text_preview', 'Article de test utilisant test.png comme image principale');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { 
        type: 'paragraph', 
        text: 'Cet article utilise l\'image test.png du bureau comme image principale.' 
      },
      {
        type: 'paragraph',
        text: 'Le système devrait automatiquement traiter et stocker l\'image dans le dossier uploads.'
      }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Images', 'Réel']));
  
  // Ajouter l'image depuis le bureau
  formData.append('image', fs.createReadStream(IMAGE_PATH), {
    filename: 'test.png',
    contentType: 'image/png'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé avec succès!');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Titre: ${response.data.data.titre}`);
    console.log(`   Image principale: ${response.data.data.img_path}`);
    console.log(`   Image de couverture: ${response.data.data.cover_img_path || 'null'}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return null;
  }
}

// Test avec image de couverture seulement
async function testWithCoverImage(token) {
  console.log('\n📋 TEST 2: Création d\'article avec image de couverture (test.png)');
  console.log('='.repeat(60));
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Test avec image réelle - Couverture');
  formData.append('text_preview', 'Article de test utilisant test.png comme image de couverture');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { 
        type: 'paragraph', 
        text: 'Cet article utilise l\'image test.png du bureau comme image de couverture.' 
      }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Couverture']));
  
  // Ajouter l'image comme image de couverture
  formData.append('coverImage', fs.createReadStream(IMAGE_PATH), {
    filename: 'test-cover.png',
    contentType: 'image/png'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé avec succès!');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Titre: ${response.data.data.titre}`);
    console.log(`   Image principale: ${response.data.data.img_path || 'null'}`);
    console.log(`   Image de couverture: ${response.data.data.cover_img_path}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return null;
  }
}

// Test avec les deux images (utilise la même image pour les deux)
async function testWithBothImages(token) {
  console.log('\n📋 TEST 3: Création d\'article avec les deux images (test.png x2)');
  console.log('='.repeat(60));
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Test avec image réelle - Complet');
  formData.append('text_preview', 'Article de test utilisant test.png pour les deux types d\'images');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { 
        type: 'paragraph', 
        text: 'Cet article utilise test.png pour les deux types d\'images.' 
      },
      {
        type: 'paragraph',
        text: 'Image principale ET image de couverture utilisent le même fichier source.'
      }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Complet', 'Double']));
  
  // Ajouter la même image pour les deux champs
  formData.append('image', fs.createReadStream(IMAGE_PATH), {
    filename: 'test-main.png',
    contentType: 'image/png'
  });
  formData.append('coverImage', fs.createReadStream(IMAGE_PATH), {
    filename: 'test-cover.png',
    contentType: 'image/png'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/articles`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Article créé avec succès!');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Titre: ${response.data.data.titre}`);
    console.log(`   Image principale: ${response.data.data.img_path}`);
    console.log(`   Image de couverture: ${response.data.data.cover_img_path}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return null;
  }
}

// Test actualité avec image
async function testActuWithImage(token) {
  console.log('\n📋 TEST 4: Création d\'actualité avec image (test.png)');
  console.log('='.repeat(60));
  
  const formData = new FormData();
  formData.append('date', '2024-01-15');
  formData.append('titre', 'Actualité test avec image réelle');
  formData.append('text_preview', 'Actualité de test utilisant test.png');
  formData.append('content_json', JSON.stringify({
    blocks: [
      { 
        type: 'paragraph', 
        text: 'Cette actualité utilise l\'image test.png du bureau.' 
      }
    ]
  }));
  formData.append('category', JSON.stringify(['Test', 'Actualités']));
  
  // Ajouter l'image comme image de couverture pour l'actualité
  formData.append('coverImage', fs.createReadStream(IMAGE_PATH), {
    filename: 'test-actu.png',
    contentType: 'image/png'
  });
  
  try {
    const response = await axios.post(`${BASE_URL}/api/actus`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Actualité créée avec succès!');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Titre: ${response.data.data.titre}`);
    console.log(`   Image principale: ${response.data.data.img_path || 'null'}`);
    console.log(`   Image de couverture: ${response.data.data.cover_img_path}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return null;
  }
}

// Vérifier les images uploadées dans le dossier uploads
async function checkUploadedFiles() {
  console.log('\n📋 Vérification des fichiers uploadés');
  console.log('='.repeat(60));
  
  try {
    const uploadsPath = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsPath)) {
      console.log('❌ Dossier uploads non trouvé');
      return;
    }
    
    const files = fs.readdirSync(uploadsPath);
    console.log(`📁 Dossier uploads contient ${files.length} fichier(s):`);
    
    files.forEach(file => {
      const filePath = path.join(uploadsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   📄 ${file} (${sizeKB} KB)`);
    });
    
    // Vérifier la taille de l'image originale
    const originalStats = fs.statSync(IMAGE_PATH);
    const originalSizeKB = Math.round(originalStats.size / 1024);
    console.log(`\n📏 Image originale: test.png (${originalSizeKB} KB)`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des fichiers:', error.message);
  }
}

// Fonction principale
async function runRealImageTests() {
  console.log('🚀 Démarrage des tests avec image réelle (test.png)\n');
  
  // Vérifier que l'image existe
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ Image non trouvée: ${IMAGE_PATH}`);
    return;
  }
  
  const stats = fs.statSync(IMAGE_PATH);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`✅ Image trouvée: test.png (${sizeKB} KB)`);
  
  // Test de connexion au serveur
  try {
    await axios.get(`${BASE_URL}/api/articles`);
    console.log('✅ Serveur accessible');
  } catch (error) {
    console.error('❌ Serveur inaccessible - Assurez-vous que le serveur tourne sur le port 4000');
    return;
  }
  
  // Obtenir un token d'authentification
  const token = await getAuthToken();
  if (!token) {
    console.error('❌ Impossible d\'obtenir un token d\'authentification');
    return;
  }
  
  // Exécuter les tests
  let results = { passed: 0, failed: 0 };
  
  const article1 = await testWithMainImage(token);
  if (article1) results.passed++; else results.failed++;
  
  const article2 = await testWithCoverImage(token);
  if (article2) results.passed++; else results.failed++;
  
  const article3 = await testWithBothImages(token);
  if (article3) results.passed++; else results.failed++;
  
  const actu1 = await testActuWithImage(token);
  if (actu1) results.passed++; else results.failed++;
  
  // Vérifier les fichiers uploadés
  await checkUploadedFiles();
  
  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${results.passed}/4`);
  console.log(`❌ Tests échoués: ${results.failed}/4`);
  
  if (results.failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! Le système d\'images fonctionne parfaitement avec test.png');
    console.log('\n💡 Vous pouvez maintenant vérifier:');
    console.log('   - Le dossier /uploads/ pour voir les images uploadées');
    console.log('   - L\'API GET /api/articles pour voir les articles créés');
    console.log('   - L\'API GET /api/actus pour voir les actualités créées');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
}

// Lancer les tests
runRealImageTests().catch(console.error); 