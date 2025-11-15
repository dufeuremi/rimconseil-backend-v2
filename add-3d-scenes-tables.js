const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite pour ajouter les tables 3D');
  }
});

// Créer la table des scènes 3D
db.run(`
  CREATE TABLE IF NOT EXISTS scenes_3d (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    ammunition_type TEXT NOT NULL,
    scene_config JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Erreur lors de la création de la table scenes_3d:', err.message);
  } else {
    console.log('✅ Table scenes_3d créée avec succès');
  }
});

// Créer la table des modèles 3D
db.run(`
  CREATE TABLE IF NOT EXISTS models_3d (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ammunition_type TEXT NOT NULL,
    obj_file_path TEXT NOT NULL,
    texture_file_path TEXT,
    model_config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Erreur lors de la création de la table models_3d:', err.message);
  } else {
    console.log('✅ Table models_3d créée avec succès');
  }
});

// Créer la table de liaison scènes-modèles
db.run(`
  CREATE TABLE IF NOT EXISTS scene_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    model_id INTEGER NOT NULL,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    position_z REAL DEFAULT 0,
    rotation_x REAL DEFAULT 0,
    rotation_y REAL DEFAULT 0,
    rotation_z REAL DEFAULT 0,
    scale_x REAL DEFAULT 1,
    scale_y REAL DEFAULT 1,
    scale_z REAL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scene_id) REFERENCES scenes_3d (id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models_3d (id) ON DELETE CASCADE,
    UNIQUE(scene_id, model_id)
  )
`, (err) => {
  if (err) {
    console.error('Erreur lors de la création de la table scene_models:', err.message);
  } else {
    console.log('✅ Table scene_models créée avec succès');
  }
});

// Insérer les modèles d'ammunition
const ammunitionModels = [
  {
    name: 'Arme de poing',
    ammunition_type: 'gun',
    obj_file_path: 'models/3d/ammunition/amu_gun.obj',
    texture_file_path: 'models/3d/ammunition/amu_gun.png',
    model_config: JSON.stringify({
      boundingBox: { width: 1.0, height: 0.2, depth: 0.4 },
      materials: ['metal', 'plastic'],
      animations: []
    })
  },
  {
    name: 'Fusil d\'assaut',
    ammunition_type: 'rifle',
    obj_file_path: 'models/3d/ammunition/amu_rifle.obj',
    texture_file_path: 'models/3d/ammunition/amu_rifle.png',
    model_config: JSON.stringify({
      boundingBox: { width: 2.0, height: 0.2, depth: 0.4 },
      materials: ['metal', 'plastic', 'wood'],
      animations: ['reload', 'fire']
    })
  },
  {
    name: 'Roquette',
    ammunition_type: 'rocket',
    obj_file_path: 'models/3d/ammunition/amu_rocket.obj',
    texture_file_path: 'models/3d/ammunition/amu_rocket.png',
    model_config: JSON.stringify({
      boundingBox: { width: 1.5, height: 0.2, depth: 0.2 },
      materials: ['metal', 'explosive'],
      animations: ['launch', 'explode']
    })
  },
  {
    name: 'Fusil de sniper',
    ammunition_type: 'sniper',
    obj_file_path: 'models/3d/ammunition/amu_sniper.obj',
    texture_file_path: 'models/3d/ammunition/amu_sniper.png',
    model_config: JSON.stringify({
      boundingBox: { width: 3.2, height: 0.2, depth: 0.4 },
      materials: ['metal', 'plastic', 'glass'],
      animations: ['aim', 'fire', 'reload']
    })
  }
];

// Insérer les modèles en base
ammunitionModels.forEach((model, index) => {
  db.run(
    'INSERT OR REPLACE INTO models_3d (name, ammunition_type, obj_file_path, texture_file_path, model_config) VALUES (?, ?, ?, ?, ?)',
    [model.name, model.ammunition_type, model.obj_file_path, model.texture_file_path, model.model_config],
    function(err) {
      if (err) {
        console.error(`Erreur lors de l'insertion du modèle ${model.name}:`, err.message);
      } else {
        console.log(`✅ Modèle ${model.name} inséré avec l'ID: ${this.lastID}`);
      }
    }
  );
});

// Insérer les scènes uniques pour chaque type d'ammunition
const ammunitionScenes = [
  {
    name: 'scene_gun_showcase',
    description: 'Scène de présentation pour armes de poing',
    ammunition_type: 'gun',
    scene_config: JSON.stringify({
      lighting: {
        ambient: { r: 0.3, g: 0.3, b: 0.3 },
        directional: { r: 0.7, g: 0.7, b: 0.7, direction: { x: 1, y: -1, z: 0.5 } }
      },
      camera: {
        position: { x: 0, y: 1, z: 3 },
        target: { x: 0, y: 0, z: 0 }
      },
      environment: {
        background: { r: 0.1, g: 0.1, b: 0.2 },
        fog: { enabled: false }
      }
    })
  },
  {
    name: 'scene_rifle_showcase',
    description: 'Scène de présentation pour fusils d\'assaut',
    ammunition_type: 'rifle',
    scene_config: JSON.stringify({
      lighting: {
        ambient: { r: 0.4, g: 0.3, b: 0.2 },
        directional: { r: 0.8, g: 0.6, b: 0.4, direction: { x: 1, y: -1, z: 0.3 } }
      },
      camera: {
        position: { x: 0, y: 1.5, z: 4 },
        target: { x: 0, y: 0, z: 0 }
      },
      environment: {
        background: { r: 0.2, g: 0.15, b: 0.1 },
        fog: { enabled: true, density: 0.1 }
      }
    })
  },
  {
    name: 'scene_rocket_showcase',
    description: 'Scène de présentation pour roquettes',
    ammunition_type: 'rocket',
    scene_config: JSON.stringify({
      lighting: {
        ambient: { r: 0.2, g: 0.2, b: 0.3 },
        directional: { r: 0.6, g: 0.6, b: 0.8, direction: { x: 0.5, y: -1, z: 0.5 } }
      },
      camera: {
        position: { x: 0, y: 2, z: 5 },
        target: { x: 0, y: 0, z: 0 }
      },
      environment: {
        background: { r: 0.05, g: 0.05, b: 0.15 },
        fog: { enabled: true, density: 0.2 }
      }
    })
  },
  {
    name: 'scene_sniper_showcase',
    description: 'Scène de présentation pour fusils de sniper',
    ammunition_type: 'sniper',
    scene_config: JSON.stringify({
      lighting: {
        ambient: { r: 0.25, g: 0.25, b: 0.25 },
        directional: { r: 0.7, g: 0.7, b: 0.7, direction: { x: 1, y: -0.5, z: 0.8 } }
      },
      camera: {
        position: { x: 0, y: 1.2, z: 6 },
        target: { x: 0, y: 0, z: 0 }
      },
      environment: {
        background: { r: 0.1, g: 0.1, b: 0.1 },
        fog: { enabled: false }
      }
    })
  }
];

// Insérer les scènes en base
ammunitionScenes.forEach((scene, index) => {
  db.run(
    'INSERT OR REPLACE INTO scenes_3d (name, description, ammunition_type, scene_config) VALUES (?, ?, ?, ?)',
    [scene.name, scene.description, scene.ammunition_type, scene.scene_config],
    function(err) {
      if (err) {
        console.error(`Erreur lors de l'insertion de la scène ${scene.name}:`, err.message);
      } else {
        console.log(`✅ Scène ${scene.name} insérée avec l'ID: ${this.lastID}`);
      }
    }
  );
});

// Fermer la base de données après un délai pour permettre l'insertion
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message);
    } else {
      console.log('✅ Base de données fermée. Tables 3D créées avec succès!');
    }
  });
}, 2000);

