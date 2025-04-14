const express = require('express');
const db = require('./config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

const cors = require('cors');
app.use(cors());

// Configuration de Multer pour les uploads d'images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  // Accepter uniquement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite à 5 MB
  },
  fileFilter: fileFilter
});

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== MIDDLEWARE D'AUTHENTIFICATION =====

// Middleware pour vérifier le token JWT
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
    }
    
    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Format de token invalide. Utilisez "Bearer <token>".' });
    }
    
    const token = parts[1];
    
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expiré.' });
        }
        return res.status(401).json({ message: 'Token invalide.' });
      }
      
      try {
        // Vérifier que l'utilisateur existe toujours dans la base de données
        const user = await db.get('SELECT id, email FROM users WHERE id = ?', [payload.id]);
        if (!user) {
          return res.status(401).json({ message: 'Utilisateur non trouvé.' });
        }
        
        // Ajouter l'utilisateur à l'objet requête pour y accéder dans les routes
        // Si la colonne 'role' n'existe pas, on utilise 'user' par défaut
        req.user = {
          ...user,
          role: payload.role || 'user' // Utiliser le rôle du token ou 'user' par défaut
        };
        
        next();
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'authentification' });
      }
    });
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur lors de l\'authentification' });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
const checkRole = (roles) => {
  return async (req, res, next) => {
    // L'utilisateur doit déjà être authentifié (req.user est défini par authenticateJWT)
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    try {
      // Vérifier si l'utilisateur a le rôle requis
      if (roles.includes(req.user.role)) {
        next();
      } else {
        return res.status(403).json({ message: 'Accès interdit: permissions insuffisantes' });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return res.status(500).json({ message: 'Erreur lors de la vérification des permissions' });
    }
  };
};

// Route principale
app.get('/', async (req, res) => {
  try {
    const articles = await db.all('SELECT id, date, titre, text_preview FROM articles ORDER BY date DESC');
    const actus = await db.all('SELECT id, date, titre, text_preview, img_path FROM actus ORDER BY date DESC LIMIT 3');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RIM Conseil - Backend API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2 { color: #333; }
          .item { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
          .date { color: #666; font-size: 0.9em; }
          .preview { margin-top: 10px; }
          .api-routes { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>RIM Conseil - Backend API</h1>
        
        <h2>Articles récents</h2>
        ${articles.map(article => `
          <div class="item">
            <h3>${article.titre}</h3>
            <div class="date">${article.date}</div>
            <div class="preview">${article.text_preview}</div>
          </div>
        `).join('')}
        
        <h2>Actualités récentes</h2>
        ${actus.map(actu => `
          <div class="item">
            <h3>${actu.titre}</h3>
            <div class="date">${actu.date}</div>
            ${actu.img_path ? `<div><img src="${actu.img_path}" alt="${actu.titre}" style="max-width: 100%; height: auto; margin: 10px 0;"></div>` : ''}
            <div class="preview">${actu.text_preview}</div>
          </div>
        `).join('')}
        
        <div class="api-routes">
          <h2>Routes API disponibles</h2>
          <h3>Articles:</h3>
          <ul>
            <li><code>GET /api/articles</code> - Liste de tous les articles</li>
            <li><code>GET /api/articles/:id</code> - Détails d'un article</li>
            <li><code>POST /api/articles</code> - Créer un nouvel article</li>
            <li><code>PATCH /api/articles/:id</code> - Mettre à jour un article</li>
            <li><code>DELETE /api/articles/:id</code> - Supprimer un article</li>
          </ul>
          
          <h3>Actualités:</h3>
          <ul>
            <li><code>GET /api/actus</code> - Liste de toutes les actualités</li>
            <li><code>GET /api/actus/:id</code> - Détails d'une actualité</li>
            <li><code>POST /api/actus</code> - Créer une nouvelle actualité</li>
            <li><code>PATCH /api/actus/:id</code> - Mettre à jour une actualité</li>
            <li><code>DELETE /api/actus/:id</code> - Supprimer une actualité</li>
          </ul>
          
          <h3>Authentification:</h3>
          <ul>
            <li><code>POST /api/users</code> - Créer un nouvel utilisateur (inscription)</li>
            <li><code>POST /api/login</code> - Connexion d'un utilisateur (retourne un token JWT)</li>
            <li><code>GET /api/user/me</code> - Récupérer les informations de l'utilisateur connecté (nécessite un token)</li>
          </ul>
          
          <h3>Pages:</h3>
          <ul>
            <li><code>GET /api/pages</code> - Liste de toutes les pages</li>
            <li><code>GET /api/pages/:id</code> - Détails d'une page</li>
            <li><code>POST /api/pages</code> - Créer une nouvelle page</li>
            <li><code>PATCH /api/pages/:id</code> - Mettre à jour une page</li>
            <li><code>DELETE /api/pages/:id</code> - Supprimer une page</li>
          </ul>
          
          <h3>Messages:</h3>
          <ul>
            <li><code>GET /api/messages</code> - Liste de tous les messages</li>
            <li><code>POST /api/messages</code> - Envoyer un nouveau message</li>
          </ul>
          
          <h3>Email:</h3>
          <ul>
            <li><code>POST /api/send-email</code> - Envoyer un email avec le texte fourni</li>
          </ul>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});

// ===== ROUTES POUR LES ARTICLES =====

// GET - Récupérer tous les articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await db.all('SELECT * FROM articles ORDER BY date DESC');
    res.json(articles);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
  }
});

// GET - Récupérer un article par ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    
    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
});

// POST - Créer un nouvel article
app.post('/api/articles', authenticateJWT, async (req, res) => {
  try {
    console.log('Requête reçue pour créer un article:', req.body);
    const { date, titre, text_preview, content_json, path } = req.body;
    
    console.log('Champs extraits:', { date, titre, text_preview, content_json: typeof content_json });
    
    if (!date || !titre || !text_preview || !content_json) {
      console.log('Validation échouée, champs manquants:', { date: !date, titre: !titre, text_preview: !text_preview, content_json: !content_json });
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Convertir content_json en chaîne JSON si ce n'est pas déjà le cas
    const contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
    
    const result = await db.run(
      'INSERT INTO articles (date, titre, text_preview, content_json, path) VALUES (?, ?, ?, ?, ?)',
      [date, titre, text_preview, contentJsonStr, path || null]
    );
    
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [result.lastID]);
    
    res.status(201).json(article);
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'article' });
  }
});

// PATCH - Mettre à jour un article
app.patch('/api/articles/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, titre, text_preview, content_json, path } = req.body;
    
    // Récupérer l'article existant
    const existingArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    
    if (!existingArticle) {
      return res.status(404).json({ message: "Article non trouvé" });
    }
    
    // Convertir content_json en chaîne JSON si ce n'est pas déjà le cas et s'il est fourni
    let contentJsonStr = existingArticle.content_json;
    if (content_json !== undefined) {
      contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      date: date || existingArticle.date,
      titre: titre || existingArticle.titre,
      text_preview: text_preview || existingArticle.text_preview,
      content_json: contentJsonStr,
      path: path !== undefined ? path : existingArticle.path
    };
    
    const result = await db.run(
      'UPDATE articles SET date = ?, titre = ?, text_preview = ?, content_json = ?, path = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.path, id]
    );
    
    if (result.changes > 0) {
      const updatedArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
      res.json(updatedArticle);
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'article' });
  }
});

// DELETE - Supprimer un article
app.delete('/api/articles/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.run('DELETE FROM articles WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      res.json({ message: "Article supprimé avec succès" });
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'article' });
  }
});

// ===== ROUTES POUR LES ACTUS =====

// GET - Récupérer toutes les actus
app.get('/api/actus', async (req, res) => {
  try {
    const actus = await db.all('SELECT * FROM actus ORDER BY date DESC');
    res.json(actus);
  } catch (error) {
    console.error('Erreur lors de la récupération des actus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des actus' });
  }
});

// GET - Récupérer une actu par ID
app.get('/api/actus/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const actu = await db.get('SELECT * FROM actus WHERE id = ?', [id]);
    
    if (actu) {
      res.json(actu);
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'actualité:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'actualité' });
  }
});

// POST - Créer une nouvelle actu avec upload d'image
app.post('/api/actus', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const { date, titre, text_preview, content_json } = req.body;
    
    if (!date || !titre || !text_preview || !content_json) {
      // Si une image a été uploadée mais qu'il y a une erreur, on la supprime
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Si une image a été uploadée, on récupère son chemin
    const img_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await db.run(
      'INSERT INTO actus (date, titre, text_preview, content_json, img_path) VALUES (?, ?, ?, ?, ?)',
      [date, titre, text_preview, content_json, img_path]
    );
    
    const actu = await db.get('SELECT * FROM actus WHERE id = ?', [result.lastID]);
    
    res.status(201).json(actu);
  } catch (error) {
    // Si une image a été uploadée mais qu'il y a une erreur, on la supprime
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erreur lors de la création de l\'actualité:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'actualité' });
  }
});

// PATCH - Mettre à jour une actu avec possibilité de changer l'image
app.patch('/api/actus/:id', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, titre, text_preview, content_json } = req.body;
    
    // Récupérer l'actu existante
    const existingActu = await db.get('SELECT * FROM actus WHERE id = ?', [id]);
    
    if (!existingActu) {
      // Si une image a été uploadée mais que l'actu n'existe pas, on la supprime
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Actualité non trouvée" });
    }
    
    // Si une nouvelle image est uploadée, supprimer l'ancienne si elle existe
    let img_path = existingActu.img_path;
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (existingActu.img_path) {
        const oldImagePath = path.join(__dirname, existingActu.img_path.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      img_path = `/uploads/${req.file.filename}`;
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      date: date || existingActu.date,
      titre: titre || existingActu.titre,
      text_preview: text_preview || existingActu.text_preview,
      content_json: content_json || existingActu.content_json,
      img_path: img_path
    };
    
    const result = await db.run(
      'UPDATE actus SET date = ?, titre = ?, text_preview = ?, content_json = ?, img_path = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.img_path, id]
    );
    
    if (result.changes > 0) {
      const updatedActu = await db.get('SELECT * FROM actus WHERE id = ?', [id]);
      res.json(updatedActu);
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
  } catch (error) {
    // Si une image a été uploadée mais qu'il y a une erreur, on la supprime
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erreur lors de la mise à jour de l\'actualité:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'actualité' });
  }
});

// DELETE - Supprimer une actu
app.delete('/api/actus/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Récupérer l'actualité pour pouvoir supprimer l'image associée
    const actu = await db.get('SELECT img_path FROM actus WHERE id = ?', [id]);
    
    if (!actu) {
      return res.status(404).json({ message: "Actualité non trouvée" });
    }
    
    // Supprimer l'image si elle existe
    if (actu.img_path) {
      const imagePath = path.join(__dirname, actu.img_path.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    const result = await db.run('DELETE FROM actus WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      res.json({ message: "Actualité supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'actualité:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'actualité' });
  }
});

// ===== ROUTES POUR LES USERS (Authentification) =====

// POST - Créer un nouvel utilisateur (Inscription)
app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10); // 10 est le nombre de tours de salage
    
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword] 
    );
    
    const user = await db.get('SELECT id, email FROM users WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// POST - Connexion d'un utilisateur
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    // Trouver l'utilisateur par email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects' }); // Ne pas spécifier si l'email ou le mdp est faux
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    // Générer le token JWT
    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.role || 'user' // Utiliser le rôle de l'utilisateur ou 'user' par défaut
    };
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: '10w' }; // Expiration dans 10 semaines

    const token = jwt.sign(payload, secret, options);

    res.json({ 
      message: 'Connexion réussie', 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'user' // Inclure le rôle dans la réponse
      } 
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// ===== ROUTES POUR LES PAGES =====

// GET - Récupérer toutes les pages
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await db.all('SELECT * FROM pages');
    res.json(pages);
  } catch (error) {
    console.error('Erreur lors de la récupération des pages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des pages' });
  }
});

// GET - Récupérer une page par ID
app.get('/api/pages/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const page = await db.get('SELECT * FROM pages WHERE id = ?', [id]);
    
    if (page) {
      res.json(page);
    } else {
      res.status(404).json({ message: "Page non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la page:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la page' });
  }
});

// POST - Créer une nouvelle page
app.post('/api/pages', authenticateJWT, async (req, res) => {
  try {
    const { path, content_json } = req.body;
    
    if (!path || !content_json) {
      return res.status(400).json({ message: 'Chemin et contenu sont requis' });
    }
    
    // Vérifier si le chemin existe déjà
    const existingPage = await db.get('SELECT id FROM pages WHERE path = ?', [path]);
    if (existingPage) {
      return res.status(400).json({ message: 'Ce chemin existe déjà' });
    }
    
    const result = await db.run(
      'INSERT INTO pages (path, content_json) VALUES (?, ?)',
      [path, content_json]
    );
    
    const page = await db.get('SELECT * FROM pages WHERE id = ?', [result.lastID]);
    
    res.status(201).json(page);
  } catch (error) {
    console.error('Erreur lors de la création de la page:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la page' });
  }
});

// PATCH - Mettre à jour une page
app.patch('/api/pages/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { path, content_json } = req.body;
    
    // Récupérer la page existante
    const existingPage = await db.get('SELECT * FROM pages WHERE id = ?', [id]);
    
    if (!existingPage) {
      return res.status(404).json({ message: "Page non trouvée" });
    }
    
    // Vérifier si le nouveau chemin existe déjà (sauf pour la page actuelle)
    if (path && path !== existingPage.path) {
      const pageWithSamePath = await db.get('SELECT id FROM pages WHERE path = ? AND id != ?', [path, id]);
      if (pageWithSamePath) {
        return res.status(400).json({ message: 'Ce chemin est déjà utilisé par une autre page' });
      }
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      path: path || existingPage.path,
      content_json: content_json || existingPage.content_json
    };
    
    const result = await db.run(
      'UPDATE pages SET path = ?, content_json = ? WHERE id = ?',
      [updatedData.path, updatedData.content_json, id]
    );
    
    if (result.changes > 0) {
      const updatedPage = await db.get('SELECT * FROM pages WHERE id = ?', [id]);
      res.json(updatedPage);
    } else {
      res.status(404).json({ message: "Page non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la page:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la page' });
  }
});

// DELETE - Supprimer une page
app.delete('/api/pages/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.run('DELETE FROM pages WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      res.json({ message: "Page supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Page non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la page:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la page' });
  }
});

// ===== ROUTE POUR ENVOYER UN EMAIL =====

// POST - Envoyer un email
app.post('/api/send-email', authenticateJWT, async (req, res) => {
  try {
    const { texte } = req.body;
    
    if (!texte) {
      return res.status(400).json({ message: 'Le champ texte est requis' });
    }
    
    // Configuration du transporteur email avec SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Configuration du message
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'remi.dufeu@gmail.com',
      subject: 'Nouveau message depuis RIM Conseil',
      text: texte
    };
    
    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Email envoyé avec succès',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// ===== ROUTES POUR LES MESSAGES =====

// GET - Récupérer tous les messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await db.all('SELECT * FROM messages ORDER BY date DESC');
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// POST - Créer un nouveau message
app.post('/api/messages', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, sujet, message } = req.body;
    
    // Vérifier que les champs requis sont présents
    if (!nom || !prenom || !email || !sujet || !message) {
      return res.status(400).json({ message: 'Les champs nom, prenom, email, sujet et message sont requis' });
    }
    
    // Créer la date actuelle au format ISO
    const date = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO messages (nom, prenom, email, telephone, sujet, message, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, telephone || null, sujet, message, date, 0]
    );
    
    const newMessage = await db.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: newMessage
    });
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// ===== ROUTES POUR L'UTILISATEUR AUTHENTIFIÉ =====

// GET - Récupérer les informations de l'utilisateur connecté
app.get('/api/user/me', authenticateJWT, async (req, res) => {
  // req.user est défini par le middleware authenticateJWT
  res.json(req.user);
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});