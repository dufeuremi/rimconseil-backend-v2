# 🚀 Guide Frontend - API Images Articles & Actualités

## ⚡ Informations Essentielles

### URLs et Authentification
```javascript
const API_BASE = 'http://localhost:4000';
const token = localStorage.getItem('authToken'); // Votre token JWT

// Headers requis pour les uploads
const headers = {
  'Authorization': `Bearer ${token}`
  // Ne pas ajouter Content-Type pour FormData - le navigateur le fait automatiquement
};
```

### Types d'images supportées
- **Formats** : JPEG, PNG, GIF, WebP
- **Taille max** : 10 MB par fichier
- **Champs** : `image` (principale), `coverImage` (couverture)

## 🛠️ Création d'Articles/Actualités

### Exemple JavaScript pur
```javascript
async function createArticle(articleData, mainImageFile, coverImageFile) {
  const formData = new FormData();
  
  // Champs obligatoires
  formData.append('date', articleData.date);           // "2024-01-15"
  formData.append('titre', articleData.titre);
  formData.append('text_preview', articleData.preview);
  formData.append('content_json', JSON.stringify(articleData.content));
  
  // Champs optionnels
  if (articleData.category) {
    formData.append('category', JSON.stringify(articleData.category));
  }
  
  // Images (optionnelles)
  if (mainImageFile) {
    formData.append('image', mainImageFile);
  }
  if (coverImageFile) {
    formData.append('coverImage', coverImageFile);
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/articles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la création');
    }
    
    return result.data; // Article créé avec img_path et cover_img_path
  } catch (error) {
    console.error('Erreur création article:', error);
    throw error;
  }
}

// Utilisation
const articleData = {
  date: '2024-01-15',
  titre: 'Mon nouvel article',
  preview: 'Aperçu de l\'article...',
  content: {
    blocks: [
      { type: 'paragraph', text: 'Contenu de l\'article...' }
    ]
  },
  category: ['Tech', 'Innovation']
};

const mainImage = document.querySelector('#main-image').files[0];
const coverImage = document.querySelector('#cover-image').files[0];

createArticle(articleData, mainImage, coverImage)
  .then(article => console.log('Article créé:', article))
  .catch(error => console.error('Erreur:', error));
```

### Exemple React
```jsx
import { useState } from 'react';

function ArticleForm() {
  const [formData, setFormData] = useState({
    date: '',
    titre: '',
    text_preview: '',
    content_json: { blocks: [] },
    category: []
  });
  const [mainImage, setMainImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    
    // Ajouter les champs texte
    Object.keys(formData).forEach(key => {
      const value = key === 'content_json' || key === 'category' 
        ? JSON.stringify(formData[key]) 
        : formData[key];
      formDataToSend.append(key, value);
    });

    // Ajouter les images
    if (mainImage) formDataToSend.append('image', mainImage);
    if (coverImage) formDataToSend.append('coverImage', coverImage);

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Article créé:', result.data);
        // Rediriger ou afficher succès
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      // Afficher erreur à l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Titre"
        value={formData.titre}
        onChange={(e) => setFormData({...formData, titre: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Aperçu"
        value={formData.text_preview}
        onChange={(e) => setFormData({...formData, text_preview: e.target.value})}
        required
      />
      
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
      
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer l\'article'}
      </button>
    </form>
  );
}
```

## 🔄 Mise à jour d'Articles/Actualités

### Mise à jour avec nouvelles images
```javascript
async function updateArticle(articleId, updates, newMainImage, newCoverImage) {
  const formData = new FormData();
  
  // Ajouter les champs à modifier
  Object.keys(updates).forEach(key => {
    const value = (key === 'content_json' || key === 'category') && typeof updates[key] === 'object'
      ? JSON.stringify(updates[key])
      : updates[key];
    formData.append(key, value);
  });
  
  // Nouvelles images
  if (newMainImage) {
    formData.append('image', newMainImage);
  }
  if (newCoverImage) {
    formData.append('coverImage', newCoverImage);
  }
  
  const response = await fetch(`${API_BASE}/api/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
}
```

### Supprimer une image
```javascript
async function removeArticleImage(articleId, imageType) {
  const formData = new FormData();
  
  if (imageType === 'main') {
    formData.append('img_path', ''); // Supprime l'image principale
  } else if (imageType === 'cover') {
    formData.append('cover_img_path', ''); // Supprime l'image de couverture
  }
  
  const response = await fetch(`${API_BASE}/api/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
}
```

## 🖼️ Affichage des Images

### Fonction utilitaire pour déterminer quelle image afficher
```javascript
function getDisplayImage(item) {
  // Priorité 1: Image de couverture
  if (item.cover_img_path) {
    return item.cover_img_path;
  }
  
  // Priorité 2: Image principale  
  if (item.img_path) {
    return item.img_path;
  }
  
  // Fallback
  return '/images/placeholder.jpg';
}

// Utilisation
const articles = await fetch('/api/articles').then(r => r.json());

articles.forEach(article => {
  const imageUrl = getDisplayImage(article);
  console.log(`Article "${article.titre}": ${imageUrl}`);
});
```

### Composant React pour affichage intelligent
```jsx
function SmartImage({ item, alt, className = "", fallback = "/images/placeholder.jpg" }) {
  const [imageSrc, setImageSrc] = useState(getDisplayImage(item));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Essayer l'image principale si la couverture échoue
      if (imageSrc === item.cover_img_path && item.img_path) {
        setImageSrc(item.img_path);
      } else {
        setImageSrc(fallback);
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

// Utilisation
function ArticleCard({ article }) {
  return (
    <div className="article-card">
      <SmartImage 
        item={article} 
        alt={article.titre}
        className="article-image"
      />
      <h3>{article.titre}</h3>
      <p>{article.text_preview}</p>
    </div>
  );
}
```

## 📋 Endpoints Disponibles

### Articles
```
POST   /api/articles        # Créer un article
GET    /api/articles        # Récupérer tous les articles  
GET    /api/articles/:id    # Récupérer un article
PATCH  /api/articles/:id    # Mettre à jour un article
DELETE /api/articles/:id    # Supprimer un article
```

### Actualités  
```
POST   /api/actus          # Créer une actualité
GET    /api/actus          # Récupérer toutes les actualités
GET    /api/actus/:id      # Récupérer une actualité
PATCH  /api/actus/:id      # Mettre à jour une actualité
DELETE /api/actus/:id      # Supprimer une actualité
```

## ⚠️ Gestion d'Erreurs

### Codes d'erreur courants
```javascript
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error(`Données invalides: ${data.message}`);
        case 401:
          throw new Error('Non authentifié - Veuillez vous reconnecter');
        case 404:
          throw new Error('Ressource non trouvée');
        case 413:
          throw new Error('Fichier trop volumineux (max 10MB)');
        case 500:
          throw new Error('Erreur serveur - Réessayez plus tard');
        default:
          throw new Error(data.message || 'Erreur inconnue');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}
```

### Validation côté client
```javascript
function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Type de fichier non supporté. Types acceptés: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (maximum 10MB)');
  }

  return true;
}

// Utilisation
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      validateImageFile(file);
      setSelectedImage(file);
    } catch (error) {
      alert(error.message);
      event.target.value = ''; // Reset input
    }
  }
};
```

## 🎯 Conseils d'UX

### Prévisualisation d'images
```javascript
function createImagePreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// React example
const [previewUrl, setPreviewUrl] = useState('');

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      validateImageFile(file);
      const preview = await createImagePreview(file);
      setPreviewUrl(preview);
      setSelectedImage(file);
    } catch (error) {
      alert(error.message);
    }
  }
};

// Dans le JSX
{previewUrl && (
  <div className="image-preview">
    <img src={previewUrl} alt="Prévisualisation" style={{maxWidth: '200px'}} />
  </div>
)}
```

### Indicateur de progression
```jsx
function UploadProgress({ isUploading, progress = 0 }) {
  if (!isUploading) return null;
  
  return (
    <div className="upload-progress">
      <div className="progress-bar" style={{width: `${progress}%`}}></div>
      <span>{progress}% uploadé</span>
    </div>
  );
}
```

---

## 🔗 Liens Utiles

- **Documentation complète** : `documentation-images-api.md`
- **Tests API** : Exécuter `node test-images-api.js`
- **Base URL locale** : `http://localhost:4000`

---

*Guide mis à jour le 15/01/2024 - Compatible avec le nouveau système d'images v2.0* 