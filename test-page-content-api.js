const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Fonction pour tester les routes publiques
async function testPublicRoutes() {
  console.log('=== Test des routes publiques ===');
  
  try {
    // Test GET /api/page-content
    console.log('\n1. Test GET /api/page-content');
    const allPageContents = await axios.get(`${BASE_URL}/api/page-content`);
    console.log('✅ Statut:', allPageContents.status);
    console.log('📊 Nombre de contenus:', allPageContents.data.length);
    console.log('📝 Premier contenu:', allPageContents.data[0]);
    
    if (allPageContents.data.length > 0) {
      const firstPageContent = allPageContents.data[0];
      
      // Test GET /api/page-content/:id
      console.log('\n2. Test GET /api/page-content/:id');
      const pageContentById = await axios.get(`${BASE_URL}/api/page-content/${firstPageContent.id}`);
      console.log('✅ Statut:', pageContentById.status);
      console.log('📝 Contenu récupéré par ID:', pageContentById.data);
      
      // Test GET /api/page-content/by-name/:page_name
      console.log('\n3. Test GET /api/page-content/by-name/:page_name');
      const pageContentByName = await axios.get(`${BASE_URL}/api/page-content/by-name/${firstPageContent.page_name}`);
      console.log('✅ Statut:', pageContentByName.status);
      console.log('📝 Contenu récupéré par nom:', pageContentByName.data);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test des routes publiques:', error.response?.data || error.message);
  }
}

// Fonction pour obtenir un token
async function getAuthToken() {
  try {
    console.log('\n=== Récupération du token d\'authentification ===');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'admin@rimconseil.fr',
      password: 'password123'
    });
    console.log('✅ Connexion réussie');
    return loginResponse.data.token;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour tester les routes protégées
async function testProtectedRoutes(token) {
  console.log('\n=== Test des routes protégées ===');
  
  if (!token) {
    console.log('❌ Pas de token disponible, impossible de tester les routes protégées');
    return;
  }
  
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test POST /api/page-content
    console.log('\n4. Test POST /api/page-content');
    const newPageContent = {
      page_name: 'test-page',
      content: {
        blocks: [
          {
            type: 'heading',
            text: 'Page de Test'
          },
          {
            type: 'paragraph',
            text: 'Ceci est une page créée par le script de test.'
          }
        ]
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/page-content`, newPageContent, { headers });
    console.log('✅ Statut:', createResponse.status);
    console.log('📝 Contenu créé:', createResponse.data);
    
    const createdId = createResponse.data.id;
    
    // Test PATCH /api/page-content/:id
    console.log('\n5. Test PATCH /api/page-content/:id');
    const updateData = {
      content: {
        blocks: [
          {
            type: 'heading',
            text: 'Page de Test (Mise à jour)'
          },
          {
            type: 'paragraph',
            text: 'Ceci est une page mise à jour par le script de test.'
          },
          {
            type: 'paragraph',
            text: 'Ce paragraphe a été ajouté lors de la mise à jour.'
          }
        ]
      }
    };
    
    const updateResponse = await axios.patch(`${BASE_URL}/api/page-content/${createdId}`, updateData, { headers });
    console.log('✅ Statut:', updateResponse.status);
    console.log('📝 Contenu mis à jour:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Erreur lors du test des routes protégées:', error.response?.data || error.message);
  }
}

// Fonction pour tester les erreurs
async function testErrorCases() {
  console.log('\n=== Test des cas d\'erreur ===');
  
  try {
    // Test GET avec ID inexistant
    console.log('\n6. Test GET avec ID inexistant');
    try {
      await axios.get(`${BASE_URL}/api/page-content/999999`);
    } catch (error) {
      console.log('✅ Erreur attendue pour ID inexistant:', error.response?.status, error.response?.data?.message);
    }
    
    // Test GET avec nom inexistant
    console.log('\n7. Test GET avec nom de page inexistant');
    try {
      await axios.get(`${BASE_URL}/api/page-content/by-name/page-inexistante`);
    } catch (error) {
      console.log('✅ Erreur attendue pour nom inexistant:', error.response?.status, error.response?.data?.message);
    }
    
    // Test POST sans token
    console.log('\n8. Test POST sans token');
    try {
      await axios.post(`${BASE_URL}/api/page-content`, {
        page_name: 'test-sans-token',
        content: { blocks: [] }
      });
    } catch (error) {
      console.log('✅ Erreur attendue sans token:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue lors du test des cas d\'erreur:', error.message);
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Début des tests de l\'API Page Content');
  console.log('=====================================');
  
  // Test des routes publiques
  await testPublicRoutes();
  
  // Récupération du token et test des routes protégées
  const token = await getAuthToken();
  await testProtectedRoutes(token);
  
  // Test des cas d'erreur
  await testErrorCases();
  
  console.log('\n✅ Tests terminés');
}

// Exécuter les tests
runTests().catch(console.error); 