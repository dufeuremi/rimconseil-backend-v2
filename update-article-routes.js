const fs = require('fs');
const path = require('path');

// Lire le fichier index.js
const indexPath = path.join(__dirname, 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Mise à jour de la route POST pour les articles
const postArticleRegex = /app\.post\('\/api\/articles', authenticateJWT, async \(req, res\) => \{[\s\S]*?const \{ date, titre, text_preview, content_json, path \} = req\.body;/;
const updatedPostArticle = `app.post('/api/articles', authenticateJWT, async (req, res) => {
  try {
    console.log('Requête reçue pour créer un article:', req.body);
    const { date, titre, text_preview, content_json, path, category } = req.body;`;

indexContent = indexContent.replace(postArticleRegex, updatedPostArticle);

// Mise à jour de l'insertion des articles
const insertArticleRegex = /const result = await db\.run\(\s*'INSERT INTO articles \(date, titre, text_preview, content_json, path\) VALUES \(\?, \?, \?, \?, \?\)',\s*\[date, titre, text_preview, contentJsonStr, path \|\| null\]\s*\);/;
const updatedInsertArticle = `const result = await db.run(
      'INSERT INTO articles (date, titre, text_preview, content_json, path, category) VALUES (?, ?, ?, ?, ?, ?)',
      [date, titre, text_preview, contentJsonStr, path || null, category ? JSON.stringify(category) : '[]']
    );`;

indexContent = indexContent.replace(insertArticleRegex, updatedInsertArticle);

// Mise à jour de la route PATCH pour les articles
const patchArticleRegex = /app\.patch\('\/api\/articles\/:id', authenticateJWT, async \(req, res\) => \{[\s\S]*?const \{ date, titre, text_preview, content_json, path \} = req\.body;/;
const updatedPatchArticle = `app.patch('/api/articles/:id', authenticateJWT, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, titre, text_preview, content_json, path, category } = req.body;`;

indexContent = indexContent.replace(patchArticleRegex, updatedPatchArticle);

// Mise à jour de la mise à jour des articles
const updateArticleRegex = /const updatedData = \{\s*date: date \|\| existingArticle\.date,\s*titre: titre \|\| existingArticle\.titre,\s*text_preview: text_preview \|\| existingArticle\.text_preview,\s*content_json: contentJsonStr,\s*path: path !== undefined \? path : existingArticle\.path\s*\};/;
const updatedUpdateArticle = `const updatedData = {
      date: date || existingArticle.date,
      titre: titre || existingArticle.titre,
      text_preview: text_preview || existingArticle.text_preview,
      content_json: contentJsonStr,
      path: path !== undefined ? path : existingArticle.path,
      category: category !== undefined ? JSON.stringify(category) : existingArticle.category
    };`;

indexContent = indexContent.replace(updateArticleRegex, updatedUpdateArticle);

// Mise à jour de la requête de mise à jour des articles
const updateArticleQueryRegex = /db\.run\(\s*'UPDATE articles SET date = \?, titre = \?, text_preview = \?, content_json = \?, path = \? WHERE id = \?',\s*\[updatedData\.date, updatedData\.titre, updatedData\.text_preview, updatedData\.content_json, updatedData\.path, id\]\s*\);/;
const updatedUpdateArticleQuery = `db.run(
      'UPDATE articles SET date = ?, titre = ?, text_preview = ?, content_json = ?, path = ?, category = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.path, updatedData.category, id]
    );`;

indexContent = indexContent.replace(updateArticleQueryRegex, updatedUpdateArticleQuery);

// Mise à jour de la route POST pour les actus
const postActuRegex = /app\.post\('\/api\/actus', authenticateJWT, upload\.single\('image'\), async \(req, res\) => \{[\s\S]*?const \{ date, titre, text_preview, content_json \} = req\.body;/;
const updatedPostActu = `app.post('/api/actus', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const { date, titre, text_preview, content_json, category } = req.body;`;

indexContent = indexContent.replace(postActuRegex, updatedPostActu);

// Mise à jour de l'insertion des actus
const insertActuRegex = /const result = await db\.run\(\s*'INSERT INTO actus \(date, titre, text_preview, content_json, img_path\) VALUES \(\?, \?, \?, \?, \?\)',\s*\[date, titre, text_preview, content_json, img_path\]\s*\);/;
const updatedInsertActu = `const result = await db.run(
      'INSERT INTO actus (date, titre, text_preview, content_json, img_path, category) VALUES (?, ?, ?, ?, ?, ?)',
      [date, titre, text_preview, content_json, img_path, category ? JSON.stringify(category) : '[]']
    );`;

indexContent = indexContent.replace(insertActuRegex, updatedInsertActu);

// Mise à jour de la route PATCH pour les actus
const patchActuRegex = /app\.patch\('\/api\/actus\/:id', authenticateJWT, upload\.single\('image'\), async \(req, res\) => \{[\s\S]*?const \{ date, titre, text_preview, content_json \} = req\.body;/;
const updatedPatchActu = `app.patch('/api/actus/:id', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, titre, text_preview, content_json, category } = req.body;`;

indexContent = indexContent.replace(patchActuRegex, updatedPatchActu);

// Mise à jour de la mise à jour des actus
const updateActuRegex = /const updatedData = \{\s*date: date \|\| existingActu\.date,\s*titre: titre \|\| existingActu\.titre,\s*text_preview: text_preview \|\| existingActu\.text_preview,\s*content_json: content_json \|\| existingActu\.content_json,\s*img_path: img_path\s*\};/;
const updatedUpdateActu = `const updatedData = {
      date: date || existingActu.date,
      titre: titre || existingActu.titre,
      text_preview: text_preview || existingActu.text_preview,
      content_json: content_json || existingActu.content_json,
      img_path: img_path,
      category: category !== undefined ? JSON.stringify(category) : existingActu.category
    };`;

indexContent = indexContent.replace(updateActuRegex, updatedUpdateActu);

// Mise à jour de la requête de mise à jour des actus
const updateActuQueryRegex = /db\.run\(\s*'UPDATE actus SET date = \?, titre = \?, text_preview = \?, content_json = \?, img_path = \? WHERE id = \?',\s*\[updatedData\.date, updatedData\.titre, updatedData\.text_preview, updatedData\.content_json, updatedData\.img_path, id\]\s*\);/;
const updatedUpdateActuQuery = `db.run(
      'UPDATE actus SET date = ?, titre = ?, text_preview = ?, content_json = ?, img_path = ?, category = ? WHERE id = ?',
      [updatedData.date, updatedData.titre, updatedData.text_preview, updatedData.content_json, updatedData.img_path, updatedData.category, id]
    );`;

indexContent = indexContent.replace(updateActuQueryRegex, updatedUpdateActuQuery);

// Écrire le contenu mis à jour dans le fichier
fs.writeFileSync(indexPath, indexContent);

console.log('Les routes ont été mises à jour pour gérer la colonne category');

// Créer une mini documentation pour le développeur frontend
const docContent = `# Documentation de l'API pour les catégories

## Articles

### Récupérer tous les articles
\`\`\`
GET /api/articles
\`\`\`
Réponse : Un tableau d'objets articles, chacun contenant un champ \`category\` qui est un tableau de chaînes.

### Récupérer un article spécifique
\`\`\`
GET /api/articles/:id
\`\`\`
Réponse : Un objet article contenant un champ \`category\` qui est un tableau de chaînes.

### Créer un nouvel article
\`\`\`
POST /api/articles
\`\`\`
Body (JSON) :
\`\`\`json
{
  "date": "YYYY-MM-DD",
  "titre": "Titre de l'article",
  "text_preview": "Aperçu de l'article",
  "content_json": {},
  "path": "url-slug", // Optionnel
  "category": ["Catégorie1", "Catégorie2"] // Optionnel, par défaut []
}
\`\`\`

### Mettre à jour un article
\`\`\`
PATCH /api/articles/:id
\`\`\`
Body (JSON) :
\`\`\`json
{
  "date": "YYYY-MM-DD", // Optionnel
  "titre": "Nouveau titre", // Optionnel
  "text_preview": "Nouvel aperçu", // Optionnel
  "content_json": {}, // Optionnel
  "path": "nouveau-slug", // Optionnel
  "category": ["Catégorie1", "Catégorie2"] // Optionnel
}
\`\`\`

## Actualités

### Récupérer toutes les actualités
\`\`\`
GET /api/actus
\`\`\`
Réponse : Un tableau d'objets actualités, chacun contenant un champ \`category\` qui est un tableau de chaînes.

### Récupérer une actualité spécifique
\`\`\`
GET /api/actus/:id
\`\`\`
Réponse : Un objet actualité contenant un champ \`category\` qui est un tableau de chaînes.

### Créer une nouvelle actualité
\`\`\`
POST /api/actus
\`\`\`
Body (FormData) :
- date : "YYYY-MM-DD"
- titre : "Titre de l'actualité"
- text_preview : "Aperçu de l'actualité"
- content_json : {}
- image : Fichier (optionnel)
- category : "[\\\"Catégorie1\\\", \\\"Catégorie2\\\"]" (chaîne JSON, optionnel)

### Mettre à jour une actualité
\`\`\`
PATCH /api/actus/:id
\`\`\`
Body (FormData) :
- date : "YYYY-MM-DD" (optionnel)
- titre : "Nouveau titre" (optionnel)
- text_preview : "Nouvel aperçu" (optionnel)
- content_json : {} (optionnel)
- image : Fichier (optionnel)
- category : "[\\\"Catégorie1\\\", \\\"Catégorie2\\\"]" (chaîne JSON, optionnel)

## Notes importantes

1. Pour les articles, le champ \`category\` est envoyé et reçu comme un tableau JSON.
2. Pour les actualités, comme on utilise FormData pour l'upload d'image, le champ \`category\` doit être envoyé sous forme de chaîne JSON.
3. Lors de la récupération des données (GET), le champ \`category\` sera une chaîne JSON que vous devrez parser côté frontend :
   \`\`\`javascript
   const categories = JSON.parse(article.category || '[]');
   \`\`\`
4. Les catégories sont facultatives lors de la création/mise à jour. Si non fournies, un tableau vide est utilisé.
`;

// Écrire la documentation dans un fichier
fs.writeFileSync('api-categories-doc.md', docContent);

console.log('Documentation pour le développeur frontend créée dans api-categories-doc.md'); 