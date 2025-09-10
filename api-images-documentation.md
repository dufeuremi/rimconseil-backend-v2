    # Documentation - Système d'Images pour Articles et Actualités

## Vue d'ensemble

Le système prend maintenant en charge **deux types d'images** pour les articles et actualités :

1. **Image principale** (`img_path`) : Utilisée dans le contenu détaillé de l'article
2. **Image de couverture** (`cover_image_path`) : Utilisée pour l'affichage en liste et comme image de présentation

## Structure de données

### Base de données
Les tables `articles` et `actus` incluent maintenant les colonnes :
- `img_path` : Chemin vers l'image principale 
- `cover_img_path` : Chemin vers l'image de couverture

### Priorité d'affichage
Pour l'affichage en liste/couverture :
1. **Priorité 1** : `cover_img_path` (si présente)
2. **Priorité 2** : `img_path` (si présente et pas de cover_img_path)
3. **Fallback** : Placeholder "Pas d'image"

## API Endpoints

### Upload multiple d'images

Les endpoints suivants acceptent maintenant **deux champs d'upload simultanés** :

#### Créer un article
```
POST /api/articles
Content-Type: multipart/form-data
```

**Champs de formulaire :**
- `date` : Date de l'article (string)
- `titre` : Titre de l'article (string)
- `text_preview` : Texte de prévisualisation (string)
- `content_json` : Contenu JSON de l'article (string ou object)
- `category` : Catégories (string JSON)
- `image` : Image principale (file, optionnel)
- `coverImage` : Image de couverture (file, optionnel)

#### Mettre à jour un article
```
PATCH /api/articles/:id
Content-Type: multipart/form-data
```

**Champs de formulaire :**
- `date` : Date de l'article (string, optionnel)
- `titre` : Titre de l'article (string, optionnel)
- `text_preview` : Texte de prévisualisation (string, optionnel)
- `content_json` : Contenu JSON de l'article (string ou object, optionnel)
- `category` : Catégories (string JSON, optionnel)
- `is_online` : Statut en ligne (boolean, optionnel)
- `img_path` : Chemin de l'image principale via body (string, optionnel)
- `cover_img_path` : Chemin de l'image de couverture via body (string, optionnel)
- `image` : Nouvelle image principale (file, optionnel)
- `coverImage` : Nouvelle image de couverture (file, optionnel)

#### Créer une actualité
```
POST /api/actus
Content-Type: multipart/form-data
```

**Mêmes champs que pour les articles**

#### Mettre à jour une actualité
```
PATCH /api/actus/:id
Content-Type: multipart/form-data
```

**Mêmes champs que pour les articles**

## Exemples d'utilisation

### JavaScript/FormData

```javascript
// Créer un article avec les deux types d'images
const formData = new FormData();
formData.append('date', '2024-01-15');
formData.append('titre', 'Mon Article');
formData.append('text_preview', 'Aperçu de l\'article');
formData.append('content_json', JSON.stringify({
  metadata: { type: "articles" },
  blocks: {
    "title_1": { type: "Titre", content: "Mon Article", order: 0 }
  }
}));
formData.append('category', JSON.stringify(["Technologie"]));

// Image principale (utilisée dans le contenu)
formData.append('image', imageFile);

// Image de couverture (utilisée pour l'affichage en liste)
formData.append('coverImage', coverImageFile);

fetch('/api/articles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Mettre à jour seulement l'image de couverture

```javascript
const formData = new FormData();
formData.append('coverImage', newCoverImageFile);

fetch('/api/articles/1', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Supprimer une image via body

```javascript
const formData = new FormData();
formData.append('cover_img_path', ''); // Supprimer l'image de couverture

fetch('/api/articles/1', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Gestion des images existantes

### Migration automatique
- Les articles existants conservent leur `img_path` actuelle
- La nouvelle colonne `cover_img_path` est initialement `NULL`
- L'affichage en liste utilise `img_path` comme fallback si `cover_img_path` est vide

### Nettoyage automatique
- Lors de la suppression d'un article/actualité, **toutes les images associées** sont supprimées du disque
- Lors de la mise à jour d'une image, l'ancienne image est automatiquement supprimée

## Structure JSON du contenu (content_json)

Le `content_json` continue de fonctionner comme avant avec les images intégrées en base64 :

```json
{
  "metadata": {
    "type": "articles",
    "id": "1",
    "created_at": "2025-01-15T10:00:00.000Z"
  },
  "blocks": {
    "title_1": {
      "type": "Titre",
      "content": "Mon Article",
      "order": 0
    },
    "image_1": {
      "type": "Image",
      "content": "data:image/jpeg;base64,...",
      "order": 1
    },
    "paragraph_1": {
      "type": "paragraph",
      "content": "Contenu de l'article...",
      "order": 2
    }
  }
}
```

## Bonnes pratiques

1. **Image de couverture** : Utilisez une image optimisée (format web, taille réduite) pour les listes
2. **Image principale** : Peut être de meilleure qualité pour l'affichage dans le contenu
3. **Formats acceptés** : Tous les formats d'images (JPEG, PNG, WebP, etc.)
4. **Taille maximale** : 20 MB par image
5. **Nommage** : Les fichiers sont automatiquement renommés avec un timestamp unique

## Rétrocompatibilité

✅ **Le système est entièrement rétrocompatible** :
- Les articles existants continuent de fonctionner
- Les clients qui n'envoient qu'une seule image continuent de fonctionner
- L'API répond avec les nouveaux champs mais traite gracieusement leur absence 