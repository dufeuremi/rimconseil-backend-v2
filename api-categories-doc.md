# Documentation de l'API pour les catégories

## Articles

### Récupérer tous les articles
```
GET /api/articles
```
Réponse : Un tableau d'objets articles, chacun contenant un champ `category` qui est un tableau de chaînes.

### Récupérer un article spécifique
```
GET /api/articles/:id
```
Réponse : Un objet article contenant un champ `category` qui est un tableau de chaînes.

### Créer un nouvel article
```
POST /api/articles
```
Body (JSON) :
```json
{
  "date": "YYYY-MM-DD",
  "titre": "Titre de l'article",
  "text_preview": "Aperçu de l'article",
  "content_json": {},
  "path": "url-slug", // Optionnel
  "category": ["Catégorie1", "Catégorie2"] // Optionnel, par défaut []
}
```

### Mettre à jour un article
```
PATCH /api/articles/:id
```
Body (JSON) :
```json
{
  "date": "YYYY-MM-DD", // Optionnel
  "titre": "Nouveau titre", // Optionnel
  "text_preview": "Nouvel aperçu", // Optionnel
  "content_json": {}, // Optionnel
  "path": "nouveau-slug", // Optionnel
  "category": ["Catégorie1", "Catégorie2"] // Optionnel
}
```

## Actualités

### Récupérer toutes les actualités
```
GET /api/actus
```
Réponse : Un tableau d'objets actualités, chacun contenant un champ `category` qui est un tableau de chaînes.

### Récupérer une actualité spécifique
```
GET /api/actus/:id
```
Réponse : Un objet actualité contenant un champ `category` qui est un tableau de chaînes.

### Créer une nouvelle actualité
```
POST /api/actus
```
Body (FormData) :
- date : "YYYY-MM-DD"
- titre : "Titre de l'actualité"
- text_preview : "Aperçu de l'actualité"
- content_json : {}
- image : Fichier (optionnel)
- category : "[\"Catégorie1\", \"Catégorie2\"]" (chaîne JSON, optionnel)

### Mettre à jour une actualité
```
PATCH /api/actus/:id
```
Body (FormData) :
- date : "YYYY-MM-DD" (optionnel)
- titre : "Nouveau titre" (optionnel)
- text_preview : "Nouvel aperçu" (optionnel)
- content_json : {} (optionnel)
- image : Fichier (optionnel)
- category : "[\"Catégorie1\", \"Catégorie2\"]" (chaîne JSON, optionnel)

## Notes importantes

1. Pour les articles, le champ `category` est envoyé et reçu comme un tableau JSON.
2. Pour les actualités, comme on utilise FormData pour l'upload d'image, le champ `category` doit être envoyé sous forme de chaîne JSON.
3. Lors de la récupération des données (GET), le champ `category` sera une chaîne JSON que vous devrez parser côté frontend :
   ```javascript
   const categories = JSON.parse(article.category || '[]');
   ```
4. Les catégories sont facultatives lors de la création/mise à jour. Si non fournies, un tableau vide est utilisé.
