const axios = require('axios');

// Configuration de base
const BASE_URL = 'http://localhost:4000';
const TEST_EMAIL = 'admin@rimconseil.fr';
const TEST_PASSWORD = 'admin123';

let authToken = '';

// Fonction utilitaire pour les logs colorés
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',      // Cyan
    success: '\x1b[32m',   // Vert
    error: '\x1b[31m',     // Rouge
    warning: '\x1b[33m',   // Jaune
    reset: '\x1b[0m'       // Reset
  };
  
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Fonction de connexion pour obtenir le token JWT
async function login() {
  try {
    log('🔐 Connexion pour obtenir le token JWT...', 'info');
    
    const response = await axios.post(`${BASE_URL}/api/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      log('✅ Connexion réussie!', 'success');
      log(`👤 Utilisateur: ${response.data.user.email} (${response.data.user.role})`, 'info');
      return true;
    } else {
      log('❌ Aucun token reçu', 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 1: Récupération des éléments éditables d'une page
async function testGetEditableContent() {
  try {
    log('\n📋 Test 1: Récupération des éléments éditables de la page "notre-equipe"', 'info');
    
    const response = await axios.get(`${BASE_URL}/api/editable-content/notre-equipe`);
    
    if (response.status === 200) {
      log('✅ Récupération réussie!', 'success');
      log(`📊 Page: ${response.data.pageName}`, 'info');
      log(`📊 Nombre d'éléments: ${response.data.totalElements}`, 'info');
      
      response.data.elements.forEach((element, index) => {
        log(`   ${index + 1}. ${element.element_selector} (${element.element_type})`, 'info');
        log(`      HTML: ${element.content_html}`, 'info');
        log(`      Text: ${element.content_text}`, 'info');
      });
      
      return true;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 2: Mise à jour d'un élément individuel
async function testUpdateIndividualElement() {
  try {
    log('\n📝 Test 2: Mise à jour d\'un élément individuel', 'info');
    
    const testData = {
      page_name: 'notre-equipe',
      element_selector: '.team-member-1 .name',
      content_html: '<strong>Jean-Paul Dupont</strong> 🚀',
      element_type: 'title'
    };
    
    const response = await axios.patch(
      `${BASE_URL}/api/editable-content/element`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      log(`✅ ${response.data.message}`, 'success');
      log(`📊 Élément mis à jour: ${response.data.element.element_selector}`, 'info');
      log(`📊 Nouveau contenu HTML: ${response.data.element.content_html}`, 'info');
      log(`📊 Contenu texte: ${response.data.element.content_text}`, 'info');
      return true;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.response?.data?.message || error.message}`, 'error');
    if (error.response?.status === 401) {
      log('🔒 Erreur d\'authentification - vérifiez le token JWT', 'warning');
    }
    return false;
  }
}

// Test 3: Création d'un nouvel élément
async function testCreateNewElement() {
  try {
    log('\n🆕 Test 3: Création d\'un nouvel élément', 'info');
    
    const testData = {
      page_name: 'notre-equipe',
      element_selector: '.team-member-2 .name',
      content_html: '<strong>Marie <em>Dubois</em></strong>',
      element_type: 'title'
    };
    
    const response = await axios.patch(
      `${BASE_URL}/api/editable-content/element`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 201) {
      log(`✅ ${response.data.message}`, 'success');
      log(`📊 Nouvel élément: ${response.data.element.element_selector}`, 'info');
      log(`📊 ID: ${response.data.element.id}`, 'info');
      return true;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 4: Mise à jour en lot (bulk update)
async function testBulkUpdate() {
  try {
    log('\n📦 Test 4: Mise à jour en lot de plusieurs éléments', 'info');
    
    const testData = {
      elements: [
        {
          page_name: 'notre-equipe',
          element_selector: '.team-intro h2',
          content_html: '<strong>Notre équipe d\'experts 🌟</strong>',
          element_type: 'title'
        },
        {
          page_name: 'notre-equipe',
          element_selector: '.team-intro p',
          content_html: 'Une équipe de <em>professionnels passionnés</em> et <strong>expérimentés</strong> dans la transformation digitale.',
          element_type: 'paragraph'
        },
        {
          page_name: 'notre-equipe',
          element_selector: '.team-member-3 .name',
          content_html: '<strong>Pierre Martin</strong>',
          element_type: 'title'
        },
        {
          page_name: 'notre-equipe',
          element_selector: '.team-member-3 .bio',
          content_html: 'Spécialiste en <strong>cybersécurité</strong> avec 8 ans d\'expérience.',
          element_type: 'bio'
        }
      ]
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/editable-content/bulk-update`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200 || response.status === 207) {
      log(`✅ ${response.data.message}`, 'success');
      log(`📊 Éléments mis à jour: ${response.data.totalUpdated}`, 'info');
      log(`📊 Erreurs: ${response.data.totalErrors}`, 'info');
      
      if (response.data.errors.length > 0) {
        log('⚠️  Erreurs détectées:', 'warning');
        response.data.errors.forEach(error => {
          log(`   - Index ${error.index}: ${error.error}`, 'warning');
        });
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Erreur: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 5: Test de sécurité - Validation HTML
async function testHTMLSanitization() {
  try {
    log('\n🛡️  Test 5: Test de sécurité - Sanitisation HTML', 'info');
    
    const maliciousData = {
      page_name: 'test-security',
      element_selector: '.test-element',
      content_html: '<script>alert("XSS")</script><strong>Contenu légitime</strong><iframe src="evil.com"></iframe>',
      element_type: 'paragraph'
    };
    
    const response = await axios.patch(
      `${BASE_URL}/api/editable-content/element`,
      maliciousData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200 || response.status === 201) {
      log('✅ Contenu traité avec succès', 'success');
      log(`📊 HTML original: ${maliciousData.content_html}`, 'warning');
      log(`📊 HTML sanitisé: ${response.data.element.content_html}`, 'success');
      log(`📊 Texte extrait: ${response.data.element.content_text}`, 'info');
      
      // Vérifier que les balises dangereuses ont été supprimées
      if (!response.data.element.content_html.includes('<script>') && 
          !response.data.element.content_html.includes('<iframe>')) {
        log('✅ Sanitisation réussie - balises dangereuses supprimées', 'success');
        return true;
      } else {
        log('❌ Sanitisation échouée - balises dangereuses présentes', 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Erreur: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 6: Test de validation des sélecteurs CSS
async function testCSSValidation() {
  try {
    log('\n🎯 Test 6: Test de validation des sélecteurs CSS', 'info');
    
    const invalidSelector = {
      page_name: 'test-validation',
      element_selector: '<script>alert("hack")</script>',
      content_html: '<strong>Test</strong>',
      element_type: 'paragraph'
    };
    
    try {
      await axios.patch(
        `${BASE_URL}/api/editable-content/element`,
        invalidSelector,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      log('❌ La validation des sélecteurs CSS a échoué - requête acceptée', 'error');
      return false;
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('Sélecteur CSS invalide')) {
        log('✅ Validation des sélecteurs CSS réussie - requête rejetée', 'success');
        log(`📊 Message d'erreur: ${error.response.data.message}`, 'info');
        return true;
      } else {
        log(`❌ Erreur inattendue: ${error.response?.data?.message || error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Erreur lors du test: ${error.message}`, 'error');
    return false;
  }
}

// Test 7: Test sans authentification
async function testUnauthenticated() {
  try {
    log('\n🔒 Test 7: Test d\'accès sans authentification', 'info');
    
    const testData = {
      page_name: 'test',
      element_selector: '.test',
      content_html: '<strong>Test</strong>',
      element_type: 'paragraph'
    };
    
    try {
      await axios.patch(`${BASE_URL}/api/editable-content/element`, testData);
      log('❌ L\'authentification a échoué - accès autorisé sans token', 'error');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Authentification requise - accès refusé sans token', 'success');
        log(`📊 Message: ${error.response.data.message}`, 'info');
        return true;
      } else {
        log(`❌ Erreur inattendue: ${error.response?.data?.message || error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Erreur lors du test: ${error.message}`, 'error');
    return false;
  }
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  log('🚀 Démarrage des tests de l\'API editable-content', 'info');
  log('=' .repeat(60), 'info');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test de connexion
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('❌ Impossible de se connecter - arrêt des tests', 'error');
    return;
  }
  
  // Liste des tests à exécuter
  const tests = [
    { name: 'Récupération éléments éditables', fn: testGetEditableContent },
    { name: 'Mise à jour élément individuel', fn: testUpdateIndividualElement },
    { name: 'Création nouvel élément', fn: testCreateNewElement },
    { name: 'Mise à jour en lot', fn: testBulkUpdate },
    { name: 'Sanitisation HTML', fn: testHTMLSanitization },
    { name: 'Validation sélecteurs CSS', fn: testCSSValidation },
    { name: 'Test sans authentification', fn: testUnauthenticated }
  ];
  
  // Exécuter tous les tests
  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Résumé final
  log('\n' + '=' .repeat(60), 'info');
  log('📊 RÉSUMÉ DES TESTS', 'info');
  log('=' .repeat(60), 'info');
  log(`Tests exécutés: ${results.total}`, 'info');
  log(`✅ Réussis: ${results.passed}`, 'success');
  log(`❌ Échoués: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  
  const successRate = Math.round((results.passed / results.total) * 100);
  log(`📈 Taux de réussite: ${successRate}%`, successRate === 100 ? 'success' : 'warning');
  
  if (results.failed === 0) {
    log('\n🎉 Tous les tests ont réussi! L\'API editable-content est fonctionnelle.', 'success');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'warning');
  }
}

// Exécuter les tests si ce fichier est lancé directement
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ Erreur fatale lors des tests: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testGetEditableContent,
  testUpdateIndividualElement,
  testCreateNewElement,
  testBulkUpdate,
  testHTMLSanitization,
  testCSSValidation,
  testUnauthenticated
}; 