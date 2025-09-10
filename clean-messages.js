const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, './database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connecté à la base de données SQLite');

  // Supprimer tous les messages
  db.run('DELETE FROM messages', (err) => {
    if (err) {
      console.error('Erreur lors de la suppression des messages:', err.message);
      process.exit(1);
    }
    console.log('Tous les messages ont été supprimés');
    
    // Réinitialiser l'auto-increment
    db.run('DELETE FROM sqlite_sequence WHERE name = "messages"', (err) => {
      if (err) {
        console.error('Erreur lors de la réinitialisation de l\'auto-increment:', err.message);
      } else {
        console.log('Auto-increment réinitialisé');
      }
      
      // Fermer la connexion
      db.close(() => {
        console.log('Connexion à la base de données fermée');
        console.log('Nettoyage de la table messages terminé');
      });
    });
  });
}); 