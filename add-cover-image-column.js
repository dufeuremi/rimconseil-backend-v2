const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

console.log('🔄 Ajout de la colonne cover_img_path...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
    
    // Ajouter la colonne cover_img_path à la table articles
    db.run(`ALTER TABLE articles ADD COLUMN cover_img_path TEXT`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('ℹ️  La colonne cover_img_path existe déjà dans la table articles');
        } else {
          console.error('❌ Erreur lors de l\'ajout de la colonne cover_img_path à articles:', err.message);
        }
      } else {
        console.log('✅ Colonne cover_img_path ajoutée à la table articles');
      }
      
      // Ajouter la colonne cover_img_path à la table actus
      db.run(`ALTER TABLE actus ADD COLUMN cover_img_path TEXT`, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('ℹ️  La colonne cover_img_path existe déjà dans la table actus');
          } else {
            console.error('❌ Erreur lors de l\'ajout de la colonne cover_img_path à actus:', err.message);
          }
        } else {
          console.log('✅ Colonne cover_img_path ajoutée à la table actus');
        }
        
        // Ajouter la colonne category si elle n'existe pas
        db.run(`ALTER TABLE articles ADD COLUMN category TEXT DEFAULT '[]'`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ Erreur lors de l\'ajout de la colonne category à articles:', err.message);
          } else if (!err) {
            console.log('✅ Colonne category ajoutée à la table articles');
          }
          
          db.run(`ALTER TABLE actus ADD COLUMN category TEXT DEFAULT '[]'`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('❌ Erreur lors de l\'ajout de la colonne category à actus:', err.message);
            } else if (!err) {
              console.log('✅ Colonne category ajoutée à la table actus');
            }
            
            console.log('🎉 Migration terminée avec succès!');
            db.close();
          });
        });
      });
    });
  }
}); 