// Script pour ajouter une colonne role à la table users
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
  
  // Vérifier si la colonne role existe déjà
  db.get("PRAGMA table_info(users)", [], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la vérification de la structure de la table:', err.message);
      db.close();
      return;
    }
    
    // Vérifier si la colonne role existe déjà dans la table users
    let roleColumnExists = false;
    if (rows) {
      const columns = Array.isArray(rows) ? rows : [rows];
      roleColumnExists = columns.some(col => col.name === 'role');
    }
    
    if (roleColumnExists) {
      console.log('La colonne "role" existe déjà dans la table users');
      updateAdminRole();
    } else {
      console.log('Ajout de la colonne "role" à la table users...');
      
      // Ajouter la colonne role avec la valeur par défaut 'user'
      db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, function(err) {
        if (err) {
          console.error('Erreur lors de l\'ajout de la colonne:', err.message);
          db.close();
          return;
        }
        
        console.log('Colonne "role" ajoutée avec succès');
        updateAdminRole();
      });
    }
  });
  
  // Mettre à jour l'utilisateur admin@rimconseil.fr avec le rôle 'admin'
  function updateAdminRole() {
    db.run(`UPDATE users SET role = 'admin' WHERE email = 'admin@rimconseil.fr'`, function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour du rôle admin:', err.message);
      } else {
        if (this.changes > 0) {
          console.log(`Rôle 'admin' attribué à admin@rimconseil.fr`);
        } else {
          console.log(`Utilisateur admin@rimconseil.fr non trouvé ou déjà configuré`);
        }
      }
      
      // Afficher les utilisateurs mis à jour
      db.all('SELECT id, email, role FROM users', [], (err, rows) => {
        if (err) {
          console.error('Erreur lors de la récupération des utilisateurs:', err.message);
        } else {
          console.log('Utilisateurs dans la base de données:');
          console.table(rows);
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
    });
  }
}); 