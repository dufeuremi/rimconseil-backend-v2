const express = require('express');
const db = require('./config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Configuration de DOMPurify pour la sanitisation HTML côté serveur
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const cors = require('cors');
app.use(cors());

// 📊 Middleware de logging des requêtes
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('fr-FR');
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Log de la requête entrante
  console.log(`\n📥 [${timestamp}] ${method} ${url}`);
  console.log(`🌐 IP: ${ip}`);
  
  // Log des paramètres pour certaines méthodes
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const bodyLog = { ...req.body };
    // Masquer les mots de passe dans les logs
    if (bodyLog.password) bodyLog.password = '***';
    if (Object.keys(bodyLog).length > 0) {
      console.log(`📋 Body:`, JSON.stringify(bodyLog, null, 2));
    }
  }
  
  // Log des paramètres d'URL
  if (Object.keys(req.params).length > 0) {
    console.log(`🔗 Params:`, req.params);
  }
  
  // Log des query parameters
  if (Object.keys(req.query).length > 0) {
    console.log(`❓ Query:`, req.query);
  }
  
  // Capturer le temps de début
  const startTime = Date.now();
  
  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode;
    
    // Log de la réponse
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '🔄' : '✅';
    console.log(`📤 ${statusEmoji} ${statusCode} - ${duration}ms`);
    console.log(`${'='.repeat(50)}`);
    
    originalSend.call(this, data);
  };
  
  next();
});

// ===== CONFIGURATION MULTER POUR LES UPLOADS D'IMAGES =====

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    // Générer un nom de fichier unique avec timestamp et random
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedOriginalName));
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  console.log(`📤 Upload tentative - Field: ${file.fieldname}, Type: ${file.mimetype}, Size: ${file.size || 'unknown'}`);
  
  // Accepter uniquement les images
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log(`✅ Fichier accepté: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ Type de fichier refusé: ${file.mimetype}`);
    cb(new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`), false);
  }
};

// Configuration Multer principale
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB par fichier
    files: 2 // Maximum 2 fichiers (image principale + image de couverture)
  },
  fileFilter: fileFilter
});

// Configuration pour plusieurs images
// - 'image' : Image principale (utilisée dans le contenu de l'article)
// - 'coverImage' : Image de couverture (utilisée pour l'affichage en liste)
const uploadMultiple = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// Fonction utilitaire pour gérer les erreurs d'upload (utilisée dans les routes)
function handleMulterError(err) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { 
        status: 400,
        message: 'Fichier trop volumineux. Taille maximum: 10MB' 
      };
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return { 
        status: 400,
        message: 'Trop de fichiers. Maximum: 2 fichiers (image + image de couverture)' 
      };
    }
    return { 
      status: 400,
      message: `Erreur d'upload: ${err.message}` 
    };
  }
  
  if (err) {
    return { 
      status: 400,
      message: err.message || 'Erreur lors de l\'upload des fichiers' 
    };
  }
  
  return null;
}

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== FONCTIONS UTILITAIRES POUR LA GESTION DES IMAGES =====

/**
 * Nettoie les fichiers uploadés en cas d'erreur
 * @param {Object} files - req.files de multer
 */
function cleanupUploadedFiles(files) {
  if (!files) return;
  
  Object.values(files).forEach(fileArray => {
    fileArray.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Fichier supprimé: ${file.path}`);
        } catch (error) {
          console.error(`❌ Erreur lors de la suppression du fichier ${file.path}:`, error);
        }
      }
    });
  });
}

/**
 * Supprime un fichier image du serveur
 * @param {string} imagePath - Chemin vers l'image (ex: "/uploads/image-123.jpg")
 */
function deleteImageFile(imagePath) {
  if (!imagePath) return;
  
  try {
    const fullPath = path.join(__dirname, imagePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Image supprimée: ${imagePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de l'image ${imagePath}:`, error);
  }
}

/**
 * Traite les fichiers uploadés et retourne les chemins d'images
 * @param {Object} files - req.files de multer
 * @returns {Object} - { img_path, cover_img_path }
 */
function processUploadedImages(files) {
  let img_path = null;
  let cover_img_path = null;
  
  if (files) {
    // Image principale
    if (files.image && files.image[0]) {
      img_path = `/uploads/${files.image[0].filename}`;
      console.log(`📷 Image principale uploadée: ${img_path}`);
    }
    
    // Image de couverture
    if (files.coverImage && files.coverImage[0]) {
      cover_img_path = `/uploads/${files.coverImage[0].filename}`;
      console.log(`🖼️  Image de couverture uploadée: ${cover_img_path}`);
    }
  }
  
  return { img_path, cover_img_path };
}

/**
 * Détermine l'image à afficher pour la liste/couverture selon la priorité
 * @param {Object} item - Article ou actu avec img_path et cover_img_path
 * @returns {string|null} - URL de l'image à afficher ou null
 */
function getDisplayImage(item) {
  // Priorité 1: Image de couverture
  if (item.cover_img_path) {
    return item.cover_img_path;
  }
  
  // Priorité 2: Image principale
  if (item.img_path) {
    return item.img_path;
  }
  
  // Aucune image
  return null;
}

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
    const articles = await db.all('SELECT id, date, titre, text_preview, img_path, cover_img_path FROM articles ORDER BY date DESC');
    const actus = await db.all('SELECT id, date, titre, text_preview, img_path, cover_img_path FROM actus ORDER BY date DESC LIMIT 3');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RIM Conseil - Backend API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2 { color: #333; }
          .item { 
            margin-bottom: 20px; 
            border: 1px solid #ccc; 
            border-radius: 8px; 
            overflow: hidden;
            display: flex;
            min-height: 150px;
          }
          .item-image {
            width: 200px;
            flex-shrink: 0;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .item-content {
            padding: 15px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          .item-title {
            margin: 0 0 10px 0;
            text-align: left;
            color: #333;
            font-size: 1.2em;
            font-weight: bold;
          }
          .date { 
            color: #666; 
            font-size: 0.9em; 
            margin-bottom: 10px;
          }
          .preview { 
            margin-top: auto;
            line-height: 1.4;
            color: #555;
          }
          .no-image-placeholder {
            color: #999;
            font-size: 0.9em;
            text-align: center;
          }
          .api-routes { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>RIM Conseil - Backend API</h1>
        
        <h2>Articles récents</h2>
        ${articles.map(article => `
          <div class="item">
            <div class="item-image">
              ${article.cover_img_path ? 
                `<img src="${article.cover_img_path}" alt="${article.titre}">` : 
                article.img_path ? 
                `<img src="${article.img_path}" alt="${article.titre}">` : 
                `<div class="no-image-placeholder">Pas d'image</div>`
              }
            </div>
            <div class="item-content">
              <h3 class="item-title">${article.titre}</h3>
              <div class="date">${article.date}</div>
              <div class="preview">${article.text_preview}</div>
            </div>
          </div>
        `).join('')}
        
        <h2>Actualités récentes</h2>
        ${actus.map(actu => `
          <div class="item">
            <div class="item-image">
              ${actu.cover_img_path ? 
                `<img src="${actu.cover_img_path}" alt="${actu.titre}">` : 
                actu.img_path ? 
                `<img src="${actu.img_path}" alt="${actu.titre}">` : 
                `<div class="no-image-placeholder">Pas d'image</div>`
              }
            </div>
            <div class="item-content">
              <h3 class="item-title">${actu.titre}</h3>
              <div class="date">${actu.date}</div>
              <div class="preview">${actu.text_preview}</div>
            </div>
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
          
          <h3>Contenus de Pages:</h3>
          <ul>
            <li><code>GET /api/page-content</code> - Liste de tous les contenus de pages</li>
            <li><code>GET /api/page-content/:id</code> - Détails d'un contenu de page par ID</li>
            <li><code>GET /api/page-content/by-name/:page_name</code> - Détails d'un contenu de page par nom</li>
            <li><code>POST /api/page-content</code> - Créer un nouveau contenu de page (protégé)</li>
            <li><code>PATCH /api/page-content/:id</code> - Mettre à jour un contenu de page (protégé)</li>
          </ul>
          
          <h3>Édition WYSIWYG d'éléments individuels:</h3>
          <ul>
            <li><code>GET /api/editable-content/:pageName</code> - Récupérer tous les éléments éditables d'une page</li>
            <li><code>POST /api/editable-content/bulk-update</code> - Mise à jour en lot de plusieurs éléments (protégé)</li>
            <li><code>PATCH /api/editable-content/element</code> - Mise à jour d'un élément individuel (protégé)</li>
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
    // Parser la colonne category en tableau JSON
    const articlesWithCategories = articles.map(article => ({
      ...article,
      category: article.category ? JSON.parse(article.category) : []
    }));
    res.json(articlesWithCategories);
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
      // Parser la colonne category en tableau JSON
      article.category = article.category ? JSON.parse(article.category) : [];
      res.json(article);
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
});

// POST - Créer un nouvel article avec upload d'images
app.post('/api/articles', authenticateJWT, (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'Fichier trop volumineux. Taille maximum: 10MB' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: 'Trop de fichiers. Maximum: 2 fichiers (image + image de couverture)' 
          });
        }
        return res.status(400).json({ 
          message: `Erreur d'upload: ${err.message}` 
        });
      }
      
      if (err) {
        return res.status(400).json({ 
          message: err.message || 'Erreur lors de l\'upload des fichiers' 
        });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🆕 Création d\'un nouvel article');
    console.log('📋 Body reçu:', req.body);
    console.log('📁 Fichiers reçus:', req.files);
    
    const { date, titre, text_preview, content_json, category } = req.body;
    
    // Validation des champs obligatoires
    if (!date || !titre || !text_preview || !content_json) {
      // Nettoyer les fichiers uploadés en cas d'erreur
      cleanupUploadedFiles(req.files);
      
      return res.status(400).json({ 
        message: 'Les champs date, titre, text_preview et content_json sont obligatoires',
        missing: {
          date: !date,
          titre: !titre,
          text_preview: !text_preview,
          content_json: !content_json
        }
      });
    }
    
    // Traitement des images
    const { img_path, cover_img_path } = processUploadedImages(req.files);
    
    // Conversion et validation du content_json
    let contentJsonStr;
    try {
      contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
      // Vérifier que c'est un JSON valide
      JSON.parse(contentJsonStr);
    } catch (jsonError) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ 
        message: 'Le champ content_json doit être un JSON valide' 
      });
    }
    
    // Traitement des catégories
    const categoryStr = category ? 
      (Array.isArray(category) ? JSON.stringify(category) : category) : 
      '[]';
    
    // Insertion en base de données
    const result = await db.run(
      'INSERT INTO articles (date, titre, text_preview, content_json, img_path, cover_img_path, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, titre, text_preview, contentJsonStr, img_path, cover_img_path, categoryStr]
    );
    
    // Récupération de l'article créé
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [result.lastID]);
    
    // Parser les catégories pour la réponse
    if (article.category) {
      try {
        article.category = JSON.parse(article.category);
      } catch (err) {
        article.category = [];
      }
    }
    
    console.log('✅ Article créé avec succès, ID:', result.lastID);
    res.status(201).json({
      message: 'Article créé avec succès',
      data: article
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'article:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    cleanupUploadedFiles(req.files);
    
    res.status(500).json({ 
      message: 'Erreur interne lors de la création de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH - Mettre à jour un article avec possibilité de changer les images
app.patch('/api/articles/:id', authenticateJWT, (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'Fichier trop volumineux. Taille maximum: 10MB' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: 'Trop de fichiers. Maximum: 2 fichiers (image + image de couverture)' 
          });
        }
        return res.status(400).json({ 
          message: `Erreur d'upload: ${err.message}` 
        });
      }
      
      if (err) {
        return res.status(400).json({ 
          message: err.message || 'Erreur lors de l\'upload des fichiers' 
        });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔧 Mise à jour de l'article ID: ${id}`);
    console.log('📋 Body reçu:', req.body);
    console.log('📁 Fichiers reçus:', req.files);
    
    const { 
      date, 
      titre, 
      text_preview, 
      content_json, 
      category, 
      is_online, 
      img_path: bodyImgPath, 
      cover_img_path: bodyCoverImagePath 
    } = req.body;
    
    // Récupérer l'article existant
    const existingArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    
    if (!existingArticle) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({ message: "Article non trouvé" });
    }
    
    // Gestion du content_json
    let contentJsonStr = existingArticle.content_json;
    if (content_json !== undefined) {
      try {
        contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
        // Vérifier que c'est un JSON valide
        JSON.parse(contentJsonStr);
      } catch (jsonError) {
        cleanupUploadedFiles(req.files);
        return res.status(400).json({ 
          message: 'Le champ content_json doit être un JSON valide' 
        });
      }
    }
    
    // Gestion de l'image principale
    let img_path = existingArticle.img_path;
    
    if (req.files && req.files.image) {
      // Nouvelle image uploadée -> supprimer l'ancienne
      if (existingArticle.img_path) {
        deleteImageFile(existingArticle.img_path);
      }
      img_path = `/uploads/${req.files.image[0].filename}`;
      console.log(`📷 Image principale mise à jour: ${img_path}`);
    } else if (bodyImgPath !== undefined) {
      // Valeur fournie dans le body
      if (bodyImgPath === null || bodyImgPath === '') {
        // Suppression de l'image demandée
        if (existingArticle.img_path) {
          deleteImageFile(existingArticle.img_path);
        }
        img_path = null;
        console.log('📷 Image principale supprimée');
      } else {
        // Nouveau chemin fourni
        img_path = bodyImgPath;
        console.log(`📷 Image principale mise à jour via body: ${img_path}`);
      }
    }
    
    // Gestion de l'image de couverture
    let cover_img_path = existingArticle.cover_img_path;
    
    if (req.files && req.files.coverImage) {
      // Nouvelle image de couverture uploadée -> supprimer l'ancienne
      if (existingArticle.cover_img_path) {
        deleteImageFile(existingArticle.cover_img_path);
      }
      cover_img_path = `/uploads/${req.files.coverImage[0].filename}`;
      console.log(`🖼️  Image de couverture mise à jour: ${cover_img_path}`);
    } else if (bodyCoverImagePath !== undefined) {
      // Valeur fournie dans le body
      if (bodyCoverImagePath === null || bodyCoverImagePath === '') {
        // Suppression de l'image demandée
        if (existingArticle.cover_img_path) {
          deleteImageFile(existingArticle.cover_img_path);
        }
        cover_img_path = null;
        console.log('🖼️  Image de couverture supprimée');
      } else {
        // Nouveau chemin fourni
        cover_img_path = bodyCoverImagePath;
        console.log(`🖼️  Image de couverture mise à jour via body: ${cover_img_path}`);
      }
    }
    
    // Gestion des catégories
    let categoryStr = existingArticle.category;
    if (category !== undefined) {
      categoryStr = Array.isArray(category) ? JSON.stringify(category) : category;
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      date: date || existingArticle.date,
      titre: titre || existingArticle.titre,
      text_preview: text_preview || existingArticle.text_preview,
      content_json: contentJsonStr,
      img_path: img_path,
      cover_img_path: cover_img_path,
      category: categoryStr,
      is_online: is_online !== undefined ? is_online : existingArticle.is_online
    };
    
    // Mise à jour en base de données
    const result = await db.run(
      'UPDATE articles SET date = ?, titre = ?, text_preview = ?, content_json = ?, img_path = ?, cover_img_path = ?, category = ?, is_online = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.img_path, updatedData.cover_img_path, updatedData.category, updatedData.is_online, id]
    );
    
    if (result.changes > 0) {
      const updatedArticle = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
      
      // Parser les catégories pour la réponse
      if (updatedArticle.category) {
        try {
          updatedArticle.category = JSON.parse(updatedArticle.category);
        } catch (err) {
          updatedArticle.category = [];
        }
      }
      
      console.log('✅ Article mis à jour avec succès');
      res.json({
        message: 'Article mis à jour avec succès',
        data: updatedArticle
      });
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'article:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    cleanupUploadedFiles(req.files);
    
    res.status(500).json({ 
      message: 'Erreur interne lors de la mise à jour de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE - Supprimer un article
app.delete('/api/articles/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🗑️  Suppression de l'article ID: ${id}`);
    
    // Récupérer l'article pour supprimer les images associées
    const article = await db.get('SELECT img_path, cover_img_path FROM articles WHERE id = ?', [id]);
    
    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }
    
    // Supprimer les images associées
    if (article.img_path) {
      deleteImageFile(article.img_path);
    }
    if (article.cover_img_path) {
      deleteImageFile(article.cover_img_path);
    }
    
    // Supprimer l'article de la base de données
    const result = await db.run('DELETE FROM articles WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      console.log('✅ Article supprimé avec succès');
      res.json({ 
        message: "Article supprimé avec succès",
        deletedId: id
      });
    } else {
      res.status(404).json({ message: "Article non trouvé" });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ 
      message: 'Erreur interne lors de la suppression de l\'article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== ROUTES POUR LES ACTUS =====

// GET - Récupérer toutes les actus
app.get('/api/actus', async (req, res) => {
  try {
    const actus = await db.all('SELECT * FROM actus ORDER BY date DESC');
    // Parser la colonne category en tableau JSON
    const actusWithCategories = actus.map(actu => ({
      ...actu,
      category: actu.category ? JSON.parse(actu.category) : []
    }));
    res.json(actusWithCategories);
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
      // Parser la colonne category en tableau JSON
      actu.category = actu.category ? JSON.parse(actu.category) : [];
      res.json(actu);
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'actualité:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'actualité' });
  }
});

// POST - Créer une nouvelle actualité avec upload d'images
app.post('/api/actus', authenticateJWT, (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'Fichier trop volumineux. Taille maximum: 10MB' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: 'Trop de fichiers. Maximum: 2 fichiers (image + image de couverture)' 
          });
        }
        return res.status(400).json({ 
          message: `Erreur d'upload: ${err.message}` 
        });
      }
      
      if (err) {
        return res.status(400).json({ 
          message: err.message || 'Erreur lors de l\'upload des fichiers' 
        });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🆕 Création d\'une nouvelle actualité');
    console.log('📋 Body reçu:', req.body);
    console.log('📁 Fichiers reçus:', req.files);
    
    const { date, titre, text_preview, content_json, category } = req.body;
    
    // Validation des champs obligatoires
    if (!date || !titre || !text_preview || !content_json) {
      // Nettoyer les fichiers uploadés en cas d'erreur
      cleanupUploadedFiles(req.files);
      
      return res.status(400).json({ 
        message: 'Les champs date, titre, text_preview et content_json sont obligatoires',
        missing: {
          date: !date,
          titre: !titre,
          text_preview: !text_preview,
          content_json: !content_json
        }
      });
    }
    
    // Traitement des images
    const { img_path, cover_img_path } = processUploadedImages(req.files);
    
    // Conversion et validation du content_json
    let contentJsonStr;
    try {
      contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
      // Vérifier que c'est un JSON valide
      JSON.parse(contentJsonStr);
    } catch (jsonError) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ 
        message: 'Le champ content_json doit être un JSON valide' 
      });
    }
    
    // Traitement des catégories
    const categoryStr = category ? 
      (Array.isArray(category) ? JSON.stringify(category) : category) : 
      '[]';
    
    // Insertion en base de données
    const result = await db.run(
      'INSERT INTO actus (date, titre, text_preview, content_json, img_path, cover_img_path, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, titre, text_preview, contentJsonStr, img_path, cover_img_path, categoryStr]
    );
    
    // Récupération de l'actualité créée
    const actu = await db.get('SELECT * FROM actus WHERE id = ?', [result.lastID]);
    
    // Parser les catégories pour la réponse
    if (actu.category) {
      try {
        actu.category = JSON.parse(actu.category);
      } catch (err) {
        actu.category = [];
      }
    }
    
    console.log('✅ Actualité créée avec succès, ID:', result.lastID);
    res.status(201).json({
      message: 'Actualité créée avec succès',
      data: actu
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'actualité:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    cleanupUploadedFiles(req.files);
    
    res.status(500).json({ 
      message: 'Erreur interne lors de la création de l\'actualité',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH - Mettre à jour une actualité avec possibilité de changer les images
app.patch('/api/actus/:id', authenticateJWT, (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'Fichier trop volumineux. Taille maximum: 10MB' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: 'Trop de fichiers. Maximum: 2 fichiers (image + image de couverture)' 
          });
        }
        return res.status(400).json({ 
          message: `Erreur d'upload: ${err.message}` 
        });
      }
      
      if (err) {
        return res.status(400).json({ 
          message: err.message || 'Erreur lors de l\'upload des fichiers' 
        });
      }
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔧 Mise à jour de l'actualité ID: ${id}`);
    console.log('📋 Body reçu:', req.body);
    console.log('📁 Fichiers reçus:', req.files);
    
    const { 
      date, 
      titre, 
      text_preview, 
      content_json, 
      category, 
      is_online, 
      img_path: bodyImgPath, 
      cover_img_path: bodyCoverImagePath 
    } = req.body;
    
    // Récupérer l'actualité existante
    const existingActu = await db.get('SELECT * FROM actus WHERE id = ?', [id]);
    
    if (!existingActu) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({ message: "Actualité non trouvée" });
    }
    
    // Gestion du content_json
    let contentJsonStr = existingActu.content_json;
    if (content_json !== undefined) {
      try {
        contentJsonStr = typeof content_json === 'object' ? JSON.stringify(content_json) : content_json;
        // Vérifier que c'est un JSON valide
        JSON.parse(contentJsonStr);
      } catch (jsonError) {
        cleanupUploadedFiles(req.files);
        return res.status(400).json({ 
          message: 'Le champ content_json doit être un JSON valide' 
        });
      }
    }
    
    // Gestion de l'image principale
    let img_path = existingActu.img_path;
    
    if (req.files && req.files.image) {
      // Nouvelle image uploadée -> supprimer l'ancienne
      if (existingActu.img_path) {
        deleteImageFile(existingActu.img_path);
      }
      img_path = `/uploads/${req.files.image[0].filename}`;
      console.log(`📷 Image principale mise à jour: ${img_path}`);
    } else if (bodyImgPath !== undefined) {
      // Valeur fournie dans le body
      if (bodyImgPath === null || bodyImgPath === '') {
        // Suppression de l'image demandée
        if (existingActu.img_path) {
          deleteImageFile(existingActu.img_path);
        }
        img_path = null;
        console.log('📷 Image principale supprimée');
      } else {
        // Nouveau chemin fourni
        img_path = bodyImgPath;
        console.log(`📷 Image principale mise à jour via body: ${img_path}`);
      }
    }
    
    // Gestion de l'image de couverture
    let cover_img_path = existingActu.cover_img_path;
    
    if (req.files && req.files.coverImage) {
      // Nouvelle image de couverture uploadée -> supprimer l'ancienne
      if (existingActu.cover_img_path) {
        deleteImageFile(existingActu.cover_img_path);
      }
      cover_img_path = `/uploads/${req.files.coverImage[0].filename}`;
      console.log(`🖼️  Image de couverture mise à jour: ${cover_img_path}`);
    } else if (bodyCoverImagePath !== undefined) {
      // Valeur fournie dans le body
      if (bodyCoverImagePath === null || bodyCoverImagePath === '') {
        // Suppression de l'image demandée
        if (existingActu.cover_img_path) {
          deleteImageFile(existingActu.cover_img_path);
        }
        cover_img_path = null;
        console.log('🖼️  Image de couverture supprimée');
      } else {
        // Nouveau chemin fourni
        cover_img_path = bodyCoverImagePath;
        console.log(`🖼️  Image de couverture mise à jour via body: ${cover_img_path}`);
      }
    }
    
    // Gestion des catégories
    let categoryStr = existingActu.category;
    if (category !== undefined) {
      categoryStr = Array.isArray(category) ? JSON.stringify(category) : category;
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      date: date || existingActu.date,
      titre: titre || existingActu.titre,
      text_preview: text_preview || existingActu.text_preview,
      content_json: contentJsonStr,
      img_path: img_path,
      cover_img_path: cover_img_path,
      category: categoryStr,
      is_online: is_online !== undefined ? is_online : existingActu.is_online
    };
    
    // Mise à jour en base de données
    const result = await db.run(
      'UPDATE actus SET date = ?, titre = ?, text_preview = ?, content_json = ?, img_path = ?, cover_img_path = ?, category = ?, is_online = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.img_path, updatedData.cover_img_path, updatedData.category, updatedData.is_online, id]
    );
    
    if (result.changes > 0) {
      const updatedActu = await db.get('SELECT * FROM actus WHERE id = ?', [id]);
      
      // Parser les catégories pour la réponse
      if (updatedActu.category) {
        try {
          updatedActu.category = JSON.parse(updatedActu.category);
        } catch (err) {
          updatedActu.category = [];
        }
      }
      
      console.log('✅ Actualité mise à jour avec succès');
      res.json({
        message: 'Actualité mise à jour avec succès',
        data: updatedActu
      });
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'actualité:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    cleanupUploadedFiles(req.files);
    
    res.status(500).json({ 
      message: 'Erreur interne lors de la mise à jour de l\'actualité',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE - Supprimer une actualité
app.delete('/api/actus/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🗑️  Suppression de l'actualité ID: ${id}`);
    
    // Récupérer l'actualité pour supprimer les images associées
    const actu = await db.get('SELECT img_path, cover_img_path FROM actus WHERE id = ?', [id]);
    
    if (!actu) {
      return res.status(404).json({ message: "Actualité non trouvée" });
    }
    
    // Supprimer les images associées
    if (actu.img_path) {
      deleteImageFile(actu.img_path);
    }
    if (actu.cover_img_path) {
      deleteImageFile(actu.cover_img_path);
    }
    
    // Supprimer l'actualité de la base de données
    const result = await db.run('DELETE FROM actus WHERE id = ?', [id]);
    
    if (result.changes > 0) {
      console.log('✅ Actualité supprimée avec succès');
      res.json({ 
        message: "Actualité supprimée avec succès",
        deletedId: id
      });
    } else {
      res.status(404).json({ message: "Actualité non trouvée" });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'actualité:', error);
    res.status(500).json({ 
      message: 'Erreur interne lors de la suppression de l\'actualité',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// ===== ROUTES POUR LES CONTENUS DE PAGES =====

// GET - Récupérer tous les contenus de pages
app.get('/api/page-content', async (req, res) => {
  try {
    const pageContents = await db.all('SELECT * FROM page_content ORDER BY page_name ASC');
    res.json(pageContents);
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus de pages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des contenus de pages' });
  }
});

// GET - Récupérer un contenu de page par ID
app.get('/api/page-content/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pageContent = await db.get('SELECT * FROM page_content WHERE id = ?', [id]);
    
    if (pageContent) {
      res.json(pageContent);
    } else {
      res.status(404).json({ message: "Contenu de page non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu de page:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du contenu de page' });
  }
});

// GET - Récupérer un contenu de page par nom de page
app.get('/api/page-content/by-name/:page_name', async (req, res) => {
  try {
    const page_name = req.params.page_name;
    const pageContent = await db.get('SELECT * FROM page_content WHERE page_name = ?', [page_name]);
    
    if (pageContent) {
      res.json(pageContent);
    } else {
      res.status(404).json({ message: "Contenu de page non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu de page par nom:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du contenu de page' });
  }
});

// POST - Créer un nouveau contenu de page (protégé par token)
app.post('/api/page-content', authenticateJWT, async (req, res) => {
  try {
    const { page_name, content } = req.body;
    
    if (!page_name || !content) {
      return res.status(400).json({ message: 'Le nom de page et le contenu sont requis' });
    }
    
    // Vérifier si le nom de page existe déjà
    const existingPageContent = await db.get('SELECT id FROM page_content WHERE page_name = ?', [page_name]);
    if (existingPageContent) {
      return res.status(400).json({ message: 'Ce nom de page existe déjà' });
    }
    
    // Convertir content en chaîne JSON si ce n'est pas déjà le cas
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
    
    const result = await db.run(
      'INSERT INTO page_content (page_name, content) VALUES (?, ?)',
      [page_name, contentStr]
    );
    
    const pageContent = await db.get('SELECT * FROM page_content WHERE id = ?', [result.lastID]);
    
    res.status(201).json(pageContent);
  } catch (error) {
    console.error('Erreur lors de la création du contenu de page:', error);
    res.status(500).json({ message: 'Erreur lors de la création du contenu de page' });
  }
});

// PATCH - Mettre à jour un contenu de page (protégé par token)
app.patch('/api/page-content/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { page_name, content } = req.body;
    
    // Récupérer le contenu de page existant
    const existingPageContent = await db.get('SELECT * FROM page_content WHERE id = ?', [id]);
    
    if (!existingPageContent) {
      return res.status(404).json({ message: "Contenu de page non trouvé" });
    }
    
    // Vérifier si le nouveau nom de page existe déjà (sauf pour la page actuelle)
    if (page_name && page_name !== existingPageContent.page_name) {
      const pageContentWithSameName = await db.get('SELECT id FROM page_content WHERE page_name = ? AND id != ?', [page_name, id]);
      if (pageContentWithSameName) {
        return res.status(400).json({ message: 'Ce nom de page est déjà utilisé par un autre contenu' });
      }
    }
    
    // Préparer les données à mettre à jour
    const updatedData = {
      page_name: page_name || existingPageContent.page_name,
      content: content !== undefined ? (typeof content === 'object' ? JSON.stringify(content) : content) : existingPageContent.content
    };
    
    const result = await db.run(
      'UPDATE page_content SET page_name = ?, content = ? WHERE id = ?',
      [updatedData.page_name, updatedData.content, id]
    );
    
    if (result.changes > 0) {
      const updatedPageContent = await db.get('SELECT * FROM page_content WHERE id = ?', [id]);
      res.json(updatedPageContent);
    } else {
      res.status(404).json({ message: "Contenu de page non trouvé" });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu de page:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du contenu de page' });
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
    
    // Configuration du transporteur email avec SMTP pour Rimconseil
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true pour 465, false pour les autres ports
      auth: {
        user: 'rimconseilrennes@gmail.com',
        pass: 'mwvp ugtq ttwm uipe' // Mot de passe d'application Gmail
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Configuration du message
    const mailOptions = {
      from: `"RIM Conseil" <rimconseilrennes@gmail.com>`,
      to: 'rimconseilrennes@gmail.com',
      subject: 'Panne Signalée - Rimconseil',
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
    
    // Envoyer un email avec le message formaté
    try {
      // Configuration du transporteur email avec SMTP pour Rimconseil
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true pour 465, false pour les autres ports
        auth: {
          user: 'rimconseilrennes@gmail.com',
          pass: 'mwvp ugtq ttwm uipe' // Mot de passe d'application Gmail
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Formater la date pour l'affichage
      const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Créer le contenu HTML de l'email avec le logo
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouveau message de contact</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="RIM Conseil Logo" style="max-width: 200px;">
            </div>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
              <h2 style="color: #333; margin-top: 0;">Nouveau message de contact</h2>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>De:</strong> ${prenom} ${nom}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${telephone ? `<p><strong>Téléphone:</strong> ${telephone}</p>` : ''}
              <p><strong>Sujet:</strong> ${sujet}</p>
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 15px;">
                <h3 style="color: #555; margin-top: 0;">Message:</h3>
                <p style="white-space: pre-line;">${message}</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
              <p>Ce message a été envoyé depuis le formulaire de contact du site RIM Conseil.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Configuration du message
      const mailOptions = {
        from: `"RIM Conseil" <rimconseilrennes@gmail.com>`,
        to: 'rimconseilrennes@gmail.com',
        subject: `Nouveau contact - ${sujet}`,
        text: `
          Nouveau message de ${prenom} ${nom} (${email})
          ${telephone ? `Téléphone: ${telephone}` : ''}
          Sujet: ${sujet}
          
          Message:
          ${message}
        `,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, 'logo.png'),
            cid: 'logo' // identifiant utilisé dans l'email HTML
          }
        ]
      };
      
      // Envoi de l'email
      await transporter.sendMail(mailOptions);
      console.log(`Email de notification envoyé à rimconseilrennes@gmail.com`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
      // On continue même si l'envoi de l'email échoue
    }
    
    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: newMessage
    });
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// ===== FONCTIONS UTILITAIRES POUR LA SANITISATION HTML =====

/**
 * Nettoie et valide le contenu HTML avec DOMPurify
 * @param {string} htmlContent - Contenu HTML à nettoyer
 * @returns {string} - HTML nettoyé et sécurisé
 */
function sanitizeHTML(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }
  
  // Configuration stricte: seules les balises autorisées pour l'édition WYSIWYG
  const allowedTags = ['b', 'strong', 'i', 'em', 'a', 'br', 'p', 'span'];
  const allowedAttributes = {
    'a': ['href', 'title', 'target'],
    'span': ['style'] // Pour certains cas spécifiques de formatage
  };
  
  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: Object.values(allowedAttributes).flat(),
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
}

/**
 * Extrait le texte brut du contenu HTML
 * @param {string} htmlContent - Contenu HTML
 * @returns {string} - Texte sans balises HTML
 */
function extractTextFromHTML(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }
  
  // Utiliser DOMPurify pour d'abord nettoyer, puis extraire le texte
  const cleanHTML = DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: [] });
  return cleanHTML.trim();
}

/**
 * Valide un sélecteur CSS pour éviter l'injection
 * @param {string} selector - Sélecteur CSS à valider
 * @returns {boolean} - true si le sélecteur est valide
 */
function isValidCSSSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    return false;
  }
  
  // Pattern pour valider les sélecteurs CSS basiques (classes, IDs, éléments, descendants)
  const validSelectorPattern = /^[a-zA-Z0-9\s\-_#.\[\]():,>+~"'=^$*|]*$/;
  
  // Vérifier que le sélecteur ne contient pas de caractères dangereux
  if (!validSelectorPattern.test(selector)) {
    return false;
  }
  
  // Vérifier que le sélecteur n'est pas trop long (limite de sécurité)
  if (selector.length > 200) {
    return false;
  }
  
  return true;
}

/**
 * Middleware de rate limiting simple pour les endpoints d'édition
 */
const editingRateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requêtes par minute

function rateLimitEditing(req, res, next) {
  const clientId = req.ip || req.user?.id || 'unknown';
  const now = Date.now();
  
  if (!editingRateLimit[clientId]) {
    editingRateLimit[clientId] = { count: 1, firstRequest: now };
  } else {
    const timeWindow = now - editingRateLimit[clientId].firstRequest;
    
    if (timeWindow > RATE_LIMIT_WINDOW) {
      // Reset du compteur
      editingRateLimit[clientId] = { count: 1, firstRequest: now };
    } else {
      editingRateLimit[clientId].count++;
      
      if (editingRateLimit[clientId].count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ 
          message: 'Trop de requêtes d\'édition. Veuillez patienter avant de continuer.',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - timeWindow) / 1000)
        });
      }
    }
  }
  
  next();
}

// ===== ROUTES POUR L'ÉDITION WYSIWYG D'ÉLÉMENTS INDIVIDUELS =====

// GET - Récupérer tous les éléments éditables d'une page
app.get('/api/editable-content/:pageName', async (req, res) => {
  try {
    const pageName = req.params.pageName;
    
    if (!pageName || typeof pageName !== 'string') {
      return res.status(400).json({ message: 'Nom de page requis' });
    }
    
    // Récupérer tous les éléments éditables de la page
    const editableElements = await db.all(
      'SELECT * FROM editable_content WHERE page_name = ? ORDER BY element_selector ASC',
      [pageName]
    );
    
    if (editableElements.length === 0) {
      return res.status(404).json({ 
        message: 'Aucun contenu éditable trouvé pour cette page',
        pageName: pageName
      });
    }
    
    res.json({
      pageName: pageName,
      elements: editableElements,
      totalElements: editableElements.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des éléments éditables:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des éléments éditables',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST - Mise à jour en lot (bulk update) de plusieurs éléments
app.post('/api/editable-content/bulk-update', authenticateJWT, rateLimitEditing, async (req, res) => {
  try {
    const { elements } = req.body;
    
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ 
        message: 'Un tableau d\'éléments à mettre à jour est requis' 
      });
    }
    
    if (elements.length > 20) {
      return res.status(400).json({ 
        message: 'Trop d\'éléments dans la requête (maximum 20)' 
      });
    }
    
    const updatedElements = [];
    const errors = [];
    
    // Traiter chaque élément
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const { page_name, element_selector, content_html, element_type } = element;
      
      try {
        // Validation des champs obligatoires
        if (!page_name || !element_selector || content_html === undefined) {
          errors.push({
            index: i,
            error: 'Les champs page_name, element_selector et content_html sont requis',
            element: element
          });
          continue;
        }
        
        // Validation du sélecteur CSS
        if (!isValidCSSSelector(element_selector)) {
          errors.push({
            index: i,
            error: 'Sélecteur CSS invalide ou potentiellement dangereux',
            element: element
          });
          continue;
        }
        
        // Sanitisation du contenu HTML
        const sanitizedHTML = sanitizeHTML(content_html);
        const textContent = extractTextFromHTML(sanitizedHTML);
        
        if (!sanitizedHTML.trim() && content_html.trim()) {
          errors.push({
            index: i,
            error: 'Contenu HTML refusé après sanitisation (contenu potentiellement malveillant)',
            element: element
          });
          continue;
        }
        
        // UPSERT: INSERT si nouveau, UPDATE si existe
        const existingElement = await db.get(
          'SELECT id FROM editable_content WHERE page_name = ? AND element_selector = ?',
          [page_name, element_selector]
        );
        
        let result;
        if (existingElement) {
          // Mise à jour
          result = await db.run(
            `UPDATE editable_content 
             SET content_html = ?, content_text = ?, element_type = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE page_name = ? AND element_selector = ?`,
            [sanitizedHTML, textContent, element_type || 'paragraph', page_name, element_selector]
          );
          
          if (result.changes > 0) {
            const updatedElement = await db.get(
              'SELECT * FROM editable_content WHERE page_name = ? AND element_selector = ?',
              [page_name, element_selector]
            );
            updatedElements.push(updatedElement);
          }
        } else {
          // Création
          result = await db.run(
            `INSERT INTO editable_content (page_name, element_selector, content_html, content_text, element_type) 
             VALUES (?, ?, ?, ?, ?)`,
            [page_name, element_selector, sanitizedHTML, textContent, element_type || 'paragraph']
          );
          
          if (result.lastID) {
            const newElement = await db.get(
              'SELECT * FROM editable_content WHERE id = ?',
              [result.lastID]
            );
            updatedElements.push(newElement);
          }
        }
        
      } catch (elementError) {
        console.error(`❌ Erreur lors du traitement de l'élément ${i}:`, elementError);
        errors.push({
          index: i,
          error: 'Erreur lors du traitement de cet élément',
          element: element
        });
      }
    }
    
    // Log de l'activité
    console.log(`📝 Bulk update par l'utilisateur ${req.user.email}: ${updatedElements.length} éléments mis à jour, ${errors.length} erreurs`);
    
    const statusCode = updatedElements.length > 0 ? (errors.length > 0 ? 207 : 200) : 400;
    
    res.status(statusCode).json({
      message: `${updatedElements.length} élément(s) mis à jour avec succès`,
      updatedElements: updatedElements,
      totalUpdated: updatedElements.length,
      errors: errors,
      totalErrors: errors.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour en lot:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour en lot',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH - Mise à jour d'un élément individuel
app.patch('/api/editable-content/element', authenticateJWT, rateLimitEditing, async (req, res) => {
  try {
    const { page_name, element_selector, content_html, element_type } = req.body;
    
    // Validation des champs obligatoires
    if (!page_name || !element_selector || content_html === undefined) {
      return res.status(400).json({ 
        message: 'Les champs page_name, element_selector et content_html sont requis' 
      });
    }
    
    // Validation du sélecteur CSS
    if (!isValidCSSSelector(element_selector)) {
      return res.status(400).json({ 
        message: 'Sélecteur CSS invalide ou potentiellement dangereux' 
      });
    }
    
    // Sanitisation du contenu HTML
    const sanitizedHTML = sanitizeHTML(content_html);
    const textContent = extractTextFromHTML(sanitizedHTML);
    
    if (!sanitizedHTML.trim() && content_html.trim()) {
      return res.status(400).json({ 
        message: 'Contenu HTML refusé après sanitisation (contenu potentiellement malveillant)' 
      });
    }
    
    // Vérifier si l'élément existe déjà
    const existingElement = await db.get(
      'SELECT id FROM editable_content WHERE page_name = ? AND element_selector = ?',
      [page_name, element_selector]
    );
    
    let result;
    let statusCode;
    let message;
    
    if (existingElement) {
      // Mise à jour
      result = await db.run(
        `UPDATE editable_content 
         SET content_html = ?, content_text = ?, element_type = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE page_name = ? AND element_selector = ?`,
        [sanitizedHTML, textContent, element_type || 'paragraph', page_name, element_selector]
      );
      
      if (result.changes > 0) {
        statusCode = 200;
        message = 'Élément mis à jour avec succès';
      } else {
        return res.status(404).json({ message: 'Élément non trouvé' });
      }
    } else {
      // Création
      result = await db.run(
        `INSERT INTO editable_content (page_name, element_selector, content_html, content_text, element_type) 
         VALUES (?, ?, ?, ?, ?)`,
        [page_name, element_selector, sanitizedHTML, textContent, element_type || 'paragraph']
      );
      
      if (result.lastID) {
        statusCode = 201;
        message = 'Nouvel élément créé avec succès';
      } else {
        return res.status(500).json({ message: 'Erreur lors de la création de l\'élément' });
      }
    }
    
    // Récupérer l'élément mis à jour/créé
    const updatedElement = await db.get(
      'SELECT * FROM editable_content WHERE page_name = ? AND element_selector = ?',
      [page_name, element_selector]
    );
    
    // Log de l'activité
    console.log(`📝 Élément ${statusCode === 201 ? 'créé' : 'mis à jour'} par ${req.user.email}: ${page_name} > ${element_selector}`);
    
    res.status(statusCode).json({
      message: message,
      element: updatedElement
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'élément:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour de l\'élément',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== ROUTES POUR L'UTILISATEUR AUTHENTIFIÉ =====

// GET - Récupérer les informations de l'utilisateur connecté
app.get('/api/user/me', authenticateJWT, async (req, res) => {
  // req.user est défini par le middleware authenticateJWT
  res.json(req.user);
});

// ===== ROUTES POUR LA GESTION DES SCÈNES 3D =====

// GET - Récupérer toutes les scènes 3D
app.get('/api/scenes-3d', async (req, res) => {
  try {
    console.log('🎬 Récupération des scènes 3D');
    
    const scenes = await db.all(`
      SELECT s.*, 
             COUNT(sm.model_id) as model_count
      FROM scenes_3d s
      LEFT JOIN scene_models sm ON s.id = sm.scene_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    
    // Parser les configurations JSON
    scenes.forEach(scene => {
      try {
        scene.scene_config = JSON.parse(scene.scene_config);
      } catch (err) {
        scene.scene_config = {};
      }
    });
    
    console.log(`✅ ${scenes.length} scènes 3D récupérées`);
    res.json({
      message: 'Scènes 3D récupérées avec succès',
      data: scenes,
      total: scenes.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des scènes 3D:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des scènes 3D',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET - Récupérer une scène 3D spécifique avec ses modèles
app.get('/api/scenes-3d/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🎬 Récupération de la scène 3D ID: ${id}`);
    
    // Récupérer la scène
    const scene = await db.get('SELECT * FROM scenes_3d WHERE id = ?', [id]);
    
    if (!scene) {
      return res.status(404).json({ message: 'Scène 3D non trouvée' });
    }
    
    // Parser la configuration de la scène
    try {
      scene.scene_config = JSON.parse(scene.scene_config);
    } catch (err) {
      scene.scene_config = {};
    }
    
    // Récupérer les modèles associés à cette scène
    const models = await db.all(`
      SELECT m.*, sm.position_x, sm.position_y, sm.position_z,
             sm.rotation_x, sm.rotation_y, sm.rotation_z,
             sm.scale_x, sm.scale_y, sm.scale_z
      FROM models_3d m
      INNER JOIN scene_models sm ON m.id = sm.model_id
      WHERE sm.scene_id = ?
    `, [id]);
    
    // Parser les configurations des modèles
    models.forEach(model => {
      try {
        model.model_config = JSON.parse(model.model_config);
      } catch (err) {
        model.model_config = {};
      }
    });
    
    scene.models = models;
    
    console.log(`✅ Scène 3D récupérée avec ${models.length} modèles`);
    res.json({
      message: 'Scène 3D récupérée avec succès',
      data: scene
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la scène 3D:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la scène 3D',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET - Récupérer les scènes par type d'ammunition
app.get('/api/scenes-3d/ammunition/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`🎬 Récupération des scènes pour le type d'ammunition: ${type}`);
    
    const scenes = await db.all(`
      SELECT s.*, 
             COUNT(sm.model_id) as model_count
      FROM scenes_3d s
      LEFT JOIN scene_models sm ON s.id = sm.scene_id
      WHERE s.ammunition_type = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [type]);
    
    // Parser les configurations JSON
    scenes.forEach(scene => {
      try {
        scene.scene_config = JSON.parse(scene.scene_config);
      } catch (err) {
        scene.scene_config = {};
      }
    });
    
    console.log(`✅ ${scenes.length} scènes trouvées pour le type ${type}`);
    res.json({
      message: `Scènes 3D pour le type ${type} récupérées avec succès`,
      data: scenes,
      total: scenes.length,
      ammunition_type: type
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des scènes par type:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des scènes par type',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET - Récupérer tous les modèles 3D
app.get('/api/models-3d', async (req, res) => {
  try {
    console.log('🎯 Récupération des modèles 3D');
    
    const models = await db.all('SELECT * FROM models_3d ORDER BY ammunition_type, name');
    
    // Parser les configurations JSON
    models.forEach(model => {
      try {
        model.model_config = JSON.parse(model.model_config);
      } catch (err) {
        model.model_config = {};
      }
    });
    
    console.log(`✅ ${models.length} modèles 3D récupérés`);
    res.json({
      message: 'Modèles 3D récupérés avec succès',
      data: models,
      total: models.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modèles 3D:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des modèles 3D',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET - Récupérer les modèles par type d'ammunition
app.get('/api/models-3d/ammunition/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`🎯 Récupération des modèles pour le type d'ammunition: ${type}`);
    
    const models = await db.all('SELECT * FROM models_3d WHERE ammunition_type = ? ORDER BY name', [type]);
    
    // Parser les configurations JSON
    models.forEach(model => {
      try {
        model.model_config = JSON.parse(model.model_config);
      } catch (err) {
        model.model_config = {};
      }
    });
    
    console.log(`✅ ${models.length} modèles trouvés pour le type ${type}`);
    res.json({
      message: `Modèles 3D pour le type ${type} récupérés avec succès`,
      data: models,
      total: models.length,
      ammunition_type: type
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modèles par type:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des modèles par type',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST - Créer une nouvelle scène 3D (authentification requise)
app.post('/api/scenes-3d', authenticateJWT, async (req, res) => {
  try {
    console.log('🎬 Création d\'une nouvelle scène 3D');
    console.log('📋 Body reçu:', req.body);
    
    const { name, description, ammunition_type, scene_config } = req.body;
    
    // Validation des champs obligatoires
    if (!name || !ammunition_type || !scene_config) {
      return res.status(400).json({ 
        message: 'Les champs name, ammunition_type et scene_config sont obligatoires',
        missing: {
          name: !name,
          ammunition_type: !ammunition_type,
          scene_config: !scene_config
        }
      });
    }
    
    // Conversion et validation du scene_config
    let sceneConfigStr;
    try {
      sceneConfigStr = typeof scene_config === 'object' ? JSON.stringify(scene_config) : scene_config;
      // Vérifier que c'est un JSON valide
      JSON.parse(sceneConfigStr);
    } catch (jsonError) {
      return res.status(400).json({ 
        message: 'Le champ scene_config doit être un JSON valide' 
      });
    }
    
    // Insertion en base de données
    const result = await db.run(
      'INSERT INTO scenes_3d (name, description, ammunition_type, scene_config) VALUES (?, ?, ?, ?)',
      [name, description, ammunition_type, sceneConfigStr]
    );
    
    // Récupération de la scène créée
    const scene = await db.get('SELECT * FROM scenes_3d WHERE id = ?', [result.lastID]);
    
    // Parser la configuration pour la réponse
    try {
      scene.scene_config = JSON.parse(scene.scene_config);
    } catch (err) {
      scene.scene_config = {};
    }
    
    console.log('✅ Scène 3D créée avec succès');
    res.status(201).json({
      message: 'Scène 3D créée avec succès',
      data: scene
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la scène 3D:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la scène 3D',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST - Ajouter un modèle à une scène (authentification requise)
app.post('/api/scenes-3d/:sceneId/models/:modelId', authenticateJWT, async (req, res) => {
  try {
    const { sceneId, modelId } = req.params;
    const { position_x = 0, position_y = 0, position_z = 0, 
            rotation_x = 0, rotation_y = 0, rotation_z = 0,
            scale_x = 1, scale_y = 1, scale_z = 1 } = req.body;
    
    console.log(`🎬 Ajout du modèle ${modelId} à la scène ${sceneId}`);
    
    // Vérifier que la scène existe
    const scene = await db.get('SELECT * FROM scenes_3d WHERE id = ?', [sceneId]);
    if (!scene) {
      return res.status(404).json({ message: 'Scène 3D non trouvée' });
    }
    
    // Vérifier que le modèle existe
    const model = await db.get('SELECT * FROM models_3d WHERE id = ?', [modelId]);
    if (!model) {
      return res.status(404).json({ message: 'Modèle 3D non trouvé' });
    }
    
    // Ajouter le modèle à la scène
    const result = await db.run(
      `INSERT OR REPLACE INTO scene_models 
       (scene_id, model_id, position_x, position_y, position_z, 
        rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sceneId, modelId, position_x, position_y, position_z, 
       rotation_x, rotation_y, rotation_z, scale_x, scale_y, scale_z]
    );
    
    console.log('✅ Modèle ajouté à la scène avec succès');
    res.status(201).json({
      message: 'Modèle ajouté à la scène avec succès',
      data: {
        scene_id: sceneId,
        model_id: modelId,
        position: { x: position_x, y: position_y, z: position_z },
        rotation: { x: rotation_x, y: rotation_y, z: rotation_z },
        scale: { x: scale_x, y: scale_y, z: scale_z }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du modèle à la scène:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'ajout du modèle à la scène',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});