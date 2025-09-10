const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000';
const TEST_EMAIL = 'admin@rimconseil.fr';
const TEST_PASSWORD = 'admin123';

let authToken = '';

// Fonction pour se connecter et obtenir le token
async function login() {
  try {
    console.log('🔐 Connexion...');
    const response = await axios.post(`${BASE_URL}/api/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Connexion réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Fonction pour créer un élément de test
async function createTestElement() {
  try {
    console.log('📝 Création d\'un élément de test...');
    const response = await axios.patch(`${BASE_URL}/api/editable-content/element`, {
      page_name: 'test-page',
      element_selector: '.test-element',
      content_html: '<p>Contenu de test pour suppression</p>',
      element_type: 'paragraph'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Élément de test créé:', response.data.element.id);
    return response.data.element;
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
    return null;
  }
}

// Test 1: Suppression d'un élément individuel
async function testDeleteSingleElement() {
  try {
    console.log('\n🧪 Test 1: Suppression d\'un élément individuel');
    
    // Créer un élément de test
    const testElement = await createTestElement();
    if (!testElement) return false;
    
    // Supprimer l'élément
    console.log('🗑️  Suppression de l\'élément...');
    const response = await axios.delete(`${BASE_URL}/api/editable-content/element`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        page_name: testElement.page_name,
        element_selector: testElement.element_selector
      }
    });
    
    console.log('✅ Suppression réussie:', response.data.message);
    console.log('📋 Élément supprimé:', response.data.deletedElement);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Suppression en lot
async function testBulkDelete() {
  try {
    console.log('\n🧪 Test 2: Suppression en lot');
    
    // Créer plusieurs éléments de test
    const testElements = [];
    for (let i = 1; i <= 3; i++) {
      const element = await createTestElement();
      if (element) {
        // Modifier le sélecteur pour éviter les conflits
        await axios.patch(`${BASE_URL}/api/editable-content/element`, {
          page_name: element.page_name,
          element_selector: `.test-element-${i}`,
          content_html: `<p>Contenu de test ${i}</p>`,
          element_type: 'paragraph'
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        testElements.push({
          page_name: element.page_name,
          element_selector: `.test-element-${i}`
        });
      }
    }
    
    if (testElements.length === 0) {
      console.log('❌ Aucun élément de test créé');
      return false;
    }
    
    console.log(`📝 ${testElements.length} éléments de test créés`);
    
    // Supprimer en lot
    console.log('🗑️  Suppression en lot...');
    const response = await axios.delete(`${BASE_URL}/api/editable-content/bulk-delete`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { elements: testElements }
    });
    
    console.log('✅ Suppression en lot réussie:', response.data.message);
    console.log('📋 Résumé:', response.data.summary);
    console.log('🗑️  Éléments supprimés:', response.data.deletedElements);
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.log('⚠️  Erreurs:', response.data.errors);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression en lot:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Tentative de suppression d'un élément inexistant
async function testDeleteNonExistentElement() {
  try {
    console.log('\n🧪 Test 3: Suppression d\'un élément inexistant');
    
    const response = await axios.delete(`${BASE_URL}/api/editable-content/element`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        page_name: 'page-inexistante',
        element_selector: '.element-inexistant'
      }
    });
    
    console.log('❌ Erreur: La suppression aurait dû échouer');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Comportement attendu: Élément non trouvé (404)');
      console.log('📋 Message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 4: Validation des paramètres
async function testValidation() {
  try {
    console.log('\n🧪 Test 4: Validation des paramètres');
    
    // Test sans page_name
    try {
      await axios.delete(`${BASE_URL}/api/editable-content/element`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          element_selector: '.test'
        }
      });
      console.log('❌ Erreur: La validation aurait dû échouer');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation page_name: OK');
      } else {
        console.error('❌ Erreur de validation inattendue:', error.response?.data);
        return false;
      }
    }
    
    // Test sans element_selector
    try {
      await axios.delete(`${BASE_URL}/api/editable-content/element`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          page_name: 'test'
        }
      });
      console.log('❌ Erreur: La validation aurait dû échouer');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation element_selector: OK');
        return true;
      } else {
        console.error('❌ Erreur de validation inattendue:', error.response?.data);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de validation:', error.response?.data || error.message);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests de suppression editable-content\n');
  
  // Connexion
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Impossible de se connecter, arrêt des tests');
    return;
  }
  
  const results = [];
  
  // Exécuter tous les tests
  results.push(await testDeleteSingleElement());
  results.push(await testBulkDelete());
  results.push(await testDeleteNonExistentElement());
  results.push(await testValidation());
  
  // Résumé
  const successCount = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log('\n📊 Résumé des tests:');
  console.log(`✅ Tests réussis: ${successCount}/${totalTests}`);
  console.log(`❌ Tests échoués: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 Tous les tests sont passés ! La fonctionnalité de suppression fonctionne correctement.');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
}

// Exécuter les tests
runTests().catch(console.error);
