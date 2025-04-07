const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Exemple de route
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API du backend RIM Conseil v2 ✨');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});