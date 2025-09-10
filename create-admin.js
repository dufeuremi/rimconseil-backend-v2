const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

console.log('👤 Création d\'un utilisateur admin...');

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
    
    try {
      // Hacher le mot de passe
      const plainPassword = process.env.NEW_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      // Vérifier si l'admin existe déjà
      db.get('SELECT id FROM users WHERE email = ?', ['admin@rimconseil.fr'], (err, row) => {
        if (err) {
          console.error('❌ Erreur lors de la vérification:', err.message);
          db.close();
          return;
        }
        
        if (row) {
          console.log('ℹ️  L\'utilisateur admin existe déjà');
          // Mettre à jour le mot de passe
          db.run('UPDATE users SET password = ?, role = ? WHERE email = ?', 
            [hashedPassword, 'admin', 'admin@rimconseil.fr'], 
            (err) => {
              if (err) {
                console.error('❌ Erreur lors de la mise à jour:', err.message);
              } else {
                console.log('✅ Mot de passe admin mis à jour');
                console.log('📧 Email: admin@rimconseil.fr');
                console.log(`🔑 Nouveau mot de passe: ${process.env.NEW_PASSWORD || 'admin123'}`);
              }
              db.close();
            }
          );
        } else {
          // Créer l'utilisateur admin
          db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
            ['admin@rimconseil.fr', hashedPassword, 'admin'], 
            (err) => {
              if (err) {
                console.error('❌ Erreur lors de la création:', err.message);
              } else {
                console.log('✅ Utilisateur admin créé avec succès');
                console.log('📧 Email: admin@rimconseil.fr');
                console.log(`🔑 Mot de passe: ${process.env.NEW_PASSWORD || 'admin123'}`);
              }
              db.close();
            }
          );
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors du hachage:', error);
      db.close();
    }
  }
}); 