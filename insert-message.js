// Script pour insérer directement un message dans la base de données
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, './database.sqlite');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
    return;
  }
  
  console.log('Connecté à la base de données SQLite');
  
  // Vérifier si la table MESSAGES existe
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'", [], (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification de la table:', err.message);
      db.close();
      return;
    }
    
    if (!row) {
      console.log('La table MESSAGES n\'existe pas. Création...');
      // Créer la table MESSAGES
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL,
          prenom TEXT NOT NULL,
          email TEXT NOT NULL,
          telephone TEXT,
          sujet TEXT NOT NULL,
          message TEXT NOT NULL,
          date TEXT NOT NULL,
          status BOOLEAN DEFAULT 0
        )
      `, function(err) {
        if (err) {
          console.error('Erreur lors de la création de la table messages:', err.message);
          db.close();
          return;
        }
        console.log('Table MESSAGES créée');
        insertMessage();
      });
    } else {
      console.log('La table MESSAGES existe déjà');
      insertMessage();
    }
  });
  
  function insertMessage() {
    // Insérer un message test
    const date = new Date().toISOString();
    
    db.run(
      'INSERT INTO messages (nom, prenom, email, telephone, sujet, message, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Dupont', 'Jean', 'test@example.com', '0612345678', 'Message de test', 'Ceci est un message de test inséré directement dans la base de données.', date, 0],
      function(err) {
        if (err) {
          console.error('Erreur lors de l\'insertion du message:', err.message);
        } else {
          console.log(`Message inséré avec succès, ID: ${this.lastID}`);
        }
        
        // Afficher tous les messages
        db.all('SELECT * FROM messages', [], (err, rows) => {
          if (err) {
            console.error('Erreur lors de la récupération des messages:', err.message);
          } else {
            console.log('Messages dans la base de données:');
            console.log(rows);
          }
          
          // Fermer la connexion
          db.close((err) => {
            if (err) {
              console.error('Erreur lors de la fermeture de la connexion:', err.message);
            } else {
              console.log('Connexion à la base de données fermée');
            }
          });
        });
      }
    );
  }
}); 