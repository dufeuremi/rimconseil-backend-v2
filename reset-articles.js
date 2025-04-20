const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, './database.sqlite');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
    process.exit(1);
  }
  
  console.log('Connecté à la base de données SQLite');
  
  // Supprimer la table articles si elle existe
  db.run(`DROP TABLE IF EXISTS articles`, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression de la table articles:', err.message);
      process.exit(1);
    }
    
    console.log('Table articles supprimée avec succès');
    
    // Recréer la table ARTICLES avec le schéma correct
    db.run(`
      CREATE TABLE articles (
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
        process.exit(1);
      }
      
      console.log('Table ARTICLES recréée avec succès');
      
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
      
      // Préparer la requête d'insertion
      const insertStmt = db.prepare('INSERT INTO articles (date, titre, text_preview, content_json) VALUES (?, ?, ?, ?)');
      
      // Insérer les articles
      articles.forEach(article => {
        insertStmt.run(article.date, article.titre, article.text_preview, article.content_json);
      });
      
      // Finaliser la préparation
      insertStmt.finalize(() => {
        console.log('Données d\'exemple insérées dans la table ARTICLES');
        
        // Fermer la connexion à la base de données
        db.close(() => {
          console.log('Connexion à la base de données fermée');
          console.log('Réinitialisation de la table articles terminée avec succès');
        });
      });
    });
  });
}); 