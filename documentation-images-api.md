# 📸 Documentation API - Système d'Images Articles & Actualités

## 🎯 Vue d'ensemble

Le système d'images de RIM Conseil Backend prend en charge **deux types d'images distinctes** pour les articles et actualités :

### Types d'images

| Type | Champ DB | Usage | Priorité d'affichage |
|------|----------|-------|---------------------|
| **Image principale** | `img_path` | Contenu détaillé de l'article/actualité | 2 |
| **Image de couverture** | `cover_img_path` | Affichage en liste, vignettes, prévisualisations | 1 |

### Logique d'affichage

Pour l'affichage en liste ou comme image de couverture :
1. **Priorité 1** : `cover_img_path` (si présente)
2. **Priorité 2** : `img_path` (si présente et pas de cover_img_path)
3. **Fallback** : Placeholder "Pas d'image"

---

## 🛠️ Configuration Technique

### Formats acceptés
- **JPEG** (`.jpg`, `.jpeg`)
- **PNG** (`.png`)
- **GIF** (`.gif`)
- **WebP** (`.webp`)

### Limitations
- **Taille maximum** : 10 MB par fichier
- **Nombre de fichiers** : 2 maximum (image + image de couverture)
- **Stockage** : Dossier `/uploads/`

### Nommage des fichiers
Format généré automatiquement :
```
{fieldname}-{timestamp}-{random}.{extension}
```
Exemple : `image-1703123456789-123456789.jpg`

---

## 📡 API Endpoints

### 🟢 Articles

#### Créer un article
```http
POST /api/articles
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Champs de formulaire :**
```javascript
{
  // Champs obligatoires
  "date": "2024-01-15",                    // string (YYYY-MM-DD)
  "titre": "Mon article",                  // string
  "text_preview": "Aperçu de l'article",   // string
  "content_json": "{...}",                 // string JSON ou object
  
  // Champs optionnels
  "category": ["Tech", "Innovation"],      // array ou string JSON
  
  // Images (optionnelles)
  "image": File,                           // Image principale
  "coverImage": File                       // Image de couverture
}
```

**Réponse :**
```json
{
  "message": "Article créé avec succès",
  "data": {
    "id": 123,
    "date": "2024-01-15",
    "titre": "Mon article",
    "text_preview": "Aperçu de l'article",
    "content_json": "{...}",
    "img_path": "/uploads/image-1703123456789-123456789.jpg",
    "cover_img_path": "/uploads/coverImage-1703123456790-987654321.jpg",
    "category": ["Tech", "Innovation"],
    "is_online": 0
  }
}
```

#### Mettre à jour un article
```http
PATCH /api/articles/{id}
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Champs de formulaire :**
```javascript
{
  // Tous les champs sont optionnels
  "date": "2024-01-16",                    // string (YYYY-MM-DD)
  "titre": "Nouveau titre",               // string
  "text_preview": "Nouvel aperçu",        // string
  "content_json": "{...}",                 // string JSON ou object
  "category": ["Tech"],                    // array ou string JSON
  "is_online": true,                       // boolean
  
  // Gestion des images via upload
  "image": File,                           // Nouvelle image principale
  "coverImage": File,                      // Nouvelle image de couverture
  
  // Gestion des images via body
  "img_path": "/uploads/autre-image.jpg",  // Chemin vers image existante
  "cover_img_path": null,                  // null/empty = suppression
}
```

**Options de gestion des images :**
- **Upload nouveau fichier** : Remplace l'ancienne image
- **Valeur `null` ou `""`** : Supprime l'image existante
- **Nouveau chemin** : Met à jour le chemin (pour images existantes)
- **Non spécifié** : Conserve l'image actuelle

#### Supprimer un article
```http
DELETE /api/articles/{id}
Authorization: Bearer {token}
```
> ⚠️ Supprime automatiquement toutes les images associées

### 🔵 Actualités

Les endpoints pour les actualités suivent exactement la même logique que les articles :

```http
POST /api/actus
PATCH /api/actus/{id}
DELETE /api/actus/{id}
```

Mêmes paramètres, mêmes réponses, même gestion des images.

---

## 💻 Exemples d'utilisation Frontend

### JavaScript Vanilla

```javascript
// Créer un article avec images
const formData = new FormData();
formData.append('date', '2024-01-15');
formData.append('titre', 'Mon article');
formData.append('text_preview', 'Aperçu...');
formData.append('content_json', JSON.stringify({
  blocks: [
    { type: 'paragraph', text: 'Contenu de l\'article...' }
  ]
}));
formData.append('category', JSON.stringify(['Tech', 'Innovation']));

// Images
formData.append('image', imageFile);           // Image principale
formData.append('coverImage', coverImageFile); // Image de couverture

fetch('/api/articles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### React.js

```jsx
import { useState } from 'react';

function ArticleForm() {
  const [mainImage, setMainImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('date', '2024-01-15');
    formData.append('titre', 'Mon article');
    formData.append('text_preview', 'Aperçu...');
    formData.append('content_json', JSON.stringify({
      blocks: [{ type: 'paragraph', text: 'Contenu...' }]
    }));
    
    if (mainImage) formData.append('image', mainImage);
    if (coverImage) formData.append('coverImage', coverImage);
    
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      console.log('Article créé:', result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Autres champs... */}
      
      <div>
        <label>Image principale :</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setMainImage(e.target.files[0])}
        />
      </div>
      
      <div>
        <label>Image de couverture :</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setCoverImage(e.target.files[0])}
        />
      </div>
      
      <button type="submit">Créer l'article</button>
    </form>
  );
}
```

### Vue.js

```vue
<template>
  <form @submit.prevent="createArticle">
    <!-- Autres champs... -->
    
    <div>
      <label>Image principale :</label>
      <input 
        type="file" 
        accept="image/*"
        @change="handleMainImageChange"
      />
    </div>
    
    <div>
      <label>Image de couverture :</label>
      <input 
        type="file" 
        accept="image/*"
        @change="handleCoverImageChange"
      />
    </div>
    
    <button type="submit">Créer l'article</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      mainImage: null,
      coverImage: null
    };
  },
  methods: {
    handleMainImageChange(event) {
      this.mainImage = event.target.files[0];
    },
    handleCoverImageChange(event) {
      this.coverImage = event.target.files[0];
    },
    async createArticle() {
      const formData = new FormData();
      formData.append('date', '2024-01-15');
      formData.append('titre', 'Mon article');
      formData.append('text_preview', 'Aperçu...');
      formData.append('content_json', JSON.stringify({
        blocks: [{ type: 'paragraph', text: 'Contenu...' }]
      }));
      
      if (this.mainImage) formData.append('image', this.mainImage);
      if (this.coverImage) formData.append('coverImage', this.coverImage);
      
      try {
        const response = await fetch('/api/articles', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.$store.state.token}`
          },
          body: formData
        });
        
        const result = await response.json();
        console.log('Article créé:', result);
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }
};
</script>
```

---

## 🎨 Affichage des Images Frontend

### Logique d'affichage recommandée

```javascript
// Fonction pour déterminer quelle image afficher
function getDisplayImage(item) {
  // Priorité 1: Image de couverture
  if (item.cover_img_path) {
    return item.cover_img_path;
  }
  
  // Priorité 2: Image principale  
  if (item.img_path) {
    return item.img_path;
  }
  
  // Fallback: Image par défaut
  return '/images/placeholder.jpg';
}

// Exemple d'utilisation en React
function ArticleCard({ article }) {
  const displayImage = getDisplayImage(article);
  
  return (
    <div className="article-card">
      <img 
        src={displayImage} 
        alt={article.titre}
        onError={(e) => {
          e.target.src = '/images/placeholder.jpg';
        }}
      />
      <h3>{article.titre}</h3>
      <p>{article.text_preview}</p>
    </div>
  );
}
```

### Composant d'image réutilisable

```jsx
// React Component
function SmartImage({ item, className = "", alt }) {
  const [imageSrc, setImageSrc] = useState(getDisplayImage(item));
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Essayer l'image principale si la couverture échoue
      if (imageSrc === item.cover_img_path && item.img_path) {
        setImageSrc(item.img_path);
      } else {
        setImageSrc('/images/placeholder.jpg');
      }
    }
  };
  
  return (
    <img 
      src={imageSrc}
      alt={alt || item.titre}
      className={className}
      onError={handleError}
    />
  );
}
```

---

## ⚠️ Gestion d'erreurs

### Codes d'erreur courants

| Code | Erreur | Description |
|------|--------|-------------|
| `400` | Champs manquants | date, titre, text_preview ou content_json manquant |
| `400` | JSON invalide | content_json n'est pas un JSON valide |
| `400` | Fichier trop volumineux | Fichier > 10MB |
| `400` | Type de fichier invalide | Format non supporté |
| `401` | Non authentifié | Token manquant ou invalide |
| `404` | Ressource non trouvée | Article/actualité inexistant |
| `500` | Erreur serveur | Erreur interne |

### Exemples de réponses d'erreur

```json
// Champs manquants
{
  "message": "Les champs date, titre, text_preview et content_json sont obligatoires",
  "missing": {
    "date": false,
    "titre": true,
    "text_preview": false,
    "content_json": true
  }
}

// Fichier trop volumineux
{
  "message": "Fichier trop volumineux. Taille maximum: 10MB"
}

// Type de fichier invalide
{
  "message": "Type de fichier non autorisé. Types acceptés: image/jpeg, image/jpg, image/png, image/gif, image/webp"
}
```

---

## 🔧 Configuration Backend

### Variables d'environnement

```env
# Optionnel - Mode développement pour messages d'erreur détaillés
NODE_ENV=development
```

### Structure des dossiers

```
projet/
├── uploads/                 # Images uploadées
│   ├── image-*.jpg         # Images principales
│   ├── coverImage-*.jpg    # Images de couverture
│   └── ...
├── index.js                # Server principal
└── config/
    └── db.js              # Configuration base de données
```

---

## 📊 Schema Base de Données

### Table `articles`

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  titre TEXT NOT NULL,
  text_preview TEXT NOT NULL,
  content_json TEXT NOT NULL,
  img_path TEXT,                    -- Image principale
  cover_img_path TEXT,              -- Image de couverture  
  category TEXT DEFAULT '[]',
  is_online BOOLEAN DEFAULT 0
);
```

### Table `actus`

```sql
CREATE TABLE actus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  titre TEXT NOT NULL,
  text_preview TEXT NOT NULL,
  content_json TEXT NOT NULL,
  img_path TEXT,                    -- Image principale
  cover_img_path TEXT,              -- Image de couverture
  category TEXT DEFAULT '[]',
  is_online BOOLEAN DEFAULT 0
);
```

---

## 🚀 Migration

Si vous avez une version antérieure sans la colonne `cover_img_path` :

```bash
# Exécuter le script de migration
node add-cover-image-column.js
```

Le script ajoute automatiquement :
- Colonne `cover_img_path` aux tables `articles` et `actus`
- Colonne `category` si manquante

---

## 🎯 Bonnes Pratiques

### Frontend

1. **Validation côté client** avant upload
2. **Prévisualisation** des images sélectionnées
3. **Gestion d'erreurs** robuste avec fallbacks
4. **Optimisation** : redimensionner les images avant upload
5. **UX** : indicateurs de progression pour les uploads

### Backend

1. **Nettoyage automatique** des fichiers en cas d'erreur
2. **Logs détaillés** pour le debugging
3. **Validation stricte** des types MIME
4. **Gestion mémoire** : streaming pour gros fichiers

### Sécurité

1. **Authentification** obligatoire pour upload/modification
2. **Validation** des extensions et types MIME
3. **Limitation** de taille et nombre de fichiers
4. **Sanitisation** des noms de fichiers

---

*Documentation générée le 15/01/2024 - Version 2.0* 