const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, '../database.sqlite');

// Ouvrir la base de données ou la créer si elle n'existe pas
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite');
    
    // Créer la table ARTICLES
    db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        titre TEXT NOT NULL,
        text_preview TEXT NOT NULL,
        content_json TEXT NOT NULL,
        path TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table articles:', err.message);
      } else {
        console.log('Table ARTICLES prête');
        
        // Vérifier si la table est vide
        db.get('SELECT COUNT(*) as count FROM articles', [], (err, row) => {
          if (err) {
            console.error('Erreur lors de la vérification des données:', err.message);
          } else if (row.count === 0) {
            // Insérer des données d'exemple
            const articles = [
              {
                date: '2023-05-15',
                titre: 'Introduction à RIM Conseil',
                text_preview: 'RIM Conseil est une entreprise spécialisée dans la transformation digitale...',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'paragraph',
                      text: 'RIM Conseil est une entreprise spécialisée dans la transformation digitale. Nous accompagnons les entreprises dans leur évolution numérique.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Notre équipe d\'experts propose des solutions adaptées à vos besoins.'
                    }
                  ]
                })
              },
              {
                date: '2023-06-20',
                titre: 'Les meilleures pratiques de sécurité informatique',
                text_preview: 'La sécurité informatique est essentielle pour protéger les données sensibles...',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'paragraph',
                      text: 'La sécurité informatique est essentielle pour protéger les données sensibles de votre entreprise.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Découvrez nos conseils pour sécuriser votre infrastructure IT.'
                    }
                  ]
                })
              }
            ];
            
            const insertStmt = db.prepare('INSERT INTO articles (date, titre, text_preview, content_json) VALUES (?, ?, ?, ?)');
            
            articles.forEach(article => {
              insertStmt.run(article.date, article.titre, article.text_preview, article.content_json);
            });
            
            insertStmt.finalize();
            console.log('Données d\'exemple insérées dans la table ARTICLES');
          }
        });
      }
    });
    
    // Créer la table ACTUS
    db.run(`
      CREATE TABLE IF NOT EXISTS actus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        titre TEXT NOT NULL,
        text_preview TEXT NOT NULL,
        img_path TEXT,
        content_json TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table actus:', err.message);
      } else {
        console.log('Table ACTUS prête');
        
        // Vérifier si la table est vide
        db.get('SELECT COUNT(*) as count FROM actus', [], (err, row) => {
          if (err) {
            console.error('Erreur lors de la vérification des données:', err.message);
          } else if (row.count === 0) {
            // Insérer des données d'exemple
            const actus = [
              {
                date: '2023-07-10',
                titre: 'RIM Conseil participe au salon de l\'innovation',
                text_preview: 'Notre équipe sera présente au salon de l\'innovation technologique...',
                img_path: '/images/salon-innovation.jpg',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'paragraph',
                      text: 'Notre équipe sera présente au salon de l\'innovation technologique qui se tiendra le mois prochain.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Venez nous rencontrer sur notre stand pour découvrir nos dernières solutions.'
                    }
                  ]
                })
              },
              {
                date: '2023-08-22',
                titre: 'Nouveau partenariat stratégique',
                text_preview: 'RIM Conseil annonce un nouveau partenariat stratégique...',
                img_path: '/images/partenariat.jpg',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'paragraph',
                      text: 'RIM Conseil annonce un nouveau partenariat stratégique avec un leader du marché.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Cette collaboration nous permettra d\'offrir des services encore plus complets à nos clients.'
                    }
                  ]
                })
              }
            ];
            
            const insertStmt = db.prepare('INSERT INTO actus (date, titre, text_preview, img_path, content_json) VALUES (?, ?, ?, ?, ?)');
            
            actus.forEach(actu => {
              insertStmt.run(actu.date, actu.titre, actu.text_preview, actu.img_path, actu.content_json);
            });
            
            insertStmt.finalize();
            console.log('Données d\'exemple insérées dans la table ACTUS');
          }
        });
      }
    });
    
    // Créer la table USERS
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table users:', err.message);
      } else {
        console.log('Table USERS prête');
        
        // Vérifier si la table est vide
        db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
          if (err) {
            console.error('Erreur lors de la vérification des données:', err.message);
          } else if (row.count === 0) {
            // Insérer des données d'exemple (mot de passe: 'password123')
            const users = [
              {
                email: 'admin@rimconseil.fr',
                // Dans un cas réel, il faudrait hacher le mot de passe
                password: 'password123'
              },
              {
                email: 'user@rimconseil.fr',
                password: 'password123'
              }
            ];
            
            const insertStmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
            
            users.forEach(user => {
              insertStmt.run(user.email, user.password);
            });
            
            insertStmt.finalize();
            console.log('Données d\'exemple insérées dans la table USERS');
          }
        });
      }
    });
    
    // Créer la table PAGES
    db.run(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        content_json TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table pages:', err.message);
      } else {
        console.log('Table PAGES prête');
        
        // Vérifier si la table est vide
        db.get('SELECT COUNT(*) as count FROM pages', [], (err, row) => {
          if (err) {
            console.error('Erreur lors de la vérification des données:', err.message);
          } else if (row.count === 0) {
            // Insérer des données d'exemple
            const pages = [
              {
                path: '/a-propos',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'heading',
                      text: 'À propos de RIM Conseil'
                    },
                    {
                      type: 'paragraph',
                      text: 'RIM Conseil est une entreprise spécialisée dans la transformation digitale, fondée en 2010.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Notre mission est d\'accompagner les entreprises dans leur évolution numérique.'
                    }
                  ]
                })
              },
              {
                path: '/contact',
                content_json: JSON.stringify({
                  blocks: [
                    {
                      type: 'heading',
                      text: 'Contactez-nous'
                    },
                    {
                      type: 'paragraph',
                      text: 'Vous pouvez nous contacter par email à contact@rimconseil.fr ou par téléphone au 01 23 45 67 89.'
                    },
                    {
                      type: 'paragraph',
                      text: 'Notre équipe est à votre disposition pour répondre à toutes vos questions.'
                    }
                  ]
                })
              }
            ];
            
            const insertStmt = db.prepare('INSERT INTO pages (path, content_json) VALUES (?, ?)');
            
            pages.forEach(page => {
              insertStmt.run(page.path, page.content_json);
            });
            
            insertStmt.finalize();
            console.log('Données d\'exemple insérées dans la table PAGES');
          }
        });
      }
    });
    
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
    `, (err) => {
      if (err) {
        console.error('Erreur lors de la création de la table messages:', err.message);
      } else {
        console.log('Table MESSAGES prête');
      }
    });
  }
});

// Promisifier les méthodes de la base de données
const dbAsync = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          // this.lastID et this.changes sont disponibles ici
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

module.exports = dbAsync; 