# Guide API Editable Content - Édition WYSIWYG

## Vue d'ensemble

L'API `editable-content` permet l'édition WYSIWYG d'éléments HTML individuels dans les pages existantes. Cette API est spécifiquement conçue pour permettre la modification en temps réel d'éléments spécifiques sans affecter l'ensemble de la structure de la page.

## Base de données

### Table `editable_content`

```sql
CREATE TABLE editable_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_name TEXT NOT NULL,
  element_selector TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL,
  element_type TEXT NOT NULL DEFAULT 'paragraph',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_name, element_selector)
);
```

### Champs expliqués

- **page_name** : Nom de la page (ex: "notre-equipe", "accueil")
- **element_selector** : Sélecteur CSS unique (ex: ".team-member-1 .name")
- **content_html** : Contenu HTML avec formatage (bold, italic, liens)
- **content_text** : Version texte sans HTML (pour recherche)
- **element_type** : Type d'élément ("title", "paragraph", "bio", "button", etc.)

## Endpoints disponibles

### 1. GET `/api/editable-content/:pageName`

Récupère tous les éléments éditables d'une page.

**Paramètres :**
- `pageName` (string) : Nom de la page

**Réponse (200) :**
```json
{
  "pageName": "notre-equipe",
  "elements": [
    {
      "id": 1,
      "page_name": "notre-equipe",
      "element_selector": ".team-intro h2",
      "content_html": "<strong>Notre équipe d'experts</strong>",
      "content_text": "Notre équipe d'experts",
      "element_type": "title",
      "created_at": "2025-01-04 15:30:00",
      "updated_at": "2025-01-04 15:45:00"
    }
  ],
  "totalElements": 1
}
```

**Exemples d'utilisation :**

```javascript
// Récupérer les éléments de la page "notre-equipe"
const response = await fetch('/api/editable-content/notre-equipe');
const data = await response.json();

// Utilisation avec axios
const { data } = await axios.get('/api/editable-content/notre-equipe');
```

### 2. POST `/api/editable-content/bulk-update`

Mise à jour en lot de plusieurs éléments. **Authentification JWT requise.**

**Headers requis :**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body :**
```json
{
  "elements": [
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-intro h2",
      "content_html": "<strong>Notre équipe d'experts 🌟</strong>",
      "element_type": "title"
    },
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-member-1 .bio",
      "content_html": "Expert en <strong>stratégie digitale</strong> avec plus de 10 ans d'expérience.",
      "element_type": "bio"
    }
  ]
}
```

**Réponse (200/207) :**
```json
{
  "message": "2 élément(s) mis à jour avec succès",
  "updatedElements": [...],
  "totalUpdated": 2,
  "errors": [],
  "totalErrors": 0
}
```

**Exemple d'utilisation :**

```javascript
const updateMultipleElements = async (elements, token) => {
  try {
    const response = await fetch('/api/editable-content/bulk-update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ elements })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`${result.totalUpdated} éléments mis à jour`);
      if (result.totalErrors > 0) {
        console.warn('Erreurs:', result.errors);
      }
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
};
```

### 3. PATCH `/api/editable-content/element`

Mise à jour d'un élément individuel. **Authentification JWT requise.**

**Headers requis :**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body :**
```json
{
  "page_name": "notre-equipe",
  "element_selector": ".team-member-1 .name",
  "content_html": "<strong>Jean-Paul Dupont</strong>",
  "element_type": "title"
}
```

**Réponse (200 pour mise à jour, 201 pour création) :**
```json
{
  "message": "Élément mis à jour avec succès",
  "element": {
    "id": 1,
    "page_name": "notre-equipe",
    "element_selector": ".team-member-1 .name",
    "content_html": "<strong>Jean-Paul Dupont</strong>",
    "content_text": "Jean-Paul Dupont",
    "element_type": "title",
    "created_at": "2025-01-04 15:30:00",
    "updated_at": "2025-01-04 16:15:00"
  }
}
```

**Exemple d'utilisation :**

```javascript
const updateElement = async (elementData, token) => {
  try {
    const response = await fetch('/api/editable-content/element', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(elementData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(result.message);
      return result.element;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
};
```

### 4. DELETE `/api/editable-content/element`

Suppression d'un élément individuel. **Authentification JWT requise.**

**Headers requis :**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body :**
```json
{
  "page_name": "notre-equipe",
  "element_selector": ".team-member-1 .name"
}
```

**Réponse (200) :**
```json
{
  "message": "Élément supprimé avec succès",
  "deletedElement": {
    "page_name": "notre-equipe",
    "element_selector": ".team-member-1 .name",
    "id": 1
  }
}
```

**Exemple d'utilisation :**

```javascript
const deleteElement = async (pageName, selector, token) => {
  try {
    const response = await fetch('/api/editable-content/element', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_name: pageName,
        element_selector: selector
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(result.message);
      return result.deletedElement;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
};
```

### 5. DELETE `/api/editable-content/bulk-delete`

Suppression en lot de plusieurs éléments. **Authentification JWT requise.**

**Headers requis :**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body :**
```json
{
  "elements": [
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-member-1 .name"
    },
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-member-2 .bio"
    }
  ]
}
```

**Réponse (200/207) :**
```json
{
  "message": "2 élément(s) supprimé(s) avec succès",
  "deletedElements": [
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-member-1 .name",
      "id": 1
    },
    {
      "page_name": "notre-equipe",
      "element_selector": ".team-member-2 .bio",
      "id": 2
    }
  ],
  "summary": {
    "totalRequested": 2,
    "deleted": 2,
    "errors": 0
  }
}
```

**Exemple d'utilisation :**

```javascript
const bulkDeleteElements = async (elements, token) => {
  try {
    const response = await fetch('/api/editable-content/bulk-delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ elements })
    });
    
    const result = await response.json();
    
    if (response.ok || response.status === 207) {
      console.log(result.message);
      console.log('Résumé:', result.summary);
      return result.deletedElements;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression en lot:', error);
    throw error;
  }
};
```

## Sécurité

### 1. Authentification

Tous les endpoints de modification (POST, PATCH) nécessitent un token JWT valide :

```javascript
// Obtenir un token JWT
const loginResponse = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@rimconseil.fr',
    password: 'votre_mot_de_passe'
  })
});

const { token } = await loginResponse.json();
```

### 2. Sanitisation HTML

Le contenu HTML est automatiquement nettoyé pour empêcher les attaques XSS. Seules les balises suivantes sont autorisées :

- `<b>`, `<strong>` : Texte en gras
- `<i>`, `<em>` : Texte en italique
- `<a>` : Liens (avec href, title, target)
- `<br>` : Sauts de ligne
- `<p>` : Paragraphes
- `<span>` : Conteneurs inline (avec style limité)

**Exemple :**
```javascript
// Input malveillant
"<script>alert('XSS')</script><strong>Contenu légitime</strong><iframe src='evil.com'></iframe>"

// Output sanitisé
"<strong>Contenu légitime</strong>"
```

### 3. Validation des sélecteurs CSS

Les sélecteurs CSS sont validés pour empêcher l'injection de code :

```javascript
// Sélecteurs valides
".team-member-1 .name"
"#hero-title"
".content > p:first-child"

// Sélecteurs invalides (rejetés)
"<script>alert('hack')</script>"
"'; DROP TABLE users; --"
```

### 4. Rate Limiting

Les endpoints d'édition sont limités à 30 requêtes par minute par utilisateur/IP.

## Types d'éléments

Les types d'éléments permettent de catégoriser le contenu :

- `title` : Titres et en-têtes
- `paragraph` : Paragraphes de texte
- `bio` : Biographies et descriptions
- `button` : Textes de boutons
- `caption` : Légendes d'images
- `quote` : Citations
- `list` : Éléments de liste

## Codes de réponse

| Code | Description |
|------|-------------|
| 200  | Mise à jour réussie |
| 201  | Création réussie |
| 207  | Succès partiel (bulk update avec erreurs) |
| 400  | Données invalides |
| 401  | Non authentifié |
| 404  | Page/élément non trouvé |
| 429  | Trop de requêtes (rate limit) |
| 500  | Erreur serveur |

## Intégration Frontend

### Exemple complet avec gestion d'erreurs

```javascript
class EditableContentAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  async getPageElements(pageName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/${pageName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { elements: [], totalElements: 0 };
        }
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments:', error);
      throw error;
    }
  }
  
  async updateElement(elementData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/element`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(elementData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }
  
  async bulkUpdate(elements) {
    try {
      const response = await fetch(`${this.baseUrl}/api/editable-content/bulk-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ elements })
      });
      
      const result = await response.json();
      
      if (!response.ok && response.status !== 207) {
        throw new Error(result.message || 'Erreur lors de la mise à jour en lot');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la mise à jour en lot:', error);
      throw error;
    }
  }
}

// Utilisation
const api = new EditableContentAPI('http://localhost:4000', 'YOUR_JWT_TOKEN');

// Récupérer les éléments d'une page
const pageData = await api.getPageElements('notre-equipe');

// Mettre à jour un élément
const updatedElement = await api.updateElement({
  page_name: 'notre-equipe',
  element_selector: '.team-member-1 .name',
  content_html: '<strong>Nouveau nom</strong>',
  element_type: 'title'
});

// Mise à jour en lot
const bulkResult = await api.bulkUpdate([
  {
    page_name: 'notre-equipe',
    element_selector: '.team-intro h2',
    content_html: '<strong>Titre mis à jour</strong>',
    element_type: 'title'
  },
  // ... autres éléments
]);
```

## Tests

Un fichier de test complet est disponible : `test-editable-content-api.js`

**Exécution des tests :**
```bash
# Démarrer le serveur
npm start

# Dans un autre terminal
node test-editable-content-api.js
```

Les tests couvrent :
- Récupération des éléments
- Mise à jour individuelle
- Création d'éléments
- Mise à jour en lot
- Sécurité (sanitisation HTML)
- Validation des sélecteurs CSS
- Authentification

## Bonnes pratiques

1. **Sélecteurs CSS** : Utilisez des sélecteurs spécifiques et uniques
2. **Types d'éléments** : Définissez des types cohérents pour faciliter la gestion
3. **Gestion d'erreurs** : Toujours gérer les cas d'erreur et de timeout
4. **Cache** : Mettre en cache les éléments côté client pour de meilleures performances
5. **Validation** : Valider le contenu côté client avant envoi
6. **Feedback utilisateur** : Afficher des indicateurs de chargement et de succès/erreur

## Compatibilité

Cette API est compatible avec l'API existante `/api/page-content` et ne la modifie pas. Elle est spécifiquement conçue pour l'édition d'éléments HTML individuels et complète l'approche par pages complètes. 