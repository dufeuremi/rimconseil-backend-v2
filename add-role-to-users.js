const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

console.log('🔧 Ajout de la colonne role à la table users...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
    
    // Ajouter la colonne role
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('ℹ️  La colonne role existe déjà dans la table users');
        } else {
          console.error('❌ Erreur lors de l\'ajout de la colonne role:', err.message);
        }
      } else {
        console.log('✅ Colonne role ajoutée à la table users');
      }
      
      db.close();
    });
  }
}); 