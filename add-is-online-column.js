const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connecté à la base de données SQLite');

  // Ajouter la colonne is_online à la table articles
  db.run(`ALTER TABLE articles ADD COLUMN is_online INTEGER DEFAULT 0`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('La colonne is_online existe déjà dans la table articles');
      } else {
        console.error('Erreur lors de l\'ajout de la colonne is_online à la table articles:', err.message);
      }
    } else {
      console.log('Colonne is_online ajoutée avec succès à la table articles');
    }

    // Ajouter la colonne is_online à la table actus
    db.run(`ALTER TABLE actus ADD COLUMN is_online INTEGER DEFAULT 0`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('La colonne is_online existe déjà dans la table actus');
        } else {
          console.error('Erreur lors de l\'ajout de la colonne is_online à la table actus:', err.message);
        }
      } else {
        console.log('Colonne is_online ajoutée avec succès à la table actus');
      }

      // Fermer la base de données
      db.close((err) => {
        if (err) {
          console.error('Erreur lors de la fermeture de la base de données:', err.message);
        } else {
          console.log('Base de données fermée');
        }
      });
    });
  });
}); 