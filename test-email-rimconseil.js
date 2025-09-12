const nodemailer = require('nodemailer');

// Test de l'envoi d'email avec les nouvelles informations Rimconseil
async function testEmailRimconseil() {
  console.log('🧪 Test de l\'envoi d\'email Rimconseil...');
  
  try {
    // Configuration du transporteur email avec SMTP pour Rimconseil
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true pour 465, false pour les autres ports
      auth: {
        user: 'rimconseilrennes@gmail.com',
        pass: 'mwvp ugtq ttwm uipe' // Mot de passe d'application Gmail
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test de connexion
    console.log('📡 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');

    // Configuration du message de test
    const mailOptions = {
      from: `"RIM Conseil" <rimconseilrennes@gmail.com>`,
      to: 'rimconseilrennes@gmail.com',
      subject: 'Test Email - Configuration Rimconseil',
      text: `
        Ceci est un email de test pour vérifier la configuration email de Rimconseil.
        
        Informations de test :
        - Date: ${new Date().toLocaleString('fr-FR')}
        - Expéditeur: rimconseilrennes@gmail.com
        - Destinataire: rimconseilrennes@gmail.com
        - Sujet: Test Email - Configuration Rimconseil
        
        Si vous recevez cet email, la configuration fonctionne correctement !
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email Rimconseil</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">Test Email - Configuration Rimconseil</h2>
            <p>Ceci est un email de test pour vérifier la configuration email de Rimconseil.</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 15px;">
              <h3 style="color: #555;">Informations de test :</h3>
              <ul>
                <li><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</li>
                <li><strong>Expéditeur:</strong> rimconseilrennes@gmail.com</li>
                <li><strong>Destinataire:</strong> rimconseilrennes@gmail.com</li>
                <li><strong>Sujet:</strong> Test Email - Configuration Rimconseil</li>
              </ul>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;"><strong>✅ Succès !</strong> Si vous recevez cet email, la configuration fonctionne correctement !</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Envoi de l'email
    console.log('📧 Envoi de l\'email de test...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de test envoyé avec succès !');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email envoyé à: rimconseilrennes@gmail.com');
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'envoi d\'email:', error);
    
    if (error.code === 'EAUTH') {
      console.error('🔐 Erreur d\'authentification. Vérifiez :');
      console.error('   - L\'email: rimconseilrennes@gmail.com');
      console.error('   - Le mot de passe d\'application: mwvp ugtq ttwm uipe');
      console.error('   - Que l\'authentification à 2 facteurs est activée sur le compte Gmail');
      console.error('   - Qu\'un mot de passe d\'application a été généré');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Erreur de connexion. Vérifiez :');
      console.error('   - Votre connexion internet');
      console.error('   - Que le port 465 n\'est pas bloqué');
    } else {
      console.error('❓ Erreur inconnue:', error.message);
    }
  }
}

// Test de l'API de messages
async function testMessageAPI() {
  console.log('\n🧪 Test de l\'API de messages...');
  
  try {
    const messageData = {
      nom: 'Test',
      prenom: 'Jean-Philippe',
      email: 'test@example.com',
      telephone: '0123456789',
      sujet: 'Test API Messages',
      message: 'Ceci est un message de test pour vérifier que l\'envoi d\'email fonctionne correctement avec les nouvelles informations Rimconseil.'
    };

    const response = await fetch('http://localhost:4000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Message envoyé avec succès via l\'API !');
      console.log('📧 Email de notification envoyé à rimconseilrennes@gmail.com');
      console.log('📋 Réponse:', result);
    } else {
      console.error('❌ Erreur lors de l\'envoi du message:', result);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de configuration email Rimconseil\n');
  
  // Test 1: Envoi d'email direct
  await testEmailRimconseil();
  
  // Test 2: API de messages (nécessite que le serveur soit démarré)
  console.log('\n' + '='.repeat(50));
  console.log('ℹ️  Pour tester l\'API de messages, assurez-vous que le serveur est démarré (node index.js)');
  console.log('='.repeat(50));
  
  // Décommenter la ligne suivante si le serveur est démarré
  // await testMessageAPI();
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testEmailRimconseil, testMessageAPI };
