# 📋 API Guide - Gestion des Bullet Points

## 🎯 Vue d'ensemble
Cette API permet d'ajouter et supprimer des bullet points (éléments de liste) dans le contenu des pages de manière dynamique.

## 🔧 Configuration de base

```javascript
const API_BASE = 'http://localhost:4000';
const token = localStorage.getItem('authToken');

// Headers requis
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## 📝 Endpoints disponibles

### 1. Récupérer le contenu d'une page
```http
GET /api/editable-content/{pageName}
```

**Exemple :**
```javascript
const response = await fetch(`${API_BASE}/api/editable-content/notre-equipe`, {
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
```

### 2. Mettre à jour un élément (avec bullet points)
```http
PATCH /api/editable-content/element
```

**Headers requis :**
- `Content-Type: application/json`
- `Authorization: Bearer {token}`

## 🎯 Fonctions pour les Bullet Points

### 1. Ajouter un bullet point

```javascript
// Ajouter un bullet point à une liste existante
const addBulletPoint = async (pageName, selector, newItem, position = 'end') => {
  try {
    // Récupérer le contenu actuel
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      // Parser le HTML existant
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      // Trouver ou créer la liste
      let list = doc.querySelector('ul, ol');
      if (!list) {
        // Créer une nouvelle liste si elle n'existe pas
        list = doc.createElement('ul');
        doc.body.appendChild(list);
      }
      
      // Créer le nouvel élément
      const newLi = doc.createElement('li');
      newLi.textContent = newItem;
      
      // Insérer à la position demandée
      if (position === 'start') {
        list.insertBefore(newLi, list.firstChild);
      } else if (typeof position === 'number') {
        const existingItems = list.querySelectorAll('li');
        if (existingItems[position]) {
          list.insertBefore(newLi, existingItems[position]);
        } else {
          list.appendChild(newLi);
        }
      } else {
        list.appendChild(newLi);
      }
      
      // Mettre à jour le contenu
      const newContent = doc.body.innerHTML;
      
      const updateResponse = await fetch(`${API_BASE}/api/editable-content/element`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: 'list'
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Bullet point ajouté');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error);
    throw error;
  }
};
```

### 2. Supprimer un bullet point par contenu

```javascript
// Supprimer un bullet point spécifique
const removeBulletPoint = async (pageName, selector, itemToRemove) => {
  try {
    // Récupérer le contenu actuel
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      // Parser le HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      // Trouver et supprimer l'élément
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(li => {
        if (li.textContent.includes(itemToRemove)) {
          li.remove();
        }
      });
      
      // Mettre à jour le contenu
      const newContent = doc.body.innerHTML;
      
      const updateResponse = await fetch(`${API_BASE}/api/editable-content/element`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({
          page_name: pageName,
          element_selector: selector,
          content_html: newContent,
          element_type: 'list'
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Bullet point supprimé');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};
```

### 3. Supprimer un bullet point par index

```javascript
// Supprimer un bullet point par sa position
const removeBulletPointByIndex = async (pageName, selector, index) => {
  try {
    // Récupérer le contenu actuel
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      // Parser le HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      // Supprimer l'élément à l'index donné
      const listItems = doc.querySelectorAll('li');
      if (listItems[index]) {
        listItems[index].remove();
        
        // Mettre à jour le contenu
        const newContent = doc.body.innerHTML;
        
        const updateResponse = await fetch(`${API_BASE}/api/editable-content/element`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            page_name: pageName,
            element_selector: selector,
            content_html: newContent,
            element_type: 'list'
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Bullet point à l'index ${index} supprimé`);
          return true;
        }
      } else {
        throw new Error(`Index ${index} non trouvé`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};
```

### 4. Modifier un bullet point existant

```javascript
// Modifier le contenu d'un bullet point
const updateBulletPoint = async (pageName, selector, oldText, newText) => {
  try {
    // Récupérer le contenu actuel
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      // Parser le HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      
      // Trouver et modifier l'élément
      const listItems = doc.querySelectorAll('li');
      let updated = false;
      
      listItems.forEach(li => {
        if (li.textContent.includes(oldText)) {
          li.textContent = newText;
          updated = true;
        }
      });
      
      if (updated) {
        // Mettre à jour le contenu
        const newContent = doc.body.innerHTML;
        
        const updateResponse = await fetch(`${API_BASE}/api/editable-content/element`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            page_name: pageName,
            element_selector: selector,
            content_html: newContent,
            element_type: 'list'
          })
        });
        
        if (updateResponse.ok) {
          console.log('✅ Bullet point modifié');
          return true;
        }
      } else {
        throw new Error(`Bullet point "${oldText}" non trouvé`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
    throw error;
  }
};
```

### 5. Vider toute la liste

```javascript
// Supprimer tous les bullet points
const clearAllBulletPoints = async (pageName, selector) => {
  try {
    const updateResponse = await fetch(`${API_BASE}/api/editable-content/element`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({
        page_name: pageName,
        element_selector: selector,
        content_html: '<ul></ul>',
        element_type: 'list'
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Tous les bullet points supprimés');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};
```

## 📋 Exemples d'utilisation

### Exemple 1: Ajouter des bullet points
```javascript
// Ajouter à la fin
await addBulletPoint('notre-equipe', '.skills-list', 'JavaScript');

// Ajouter au début
await addBulletPoint('notre-equipe', '.skills-list', 'React', 'start');

// Ajouter à une position spécifique
await addBulletPoint('notre-equipe', '.skills-list', 'Vue.js', 2);
```

### Exemple 2: Supprimer des bullet points
```javascript
// Supprimer par contenu
await removeBulletPoint('notre-equipe', '.skills-list', 'JavaScript');

// Supprimer par index
await removeBulletPointByIndex('notre-equipe', '.skills-list', 0);

// Vider toute la liste
await clearAllBulletPoints('notre-equipe', '.skills-list');
```

### Exemple 3: Modifier des bullet points
```javascript
// Modifier le contenu
await updateBulletPoint('notre-equipe', '.skills-list', 'JavaScript', 'JavaScript ES6+');
```

## 🎨 Format HTML généré

### Liste à puces (ul)
```html
<ul>
  <li>Premier élément</li>
  <li>Deuxième élément</li>
  <li>Troisième élément</li>
</ul>
```

### Liste numérotée (ol)
```html
<ol>
  <li>Premier élément</li>
  <li>Deuxième élément</li>
  <li>Troisième élément</li>
</ol>
```

## ⚠️ Gestion d'erreurs

### Codes d'erreur courants
- **400** : Données invalides
- **401** : Non authentifié
- **404** : Élément non trouvé
- **500** : Erreur serveur

### Exemple de gestion d'erreurs
```javascript
try {
  await addBulletPoint('notre-equipe', '.skills-list', 'Nouveau skill');
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Non authentifié - Veuillez vous reconnecter');
  } else if (error.message.includes('404')) {
    console.error('Élément non trouvé');
  } else {
    console.error('Erreur:', error.message);
  }
}
```

## 🔧 Fonctions utilitaires

### Vérifier si une liste existe
```javascript
const listExists = async (pageName, selector) => {
  try {
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`);
    const data = await response.json();
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      const list = doc.querySelector('ul, ol');
      return !!list;
    }
    return false;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};
```

### Compter les bullet points
```javascript
const countBulletPoints = async (pageName, selector) => {
  try {
    const response = await fetch(`${API_BASE}/api/editable-content/${pageName}`);
    const data = await response.json();
    const element = data.elements.find(el => el.element_selector === selector);
    
    if (element) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(element.content_html, 'text/html');
      const listItems = doc.querySelectorAll('li');
      return listItems.length;
    }
    return 0;
  } catch (error) {
    console.error('Erreur:', error);
    return 0;
  }
};
```

## 🚀 Test de l'API

### Script de test complet
```javascript
const testBulletPointsAPI = async () => {
  console.log('🧪 Test de l\'API Bullet Points...');
  
  const pageName = 'notre-equipe';
  const selector = '.skills-list';
  
  try {
    // Test 1: Ajouter des bullet points
    console.log('1. Test d\'ajout...');
    await addBulletPoint(pageName, selector, 'JavaScript');
    await addBulletPoint(pageName, selector, 'React', 'start');
    await addBulletPoint(pageName, selector, 'Vue.js', 1);
    
    // Test 2: Compter les éléments
    const count = await countBulletPoints(pageName, selector);
    console.log(`✅ ${count} bullet points trouvés`);
    
    // Test 3: Modifier un élément
    console.log('2. Test de modification...');
    await updateBulletPoint(pageName, selector, 'JavaScript', 'JavaScript ES6+');
    
    // Test 4: Supprimer un élément
    console.log('3. Test de suppression...');
    await removeBulletPoint(pageName, selector, 'React');
    
    // Test 5: Supprimer par index
    console.log('4. Test de suppression par index...');
    await removeBulletPointByIndex(pageName, selector, 0);
    
    console.log('✅ Tous les tests réussis !');
    
  } catch (error) {
    console.error('❌ Test échoué:', error);
  }
};

// Exécuter le test
testBulletPointsAPI();
```

---

*Documentation API Bullet Points - Rimconseil v2.0*
