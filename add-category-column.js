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
  
  // Ajouter la colonne category à la table articles
  db.run(`ALTER TABLE articles ADD COLUMN category TEXT DEFAULT '[]'`, (err) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de la colonne category à la table articles:', err.message);
    } else {
      console.log('Colonne category ajoutée à la table articles avec succès');
      
      // Exemple de mise à jour d'articles avec des catégories
      updateArticlesWithCategories();
    }
  });
  
  // Ajouter la colonne category à la table actus
  db.run(`ALTER TABLE actus ADD COLUMN category TEXT DEFAULT '[]'`, (err) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de la colonne category à la table actus:', err.message);
    } else {
      console.log('Colonne category ajoutée à la table actus avec succès');
      
      // Exemple de mise à jour d'actus avec des catégories
      updateActusWithCategories();
    }
  });
  
  // Fonction pour mettre à jour les articles existants avec des catégories
  function updateArticlesWithCategories() {
    // Récupérer tous les articles
    db.all('SELECT id FROM articles', [], (err, articles) => {
      if (err) {
        console.error('Erreur lors de la récupération des articles:', err.message);
        return;
      }
      
      // Pour chaque article, attribuer des catégories aléatoires
      articles.forEach(article => {
        const categories = getRandomCategories(['Web', 'Sécurité', 'Cloud', 'DevOps', 'Mobile', 'IA']);
        
        db.run(
          'UPDATE articles SET category = ? WHERE id = ?',
          [JSON.stringify(categories), article.id],
          (err) => {
            if (err) {
              console.error(`Erreur lors de la mise à jour de l'article ${article.id}:`, err.message);
            } else {
              console.log(`Article ${article.id} mis à jour avec les catégories:`, categories);
            }
          }
        );
      });
    });
  }
  
  // Fonction pour mettre à jour les actus existantes avec des catégories
  function updateActusWithCategories() {
    // Récupérer toutes les actus
    db.all('SELECT id FROM actus', [], (err, actus) => {
      if (err) {
        console.error('Erreur lors de la récupération des actus:', err.message);
        return;
      }
      
      // Pour chaque actu, attribuer des catégories aléatoires
      actus.forEach(actu => {
        const categories = getRandomCategories(['Événement', 'Partenariat', 'Innovation', 'Entreprise', 'Recrutement']);
        
        db.run(
          'UPDATE actus SET category = ? WHERE id = ?',
          [JSON.stringify(categories), actu.id],
          (err) => {
            if (err) {
              console.error(`Erreur lors de la mise à jour de l'actu ${actu.id}:`, err.message);
            } else {
              console.log(`Actu ${actu.id} mise à jour avec les catégories:`, categories);
            }
          }
        );
      });
    });
  }
  
  // Fonction utilitaire pour obtenir des catégories aléatoires
  function getRandomCategories(allCategories) {
    // Nombre aléatoire de catégories entre 1 et 3
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const categories = [];
    
    // Mélanger le tableau de catégories
    const shuffled = [...allCategories].sort(() => 0.5 - Math.random());
    
    // Sélectionner les premières numCategories
    for (let i = 0; i < Math.min(numCategories, shuffled.length); i++) {
      categories.push(shuffled[i]);
    }
    
    return categories;
  }
  
  // Fermer la connexion après toutes les opérations
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la connexion:', err.message);
      } else {
        console.log('Connexion à la base de données fermée');
        console.log('Opération terminée avec succès');
      }
    });
  }, 2000); // Attendre 2 secondes pour s'assurer que toutes les opérations asynchrones sont terminées
}); 