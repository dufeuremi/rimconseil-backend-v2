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
  
  // Créer la table PAGE_CONTENT
  db.run(`
    CREATE TABLE IF NOT EXISTS page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Erreur lors de la création de la table page_content:', err.message);
      process.exit(1);
    }
    
    console.log('Table PAGE_CONTENT créée avec succès');
    
    // Vérifier si la table est vide et insérer des données d'exemple
    db.get('SELECT COUNT(*) as count FROM page_content', [], (err, row) => {
      if (err) {
        console.error('Erreur lors de la vérification des données:', err.message);
        process.exit(1);
      } else if (row.count === 0) {
        // Insérer des données d'exemple
        const pageContents = [
          {
            page_name: 'home',
            content: JSON.stringify({
              blocks: [
                {
                  type: 'heading',
                  text: 'Bienvenue chez RIM Conseil'
                },
                {
                  type: 'paragraph',
                  text: 'Nous sommes spécialisés dans la transformation digitale des entreprises.'
                },
                {
                  type: 'paragraph',
                  text: 'Découvrez nos services et notre expertise pour accompagner votre évolution numérique.'
                }
              ]
            })
          },
          {
            page_name: 'services',
            content: JSON.stringify({
              blocks: [
                {
                  type: 'heading',
                  text: 'Nos Services'
                },
                {
                  type: 'paragraph',
                  text: 'RIM Conseil propose une gamme complète de services pour votre transformation digitale.'
                },
                {
                  type: 'list',
                  items: [
                    'Conseil en stratégie digitale',
                    'Développement d\'applications web et mobile',
                    'Migration vers le cloud',
                    'Sécurité informatique',
                    'Formation et accompagnement'
                  ]
                }
              ]
            })
          }
        ];
        
        // Préparer la requête d'insertion
        const insertStmt = db.prepare('INSERT INTO page_content (page_name, content) VALUES (?, ?)');
        
        // Insérer les contenus de pages
        pageContents.forEach(pageContent => {
          insertStmt.run(pageContent.page_name, pageContent.content);
        });
        
        // Finaliser la préparation
        insertStmt.finalize(() => {
          console.log('Données d\'exemple insérées dans la table PAGE_CONTENT');
          
          // Fermer la connexion à la base de données
          db.close(() => {
            console.log('Connexion à la base de données fermée');
            console.log('Création de la table page_content terminée avec succès');
          });
        });
      } else {
        console.log('La table PAGE_CONTENT contient déjà des données');
        
        // Fermer la connexion à la base de données
        db.close(() => {
          console.log('Connexion à la base de données fermée');
        });
      }
    });
  });
}); 