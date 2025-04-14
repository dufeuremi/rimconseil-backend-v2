// Script pour ajouter un utilisateur admin
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, './database.sqlite');

async function addAdminUser() {
  return new Promise((resolve, reject) => {
    // Ouvrir la base de données
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Erreur de connexion à la base de données SQLite:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connecté à la base de données SQLite');
      
      try {
        // Vérifier si l'utilisateur admin existe déjà
        db.get('SELECT id FROM users WHERE email = ?', ['admin@rimconseil.fr'], async (err, row) => {
          if (err) {
            console.error('Erreur lors de la vérification de l\'utilisateur:', err.message);
            db.close();
            reject(err);
            return;
          }
          
          if (row) {
            console.log('L\'utilisateur admin@rimconseil.fr existe déjà.');
            console.log('Mise à jour du mot de passe...');
            
            // Hacher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash('admin', 10);
            
            // Mettre à jour le mot de passe
            db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'admin@rimconseil.fr'], function(err) {
              if (err) {
                console.error('Erreur lors de la mise à jour du mot de passe:', err.message);
                db.close();
                reject(err);
                return;
              }
              
              console.log('Mot de passe mis à jour avec succès pour admin@rimconseil.fr');
              db.close();
              resolve();
            });
          } else {
            console.log('Création de l\'utilisateur admin@rimconseil.fr...');
            
            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash('admin', 10);
            
            // Insérer le nouvel utilisateur
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', ['admin@rimconseil.fr', hashedPassword], function(err) {
              if (err) {
                console.error('Erreur lors de la création de l\'utilisateur:', err.message);
                db.close();
                reject(err);
                return;
              }
              
              console.log(`Utilisateur admin@rimconseil.fr créé avec succès (ID: ${this.lastID})`);
              db.close();
              resolve();
            });
          }
        });
      } catch (error) {
        console.error('Erreur:', error);
        db.close();
        reject(error);
      }
    });
  });
}

// Exécuter la fonction
addAdminUser()
  .then(() => console.log('Opération terminée.'))
  .catch((error) => console.error('Erreur globale:', error)); 