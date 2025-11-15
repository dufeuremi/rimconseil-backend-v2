const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite pour associer les modèles aux scènes');
  }
});

// Fonction pour associer un modèle à une scène
async function associateModelToScene(sceneName, ammunitionType) {
  try {
    // Récupérer la scène
    const scene = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM scenes_3d WHERE name = ?', [sceneName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!scene) {
      console.log(`❌ Scène ${sceneName} non trouvée`);
      return;
    }

    // Récupérer le modèle correspondant
    const model = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM models_3d WHERE ammunition_type = ?', [ammunitionType], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!model) {
      console.log(`❌ Modèle pour le type ${ammunitionType} non trouvé`);
      return;
    }

    // Vérifier si l'association existe déjà
    const existingAssociation = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM scene_models WHERE scene_id = ? AND model_id = ?', 
        [scene.id, model.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingAssociation) {
      console.log(`✅ Association déjà existante: ${scene.name} <-> ${model.name}`);
      return;
    }

    // Créer l'association avec des positions adaptées à chaque type
    let position = { x: 0, y: 0, z: 0 };
    let rotation = { x: 0, y: 0, z: 0 };
    let scale = { x: 1, y: 1, z: 1 };

    // Positions et échelles spécifiques selon le type d'ammunition
    switch (ammunitionType) {
      case 'gun':
        position = { x: 0, y: 0, z: 0 };
        rotation = { x: 0, y: 0, z: 0 };
        scale = { x: 1, y: 1, z: 1 };
        break;
      case 'rifle':
        position = { x: 0, y: 0, z: 0 };
        rotation = { x: 0, y: 0, z: 0 };
        scale = { x: 1, y: 1, z: 1 };
        break;
      case 'rocket':
        position = { x: 0, y: 0, z: 0 };
        rotation = { x: 0, y: 0, z: 0 };
        scale = { x: 1, y: 1, z: 1 };
        break;
      case 'sniper':
        position = { x: 0, y: 0, z: 0 };
        rotation = { x: 0, y: 0, z: 0 };
        scale = { x: 1, y: 1, z: 1 };
        break;
    }

    // Insérer l'association
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO scene_models 
         (scene_id, model_id, position_x, position_y, position_z, 
          rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [scene.id, model.id, position.x, position.y, position.z, 
         rotation.x, rotation.y, rotation.z, scale.x, scale.y, scale.z],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    console.log(`✅ Association créée: ${scene.name} <-> ${model.name}`);

  } catch (error) {
    console.error(`❌ Erreur lors de l'association ${sceneName} <-> ${ammunitionType}:`, error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🎬 Association des modèles aux scènes 3D...\n');

  // Associations à créer
  const associations = [
    { sceneName: 'scene_gun_showcase', ammunitionType: 'gun' },
    { sceneName: 'scene_rifle_showcase', ammunitionType: 'rifle' },
    { sceneName: 'scene_rocket_showcase', ammunitionType: 'rocket' },
    { sceneName: 'scene_sniper_showcase', ammunitionType: 'sniper' }
  ];

  // Créer toutes les associations
  for (const association of associations) {
    await associateModelToScene(association.sceneName, association.ammunitionType);
  }

  console.log('\n🎯 Vérification des associations créées...\n');

  // Vérifier les associations créées
  const allAssociations = await new Promise((resolve, reject) => {
    db.all(`
      SELECT s.name as scene_name, s.ammunition_type, m.name as model_name,
             sm.position_x, sm.position_y, sm.position_z,
             sm.rotation_x, sm.rotation_y, sm.rotation_z,
             sm.scale_x, sm.scale_y, sm.scale_z
      FROM scene_models sm
      INNER JOIN scenes_3d s ON sm.scene_id = s.id
      INNER JOIN models_3d m ON sm.model_id = m.id
      ORDER BY s.ammunition_type
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log('📋 Associations créées:');
  allAssociations.forEach(assoc => {
    console.log(`  • ${assoc.scene_name} (${assoc.ammunition_type}) <-> ${assoc.model_name}`);
    console.log(`    Position: (${assoc.position_x}, ${assoc.position_y}, ${assoc.position_z})`);
    console.log(`    Rotation: (${assoc.rotation_x}, ${assoc.rotation_y}, ${assoc.rotation_z})`);
    console.log(`    Échelle: (${assoc.scale_x}, ${assoc.scale_y}, ${assoc.scale_z})`);
    console.log('');
  });

  console.log(`✅ ${allAssociations.length} associations créées avec succès!`);
}

// Exécuter le script
main().then(() => {
  // Fermer la base de données
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message);
    } else {
      console.log('✅ Base de données fermée. Associations terminées!');
    }
  });
}).catch(error => {
  console.error('❌ Erreur lors de l\'exécution du script:', error);
  db.close();
});





